import { useState } from 'react';
import { Task, Priority, ProjectColor, ColumnId } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'timeSpentSeconds' | 'completed'>) => void;
  defaultColumnId: ColumnId;
  editingTask?: Task | null;
  onUpdateTask?: (task: Task) => void;
}

const projectOptions: { value: string; label: string; color: ProjectColor }[] = [
  { value: 'Personal', label: 'Personal', color: 'purple' },
  { value: 'Work', label: 'Work', color: 'blue' },
  { value: 'Side Project', label: 'Side Project', color: 'green' },
  { value: 'Learning', label: 'Learning', color: 'orange' },
  { value: 'Health', label: 'Health', color: 'pink' },
];

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  onAddTask, 
  defaultColumnId,
  editingTask,
  onUpdateTask 
}: AddTaskDialogProps) {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [project, setProject] = useState(editingTask?.project || 'Personal');
  const [priority, setPriority] = useState<Priority>(editingTask?.priority || 'none');
  const [estimatedMinutes, setEstimatedMinutes] = useState(editingTask?.estimatedMinutes?.toString() || '30');
  const [dueDate, setDueDate] = useState<Date | undefined>(editingTask?.dueDate || undefined);
  const [columnId, setColumnId] = useState<ColumnId>(editingTask?.columnId || defaultColumnId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const projectColor = projectOptions.find(p => p.value === project)?.color || 'purple';

    if (editingTask && onUpdateTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        project,
        projectColor,
        priority,
        estimatedMinutes: parseInt(estimatedMinutes) || 30,
        dueDate: dueDate || null,
        columnId,
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        project,
        projectColor,
        priority,
        estimatedMinutes: parseInt(estimatedMinutes) || 30,
        dueDate: dueDate || null,
        columnId,
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProject('Personal');
    setPriority('none');
    setEstimatedMinutes('30');
    setDueDate(undefined);
    setColumnId(defaultColumnId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="bg-muted/50 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Urgent</SelectItem>
                  <SelectItem value="medium">Important</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="none">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated">Est. Time (min)</Label>
              <Input
                id="estimated"
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                min="1"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={columnId} onValueChange={(v) => setColumnId(v as ColumnId)}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="queue">Queue</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-muted/50',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
