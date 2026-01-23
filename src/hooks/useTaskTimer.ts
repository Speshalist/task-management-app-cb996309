import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTaskTimerProps {
  taskId: string;
  initialSeconds: number;
  onTimeUpdate: (taskId: string, seconds: number) => void;
}

export function useTaskTimer({ taskId, initialSeconds, onTimeUpdate }: UseTaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          onTimeUpdate(taskId, newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, taskId, onTimeUpdate]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning((prev) => !prev), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    onTimeUpdate(taskId, 0);
  }, [taskId, onTimeUpdate]);

  return {
    seconds,
    isRunning,
    start,
    pause,
    toggle,
    reset,
  };
}
