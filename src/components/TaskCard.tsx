import { Task, PRIORITY_LABELS } from '@/types/task';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Clock, Check, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const priorityClasses: Record<string, string> = {
  high: 'bg-priority-high/15 text-priority-high',
  medium: 'bg-priority-medium/15 text-priority-medium',
  low: 'bg-priority-low/15 text-priority-low',
  none: 'bg-priority-none/15 text-priority-none',
};

const projectColorClasses: Record<string, string> = {
  blue: 'bg-project-blue/15 text-project-blue',
  green: 'bg-project-green/15 text-project-green',
  orange: 'bg-project-orange/15 text-project-orange',
  purple: 'bg-project-purple/15 text-project-purple',
  pink: 'bg-project-pink/15 text-project-pink',
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TaskCard({ task, index, onToggleComplete, onEdit }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'task-card group',
            snapshot.isDragging && 'task-card-dragging',
            task.completed && 'opacity-60'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className={cn(
              'font-semibold text-card-foreground leading-tight',
              task.completed && 'line-through'
            )}>
              {task.title}
            </h3>
            <button
              onClick={() => onEdit(task)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {task.dueDate && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Calendar className="w-3 h-3" />
                {format(task.dueDate, 'MMM d, yyyy')}
              </span>
            )}
            <span className={cn('priority-badge', projectColorClasses[task.projectColor])}>
              {task.project}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('priority-badge', priorityClasses[task.priority])}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {task.estimatedMinutes} min
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="time-display text-xs">
                {formatTime(task.timeSpentSeconds)}
              </span>
              <button
                onClick={() => onToggleComplete(task.id)}
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
                  task.completed 
                    ? 'bg-priority-low border-priority-low text-white' 
                    : 'border-muted-foreground/30 hover:border-priority-low'
                )}
              >
                {task.completed && <Check className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
