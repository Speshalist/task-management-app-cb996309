import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, ColumnId } from '@/types/task';
import { TaskColumn } from './TaskColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMidnightReset } from '@/hooks/useMidnightReset';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Finish White Label Funnel',
    description: 'Complete the perspective funnel setup',
    project: 'Work',
    projectColor: 'blue',
    priority: 'none',
    estimatedMinutes: 60,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 25),
    completed: false,
    columnId: 'queue',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Build Airtable Integration',
    description: 'Shopify + recording automation',
    project: 'Side Project',
    projectColor: 'green',
    priority: 'medium',
    estimatedMinutes: 90,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 25),
    completed: false,
    columnId: 'queue',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Shoot Website Workshop',
    description: 'Structure, copy, live build for Prompt Genie',
    project: 'Side Project',
    projectColor: 'green',
    priority: 'low',
    estimatedMinutes: 90,
    timeSpentSeconds: 3,
    dueDate: new Date(2025, 3, 25),
    completed: false,
    columnId: 'queue',
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Film Facebook Ads Walkthrough',
    description: 'Funnel + Ads walkthrough',
    project: 'Side Project',
    projectColor: 'green',
    priority: 'low',
    estimatedMinutes: 90,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 18),
    completed: false,
    columnId: 'queue',
    createdAt: new Date(),
  },
  {
    id: '5',
    title: 'Questions For Content Strategy',
    description: 'Revise doc for Connor',
    project: 'Personal',
    projectColor: 'purple',
    priority: 'none',
    estimatedMinutes: 30,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 15),
    completed: false,
    columnId: 'today',
    createdAt: new Date(),
  },
  {
    id: '6',
    title: 'Finish Call Setting Flow',
    description: 'Niche Specific Videos + iMessage Flows',
    project: 'Work',
    projectColor: 'blue',
    priority: 'none',
    estimatedMinutes: 60,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 18),
    completed: false,
    columnId: 'today',
    createdAt: new Date(),
  },
  {
    id: '7',
    title: 'Create VSL Deck',
    description: 'Gamma presentation',
    project: 'Work',
    projectColor: 'blue',
    priority: 'none',
    estimatedMinutes: 60,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 15),
    completed: false,
    columnId: 'today',
    createdAt: new Date(),
  },
  {
    id: '8',
    title: 'Create UC Sales Deck',
    description: 'Gamma presentation for UC',
    project: 'Work',
    projectColor: 'blue',
    priority: 'none',
    estimatedMinutes: 90,
    timeSpentSeconds: 0,
    dueDate: new Date(2025, 3, 18),
    completed: false,
    columnId: 'today',
    createdAt: new Date(),
  },
];

const columns: { id: ColumnId; title: string }[] = [
  { id: 'queue', title: 'Queue' },
  { id: 'today', title: 'Today' },
  { id: 'waiting', title: 'Waiting' },
];

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>('queue');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
        />
      </div>
    </div>
  );
}
