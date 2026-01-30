import { useState } from 'react';
import { ProjectColor, PROJECT_COLORS } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
}

interface ProjectEditorProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onClose?: () => void;
}

const colorOptions: { value: ProjectColor; label: string }[] = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
];

export function ProjectEditor({ project, onUpdate, onClose }: ProjectEditorProps) {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState<ProjectColor>(project.color);

  const handleSave = () => {
    if (name.trim()) {
      onUpdate({ ...project, name: name.trim(), color });
      onClose?.();
    }
  };

  const handleCancel = () => {
    setName(project.name);
    setColor(project.color);
    onClose?.();
  };

  return (
    <div className="p-3 space-y-3 min-w-[200px]">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="h-8 text-sm"
          autoFocus
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Color</label>
        <div className="flex gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setColor(option.value)}
              className={cn(
                'w-6 h-6 rounded-full transition-all',
                color === option.value && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
              )}
              style={{ backgroundColor: PROJECT_COLORS[option.value] }}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-7 px-2"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="h-7 px-2"
        >
          <Check className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}

interface ProjectSelectItemProps {
  project: Project;
  selected: boolean;
  onSelect: () => void;
  onEdit: (project: Project) => void;
}

export function ProjectSelectItem({ project, selected, onSelect, onEdit }: ProjectSelectItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative group">
      {isEditing ? (
        <ProjectEditor
          project={project}
          onUpdate={(updated) => {
            onEdit(updated);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent',
            selected && 'bg-accent'
          )}
          onClick={onSelect}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PROJECT_COLORS[project.color] }}
            />
            <span className="text-sm">{project.name}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
