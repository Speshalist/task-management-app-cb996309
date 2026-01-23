import { useEffect, useRef } from 'react';
import { Task, ColumnId } from '@/types/task';

interface UseMidnightResetProps {
  tasks: Task[];
  onResetTasks: (taskIds: string[], targetColumn: ColumnId) => void;
}

export function useMidnightReset({ tasks, onResetTasks }: UseMidnightResetProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scheduleMidnightReset = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
      );
      const msUntilMidnight = midnight.getTime() - now.getTime();

      console.log(`Midnight reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);

      timeoutRef.current = setTimeout(() => {
        // Find incomplete tasks in "today" column
        const incompleteTodayTasks = tasks.filter(
          (task) => task.columnId === 'today' && !task.completed
        );

        if (incompleteTodayTasks.length > 0) {
          const taskIds = incompleteTodayTasks.map((task) => task.id);
          onResetTasks(taskIds, 'queue');
          console.log(`Reset ${taskIds.length} incomplete tasks back to queue`);
        }

        // Schedule next reset
        scheduleMidnightReset();
      }, msUntilMidnight);
    };

    scheduleMidnightReset();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tasks, onResetTasks]);
}
