import { format } from 'date-fns';
import { Check, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ColumnId, PRIORITY_LABELS, Task } from '@/types/task';

interface TaskTableViewProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
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

const columnLabels: Record<ColumnId, string> = {
  queue: 'Queue',
  today: 'Today',
  waiting: 'Waiting',
  completed: 'Completed',
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TaskTableView({ tasks, onToggleComplete, onEditTask, onDeleteTask }: TaskTableViewProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableCaption>
          {tasks.length === 0 ? 'No tasks to display.' : `${tasks.length} task${tasks.length === 1 ? '' : 's'} in the current view.`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Est.</TableHead>
            <TableHead>Tracked</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                Import a backup or add a task to get started.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} className={cn(task.completed && 'opacity-70')}>
                <TableCell>
                  <div className="space-y-1">
                    <div className={cn('font-medium', task.completed && 'line-through')}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="max-w-[320px] truncate text-sm text-muted-foreground">
                        {task.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn('priority-badge', projectColorClasses[task.projectColor])}>
                    {task.project}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn('priority-badge', priorityClasses[task.priority])}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </TableCell>
                <TableCell>{columnLabels[task.columnId]}</TableCell>
                <TableCell>{task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell>{task.estimatedMinutes} min</TableCell>
                <TableCell className="font-mono text-xs">{formatTime(task.timeSpentSeconds)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant={task.completed ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => onToggleComplete(task.id)}
                    >
                      <Check className="h-4 w-4" />
                      {task.completed ? 'Reopen' : 'Complete'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTask(task)}
                      title="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" title="Delete task">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove &quot;{task.title}&quot; from your board.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDeleteTask(task.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}