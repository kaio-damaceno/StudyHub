
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Routine } from '../types';
import { useTasks } from './TaskContext';

interface RoutineContextType {
  routines: Routine[];
  addRoutine: (routine: Partial<Routine>) => void;
  editRoutine: (id: string, routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const useRoutines = () => {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutines must be used within a RoutineProvider');
  }
  return context;
};

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addTask, tasks } = useTasks();
  
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastNotifiedRoutineRef = useRef<string>(''); // Evita múltiplas notificações no mesmo minuto

  useEffect(() => {
    async function loadData() {
      if (window.api) {
          const fromDisk = await window.api.storage.get<Routine[]>('routines');
          if (fromDisk) {
              setRoutines(fromDisk);
          } else {
              const local = localStorage.getItem('study-hub-routines');
              if (local) {
                  try {
                      const parsed = JSON.parse(local);
                      setRoutines(parsed);
                      window.api.storage.set('routines', parsed);
                      localStorage.removeItem('study-hub-routines');
                  } catch(e) { console.error(e); }
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
            window.api.storage.set('routines', routines);
        }, 1000);
        return () => clearTimeout(handler);
    }
  }, [routines, isLoaded]);

  const routinesRef = useRef(routines);
  const tasksRef = useRef(tasks);

  useEffect(() => { routinesRef.current = routines; }, [routines]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // --- SCHEDULER DE ROTINA COM NOTIFICAÇÕES PRECISAS ---
  useEffect(() => {
    const checkRoutines = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0-6
      const currentTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      // Formato YYYY-MM-DD local para comparar com specificDate
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      const currentRoutines = routinesRef.current;
      const currentTasks = tasksRef.current;
      
      const existingRoutineTaskIds = new Set();
      currentTasks.forEach(t => {
          // Checa se já existe tarefa criada hoje para esta rotina
          if (t.routineId) {
              const taskDate = new Date(t.createdAt);
              const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth()+1).padStart(2,'0')}-${String(taskDate.getDate()).padStart(2,'0')}`;
              
              if (taskDateStr === todayStr) {
                  existingRoutineTaskIds.add(t.routineId);
              }
          }
      });

      currentRoutines.forEach(routine => {
        let isToday = false;

        if (routine.specificDate) {
            // Se tem data específica, ignora dia da semana e scope
            if (routine.specificDate === todayStr) isToday = true;
        } else {
            // Lógica recorrente padrão (dias da semana)
            if (routine.days.includes(currentDay)) isToday = true;
        }
        
        if (!isToday) return;
        
        // 1. Lógica de Adição de Tarefa Diária (Background Auto-Add)
        if (!existingRoutineTaskIds.has(routine.id)) {
            addTask({
                title: routine.title, 
                type: routine.duration ? 'TIMED' : 'SIMPLE',
                duration: routine.duration, 
                remainingTime: routine.duration ? routine.duration * 60 : undefined,
                routineId: routine.id
            });
            existingRoutineTaskIds.add(routine.id);
        }

        // 2. Lógica de Notificação Push no Horário Exato
        const notifyKey = `${routine.id}-${currentTimeStr}-${todayStr}`;
        if (routine.time === currentTimeStr && lastNotifiedRoutineRef.current !== notifyKey) {
             if (Notification.permission === 'granted') {
                new Notification('Estudo Iniciado 📅', {
                    body: `Está na hora de: ${routine.title}. Vamos começar agora?`,
                    icon: 'favicon.png'
                });
             }
             lastNotifiedRoutineRef.current = notifyKey;
        }
      });
    };
    
    // Verifica a cada 20 segundos para garantir que não perde o "minuto de ouro"
    const interval = setInterval(checkRoutines, 20000);
    const timeout = setTimeout(checkRoutines, 2000);
    
    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, [addTask]);

  const addRoutine = useCallback((data: Partial<Routine>) => {
    setRoutines(prev => [...prev, { 
        id: Date.now().toString(), 
        color: '#3b82f6', 
        scope: 'WEEKLY', 
        month: new Date().getMonth(), 
        year: new Date().getFullYear(), 
        days: [], 
        time: '08:00', 
        title: 'Nova Rotina', 
        ...data 
    }]);
  }, []);

  const editRoutine = useCallback((id: string, updates: Partial<Routine>) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <RoutineContext.Provider value={{
      routines,
      addRoutine,
      editRoutine,
      deleteRoutine
    }}>
      {children}
    </RoutineContext.Provider>
  );
};
