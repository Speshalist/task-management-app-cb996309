export type Priority = 'high' | 'medium' | 'low' | 'none';
export type ProjectColor = 'blue' | 'green' | 'orange' | 'purple' | 'pink';
export type ColumnId = 'queue' | 'today' | 'waiting' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  projectColor: ProjectColor;
  priority: Priority;
  estimatedMinutes: number;
  timeSpentSeconds: number;
  dueDate: Date | null;
  completed: boolean;
  columnId: ColumnId;
  createdAt: Date;
}

export interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Urgent',
  medium: 'Important',
  low: 'Low',
  none: 'Unlimited',
};

export const PROJECT_COLORS: Record<ProjectColor, string> = {
  blue: 'hsl(var(--project-blue))',
  green: 'hsl(var(--project-green))',
  orange: 'hsl(var(--project-orange))',
  purple: 'hsl(var(--project-purple))',
  pink: 'hsl(var(--project-pink))',
};
