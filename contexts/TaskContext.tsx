
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../types';

interface TaskContextType {
  tasks: Task[];
  showToDoWidget: boolean;
  addTask: (task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleTimer: (id: string) => void;
  toggleWidget: () => void;
  setShowToDoWidget: (show: boolean) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showToDoWidget, setShowToDoWidget] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (window.api) {
          const fromDisk = await window.api.storage.get<Task[]>('tasks');
          if (fromDisk) {
              setTasks(fromDisk);
          } else {
              const local = localStorage.getItem('study-hub-tasks');
              if (local) {
                  try {
                      const parsed = JSON.parse(local);
                      setTasks(parsed);
                      window.api.storage.set('tasks', parsed);
                      localStorage.removeItem('study-hub-tasks');
                  } catch (e) {
                      console.error("Erro na migração de tarefas:", e);
                  }
              }
          }
          setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded && window.api) {
        const handler = setTimeout(() => {
            window.api.storage.set('tasks', tasks);
        }, 5000); 
        return () => clearTimeout(handler);
    }
  }, [tasks, isLoaded]);

  // --- TIMER TICKER COM NOTIFICAÇÕES NATIVAS ---
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTasks(prevTasks => {
        const hasRunning = prevTasks.some(t => t.isTimerRunning);
        if (!hasRunning) return prevTasks;

        return prevTasks.map(task => {
          if (task.isTimerRunning && task.remainingTime !== undefined) {
            if (task.remainingTime <= 1) { // Mudança para 1 para detectar o exato fim
                // Dispara notificação nativa ao zerar
                if (Notification.permission === 'granted') {
                    new Notification('Study Hub: Tempo esgotado! ⏳', {
                        body: `Sua sessão de foco em "${task.title}" terminou. Hora de uma pausa!`,
                        silent: false
                    });
                }
                return { ...task, remainingTime: 0, isTimerRunning: false, completed: true };
            }
            return { ...task, remainingTime: task.remainingTime - 1 };
          }
          return task;
        });
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    if (window.api) {
        const removeTodo = window.api.onToggleTodo(() => setShowToDoWidget(prev => !prev));
        return () => { if(removeTodo) removeTodo(); };
    }
  }, []);

  const addTask = useCallback((task: Partial<Task>) => {
    setTasks(prev => [...prev, { 
      id: Date.now().toString(), 
      title: task.title || 'Sem título', 
      completed: false, 
      type: task.type || 'SIMPLE', 
      duration: task.duration, 
      remainingTime: task.remainingTime, 
      createdAt: Date.now(), 
      isTimerRunning: false,
      routineId: task.routineId 
    }]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, isTimerRunning: false } : t));
  }, []);

  const toggleTimer = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isTimerRunning: !t.isTimerRunning } : { ...t, isTimerRunning: false }));
    setShowToDoWidget(true);
  }, []);

  const toggleWidget = useCallback(() => {
      setShowToDoWidget(prev => !prev);
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks,
      showToDoWidget,
      addTask,
      deleteTask,
      toggleTask,
      toggleTimer,
      toggleWidget,
      setShowToDoWidget
    }}>
      {children}
    </TaskContext.Provider>
  );
};
