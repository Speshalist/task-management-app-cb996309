import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, ColumnId, Priority, ProjectColor } from '@/types/task';
import { TaskColumn } from './TaskColumn';
import { TaskTableView } from './TaskTableView';
import { AddTaskDialog } from './AddTaskDialog';
import { Project } from './ProjectEditor';
import { Download, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMidnightReset } from '@/hooks/useMidnightReset';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

const defaultProjects: Project[] = [
  { id: '1', name: 'Personal', color: 'purple' },
  { id: '2', name: 'Work', color: 'blue' },
  { id: '3', name: 'Side Project', color: 'green' },
  { id: '4', name: 'Learning', color: 'orange' },
  { id: '5', name: 'Health', color: 'pink' },
];
const defaultTasks: Task[] = [];

const columns: { id: ColumnId; title: string }[] = [
  { id: 'queue', title: 'Queue' },
  { id: 'today', title: 'Today' },
  { id: 'waiting', title: 'Waiting' },
  { id: 'completed', title: 'Completed' },
];

type ViewMode = 'board' | 'table';

interface TaskBoardExport {
  version: number;
  exportedAt: string;
  tasks: Task[];
  projects: Project[];
  settings: {
    showCompletedColumn: boolean;
  };
}

function isColumnId(value: unknown): value is ColumnId {
  return columns.some((column) => column.id === value);
}

function isPriority(value: unknown): value is Priority {
  return ['high', 'medium', 'low', 'none'].includes(String(value));
}

function isProjectColor(value: unknown): value is ProjectColor {
  return ['blue', 'green', 'orange', 'purple', 'pink'].includes(String(value));
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseRequiredDate(value: unknown): Date {
  const parsed = parseOptionalDate(value);
  return parsed ?? new Date();
}

function normalizeProject(project: unknown, index: number): Project | null {
  if (!project || typeof project !== 'object') {
    return null;
  }

  const candidate = project as Partial<Project>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';

  if (!name) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : `project-${index + 1}`,
    name,
    color: isProjectColor(candidate.color) ? candidate.color : 'purple',
  };
}

function normalizeTask(task: unknown, index: number, projects: Project[]): Task | null {
  if (!task || typeof task !== 'object') {
    return null;
  }

  const candidate = task as Partial<Task>;
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';

  if (!title) {
    return null;
  }

  const projectName = typeof candidate.project === 'string' && candidate.project.trim()
    ? candidate.project.trim()
    : projects[0]?.name ?? 'Personal';
  const matchedProject = projects.find((project) => project.name === projectName);
  const completed = Boolean(candidate.completed);
  const importedColumnId = isColumnId(candidate.columnId) ? candidate.columnId : completed ? 'completed' : 'queue';

  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : `task-${Date.now()}-${index}`,
    title,
    description: typeof candidate.description === 'string' ? candidate.description : '',
    project: projectName,
    projectColor: isProjectColor(candidate.projectColor) ? candidate.projectColor : matchedProject?.color ?? 'purple',
    priority: isPriority(candidate.priority) ? candidate.priority : 'none',
    estimatedMinutes: typeof candidate.estimatedMinutes === 'number' && Number.isFinite(candidate.estimatedMinutes)
      ? Math.max(1, Math.round(candidate.estimatedMinutes))
      : 30,
    timeSpentSeconds: typeof candidate.timeSpentSeconds === 'number' && Number.isFinite(candidate.timeSpentSeconds)
      ? Math.max(0, Math.round(candidate.timeSpentSeconds))
      : 0,
    dueDate: parseOptionalDate(candidate.dueDate),
    completed,
    columnId: completed ? 'completed' : importedColumnId === 'completed' ? 'queue' : importedColumnId,
    createdAt: parseRequiredDate(candidate.createdAt),
  };
}

function parseImportedData(data: unknown): {
  tasks: Task[];
  projects: Project[];
  showCompletedColumn: boolean;
} {
  if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
    throw new Error('The selected file is not valid JSON task data.');
  }

  const rawObject = Array.isArray(data) ? { tasks: data } : data as {
    tasks?: unknown;
    projects?: unknown;
    settings?: { showCompletedColumn?: unknown };
    showCompletedColumn?: unknown;
  };

  const importedProjects = Array.isArray(rawObject.projects)
    ? rawObject.projects
        .map((project, index) => normalizeProject(project, index))
        .filter((project): project is Project => project !== null)
    : defaultProjects;
  const projects = importedProjects.length > 0 ? importedProjects : defaultProjects;

  const tasksSource = Array.isArray(rawObject.tasks) ? rawObject.tasks : [];
  const tasks = tasksSource
    .map((task, index) => normalizeTask(task, index, projects))
    .filter((task): task is Task => task !== null);

  const showCompletedSetting = rawObject.settings?.showCompletedColumn ?? rawObject.showCompletedColumn;

  return {
    tasks,
    projects,
    showCompletedColumn: typeof showCompletedSetting === 'boolean' ? showCompletedSetting : true,
  };
}

export function TaskBoard() {
  const { toast } = useToast();
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskboard-tasks', defaultTasks);
  const [projects, setProjects] = useLocalStorage<Project[]>('taskboard-projects', defaultProjects);
  const [showCompletedColumn, setShowCompletedColumn] = useLocalStorage<boolean>('taskboard-show-completed-column', true);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('taskboard-view-mode', 'board');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>('queue');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const visibleColumns = columns.filter((column) =>
    column.id === 'completed' ? showCompletedColumn : true
  );
  const visibleTasks = showCompletedColumn
    ? tasks
    : tasks.filter((task) => task.columnId !== 'completed');
  const completedTasksCount = tasks.filter((task) => task.completed).length;

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects((prev) => {
      const oldProject = prev.find(p => p.id === updatedProject.id);
      const newProjects = prev.map((p) => 
        p.id === updatedProject.id ? updatedProject : p
      );
      
      // Update tasks that use this project
      if (oldProject && oldProject.name !== updatedProject.name) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.project === oldProject.name
              ? { ...task, project: updatedProject.name, projectColor: updatedProject.color }
              : task.projectColor !== updatedProject.color && task.project === updatedProject.name
              ? { ...task, projectColor: updatedProject.color }
              : task
          )
        );
      } else {
        // Just update the color
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.project === updatedProject.name
              ? { ...task, projectColor: updatedProject.color }
              : task
          )
        );
      }
      
      return newProjects;
    });
  }, []);

  const handleAddProject = useCallback((newProject: Project) => {
    setProjects((prev) => [...prev, newProject]);
  }, []);
  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks.filter((task) => task.columnId === columnId);
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      const taskIndex = updatedTasks.findIndex((t) => t.id === draggableId);
      
      if (taskIndex === -1) return prevTasks;

      const task = { ...updatedTasks[taskIndex] };
      const destinationColumnId = destination.droppableId as ColumnId;
      task.columnId = destinationColumnId;
      task.completed = destinationColumnId === 'completed';

      // Remove from old position
      updatedTasks.splice(taskIndex, 1);

      // Find new position in destination column
      const destTasks = updatedTasks.filter(
        (t) => t.columnId === destination.droppableId
      );
      const insertIndex = updatedTasks.findIndex(
        (t) => t.columnId === destination.droppableId
      );

      if (insertIndex === -1) {
        updatedTasks.push(task);
      } else {
        updatedTasks.splice(insertIndex + destination.index, 0, task);
      }

      return updatedTasks;
    });
  };

  const handleAddTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpentSeconds' | 'completed'>
  ) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      timeSpentSeconds: 0,
      completed: false,
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
    setEditingTask(null);
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;
          // Move to completed column when marked complete, back to queue when uncompleted
          const newColumnId = newCompleted ? 'completed' as ColumnId : 'queue' as ColumnId;
          return { ...task, completed: newCompleted, columnId: newColumnId };
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleTimeUpdate = useCallback((taskId: string, seconds: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, timeSpentSeconds: seconds } : task
      )
    );
  }, []);

  const handleResetTasks = useCallback((taskIds: string[], targetColumn: ColumnId) => {
    setTasks((prev) =>
      prev.map((task) =>
        taskIds.includes(task.id) ? { ...task, columnId: targetColumn } : task
      )
    );
  }, []);

  // Auto-reset incomplete "today" tasks to queue at midnight
  useMidnightReset({ tasks, onResetTasks: handleResetTasks });

  const handleOpenAddDialog = (columnId: ColumnId) => {
    setSelectedColumn(columnId);
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedColumn(task.columnId);
    setDialogOpen(true);
  };

  const handleExportData = () => {
    const exportData: TaskBoardExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      settings: {
        showCompletedColumn,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskboard-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: `Saved ${tasks.length} task${tasks.length === 1 ? '' : 's'} to a JSON file.`,
    });
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedData = parseImportedData(JSON.parse(await file.text()));
      setTasks(importedData.tasks);
      setProjects(importedData.projects);
      setShowCompletedColumn(importedData.showCompletedColumn);
      setEditingTask(null);
      setDialogOpen(false);
      toast({
        title: 'Import complete',
        description: `Loaded ${importedData.tasks.length} task${importedData.tasks.length === 1 ? '' : 's'} and ${importedData.projects.length} project${importedData.projects.length === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unable to read the selected file.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportData}
        />

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold text-foreground">My Board</h1>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="board">Board</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              onClick={() => setShowCompletedColumn((prev) => !prev)}
            >
              {showCompletedColumn
                ? `Hide Completed (${completedTasksCount})`
                : `Show Completed (${completedTasksCount})`}
            </Button>
            <Button variant="outline" onClick={handleImportClick} className="gap-2">
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <Button variant="outline" onClick={handleExportData} className="gap-2">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              onClick={() => handleOpenAddDialog('queue')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </header>

        {viewMode === 'board' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {visibleColumns.map((column) => (
                <TaskColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={getTasksByColumn(column.id)}
                  onAddTask={handleOpenAddDialog}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={handleEditTask}
                  onTimeUpdate={handleTimeUpdate}
                />
              ))}
            </div>
          </DragDropContext>
        ) : (
          <TaskTableView
            tasks={visibleTasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        )}

        <AddTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAddTask={handleAddTask}
          defaultColumnId={selectedColumn}
          editingTask={editingTask}
          onUpdateTask={handleUpdateTask}
          projects={projects}
          onUpdateProject={handleUpdateProject}
          onAddProject={handleAddProject}
        />
      </div>
    </div>
  );
}
