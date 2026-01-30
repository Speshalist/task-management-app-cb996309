import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, ColumnId, ProjectColor } from '@/types/task';
import { TaskColumn } from './TaskColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { Project } from './ProjectEditor';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMidnightReset } from '@/hooks/useMidnightReset';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
];

export function TaskBoard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskboard-tasks', defaultTasks);
  const [projects, setProjects] = useLocalStorage<Project[]>('taskboard-projects', defaultProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>('queue');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
      task.columnId = destination.droppableId as ColumnId;

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
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
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

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Board</h1>
          <Button
            onClick={() => handleOpenAddDialog('queue')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </header>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map((column) => (
              <TaskColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByColumn(column.id)}
                onAddTask={handleOpenAddDialog}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onTimeUpdate={handleTimeUpdate}
              />
            ))}
          </div>
        </DragDropContext>

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
