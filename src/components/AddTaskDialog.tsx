import { useState, useEffect } from 'react';
import { Task, Priority, ProjectColor, ColumnId, PROJECT_COLORS } from '@/types/task';
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
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Project, ProjectSelectItem } from './ProjectEditor';

export interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'timeSpentSeconds' | 'completed'>) => void;
  defaultColumnId: ColumnId;
  editingTask?: Task | null;
  onUpdateTask?: (task: Task) => void;
  projects: Project[];
  onUpdateProject: (project: Project) => void;
  onAddProject: (project: Project) => void;
}

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  onAddTask, 
  defaultColumnId,
  editingTask,
  onUpdateTask,
  projects,
  onUpdateProject,
  onAddProject,
}: AddTaskDialogProps) {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [projectId, setProjectId] = useState(editingTask?.project || projects[0]?.name || 'Personal');
  const [priority, setPriority] = useState<Priority>(editingTask?.priority || 'none');
  const [estimatedMinutes, setEstimatedMinutes] = useState(editingTask?.estimatedMinutes?.toString() || '30');
  const [dueDate, setDueDate] = useState<Date | undefined>(editingTask?.dueDate || undefined);
  const [columnId, setColumnId] = useState<ColumnId>(editingTask?.columnId || defaultColumnId);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState<ProjectColor>('blue');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setProjectId(editingTask.project);
      setPriority(editingTask.priority);
      setEstimatedMinutes(editingTask.estimatedMinutes.toString());
      setDueDate(editingTask.dueDate || undefined);
      setColumnId(editingTask.columnId);
    } else {
      resetForm();
    }
  }, [editingTask, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedProject = projects.find(p => p.name === projectId);
    const projectColor = selectedProject?.color || 'purple';

    if (editingTask && onUpdateTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        project: projectId,
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
        project: projectId,
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
    setProjectId(projects[0]?.name || 'Personal');
    setPriority('none');
    setEstimatedMinutes('30');
    setDueDate(undefined);
    setColumnId(defaultColumnId);
    setShowAddProject(false);
    setNewProjectName('');
  };

  const handleAddNewProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName.trim(),
        color: newProjectColor,
      };
      onAddProject(newProject);
      setProjectId(newProject.name);
      setShowAddProject(false);
      setNewProjectName('');
    }
  };

  const colorOptions: ProjectColor[] = ['blue', 'green', 'orange', 'purple', 'pink'];

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start bg-muted/50 font-normal"
                  >
                    {projects.find(p => p.name === projectId) ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PROJECT_COLORS[projects.find(p => p.name === projectId)?.color || 'purple'] }}
                        />
                        {projectId}
                      </div>
                    ) : (
                      'Select project'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-1" align="start">
                  <div className="space-y-1">
                    {projects.map((proj) => (
                      <ProjectSelectItem
                        key={proj.id}
                        project={proj}
                        selected={proj.name === projectId}
                        onSelect={() => setProjectId(proj.name)}
                        onEdit={onUpdateProject}
                      />
                    ))}
                    
                    {showAddProject ? (
                      <div className="p-2 space-y-2 border-t mt-1">
                        <Input
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Project name"
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewProjectColor(color)}
                              className={cn(
                                'w-5 h-5 rounded-full transition-all',
                                newProjectColor === color && 'ring-2 ring-offset-1 ring-primary'
                              )}
                              style={{ backgroundColor: PROJECT_COLORS[color] }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 flex-1"
                            onClick={() => setShowAddProject(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 flex-1"
                            onClick={handleAddNewProject}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddProject(true)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add project
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
