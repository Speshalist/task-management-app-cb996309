import { Task, ColumnId } from '@/types/task';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskColumnProps {
  id: ColumnId;
  title: string;
  tasks: Task[];
  onAddTask: (columnId: ColumnId) => void;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onTimeUpdate: (taskId: string, seconds: number) => void;
}

const columnBgClasses: Record<ColumnId, string> = {
  queue: 'bg-column-queue',
  today: 'bg-column-today',
  waiting: 'bg-column-waiting',
};

function formatTotalTime(tasks: Task[]): string {
  const totalMinutes = tasks.reduce((acc, task) => acc + task.estimatedMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function TaskColumn({ id, title, tasks, onAddTask, onToggleComplete, onEditTask, onTimeUpdate }: TaskColumnProps) {
  return (
    <div className={cn(
      'flex flex-col rounded-xl p-4 min-w-[320px] max-w-[360px]',
      columnBgClasses[id]
    )}>
      <div className="column-header">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <div className="column-stats">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTotalTime(tasks)}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          onClick={() => onAddTask(id)}
          className="p-1.5 hover:bg-card rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 space-y-3 min-h-[200px] transition-colors rounded-lg p-1',
              snapshot.isDraggingOver && 'bg-primary/5'
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onTimeUpdate={onTimeUpdate}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
