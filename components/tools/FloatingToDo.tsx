import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useTasks } from '../../contexts/TaskContext';

interface FloatingToDoProps {
  onOpenFullView: () => void;
  onClose: () => void;
}

const FloatingToDo: React.FC<FloatingToDoProps> = ({ 
  onOpenFullView,
  onClose 
}) => {
  const { tasks, toggleTask, toggleTimer } = useTasks();

  const [pos, setPos] = useState({ x: window.innerWidth - 360, y: 100 });
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [exitingTasks, setExitingTasks] = useState<string[]>([]);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartTime = useRef(0);

  const activeTasks = tasks.filter(t => !t.completed);
  
  const runningTask = activeTasks.find(t => t.isTimerRunning);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    isDragging.current = true;
    dragStartTime.current = Date.now();
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDelayedToggle = (id: string) => {
      if (exitingTasks.includes(id)) return;

      setExitingTasks(prev => [...prev, id]);

      setTimeout(() => {
          toggleTask(id);
          setExitingTasks(prev => prev.filter(tid => tid !== id));
      }, 300);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render Minimized "Bubble" ---
  if (isMinimized) {
    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={() => {
                if (Date.now() - dragStartTime.current < 200) {
                    setIsMinimized(false);
                }
            }}
            className="fixed z-[9999] cursor-move group select-none animate-[popIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]"
            style={{ left: pos.x, top: pos.y }}
        >
            <style>
                {`
                    @keyframes popIn {
                        0% { transform: scale(0); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}
            </style>
            <div className={`
                w-16 h-16 rounded-full backdrop-blur-xl border flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 active:scale-95
                ${runningTask ? 'bg-blue-900/80 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-[#14182d]/90 border-blue-400/20'}
            `}>
                {runningTask && runningTask.remainingTime !== undefined ? (
                    <>
                        <span className="text-[10px] font-mono font-bold text-white leading-tight tracking-tighter">
                            {formatTime(runningTask.remainingTime).split(':').slice(0,2).join(':')}
                        </span>
                        <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse mt-1"></span>
                    </>
                ) : (
                    <>
                        <span className="text-xl font-bold text-blue-400">{activeTasks.length}</span>
                        <Icon name="checkSquare" size={12} className="text-gray-400 -mt-1" />
                    </>
                )}
                
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                     <Icon name="externalLink" size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div 
      className="fixed bg-[#14182d]/95 backdrop-blur-xl border border-blue-400/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[9999] flex flex-col animate-[fadeIn_0.2s_ease]"
      style={{ 
        left: pos.x, 
        top: pos.y,
        resize: 'both',
        overflow: 'hidden',
        minWidth: '280px',
        minHeight: '200px',
        width: '320px',
      }}
    >
      <header 
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-blue-900/20 to-transparent border-b border-blue-400/15 py-3 px-4 flex justify-between items-center cursor-move select-none flex-shrink-0"
      >
        <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full ${runningTask ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
           <h2 className="text-[13px] font-bold text-blue-100 tracking-wide">Foco Atual</h2>
        </div>
        <div className="flex items-center gap-1">
           <button 
              onClick={() => setIsMinimized(true)} 
              title="Minimizar (Bolha)" 
              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
           >
              <Icon name="minus" size={12} />
           </button>
           <button onClick={onOpenFullView} title="Abrir Gerenciador" className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Icon name="externalLink" size={12} />
           </button>
           <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <Icon name="x" size={12} />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        
        {runningTask && runningTask.remainingTime !== undefined && (
           <div className={`
              bg-gradient-to-b from-blue-900/20 to-transparent p-6 flex flex-col items-center border-b border-blue-400/10 flex-shrink-0
              transition-all duration-300 ease-out
              ${exitingTasks.includes(runningTask.id) ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100'}
           `}>
              <div className="text-[42px] font-mono font-bold text-white leading-none mb-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                 {formatTime(runningTask.remainingTime)}
              </div>
              <div className="text-sm text-blue-200 mb-5 font-medium truncate max-w-full text-center px-2">
                 {runningTask.title}
              </div>
              <div className="flex items-center gap-4">
                 <button 
                    onClick={() => toggleTimer(runningTask.id)}
                    className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 flex items-center justify-center hover:scale-110 transition-transform"
                 >
                    <Icon name="pause" size={20} className="fill-current" />
                 </button>
                 <button 
                    onClick={() => handleDelayedToggle(runningTask.id)}
                    className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 border border-green-500/50 flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                    title="Concluir Tarefa"
                 >
                    <Icon name="checkSquare" size={20} />
                 </button>
              </div>
           </div>
        )}

        <div className="p-3 space-y-1.5">
           {activeTasks.filter(t => t.id !== runningTask?.id).length === 0 && !runningTask ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                 Nenhuma tarefa pendente para hoje.
                 <br />
                 <button onClick={onOpenFullView} className="text-blue-400 hover:underline mt-2">Criar nova tarefa</button>
              </div>
           ) : (
              activeTasks.filter(t => t.id !== runningTask?.id).map(task => (
                 <div 
                    key={task.id} 
                    className={`
                        flex items-center gap-3 p-2.5 bg-[#1e233c]/40 border border-white/5 rounded-lg hover:bg-[#1e233c]/80 group
                        transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                        ${exitingTasks.includes(task.id) 
                            ? 'opacity-0 translate-x-10 scale-95 bg-green-500/10 border-green-500/30' 
                            : 'opacity-100 translate-x-0 scale-100'
                        }
                    `}
                 >
                    {task.type === 'TIMED' ? (
                       <button 
                          onClick={() => toggleTimer(task.id)}
                          className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shrink-0"
                       >
                          <Icon name="play" size={10} className="fill-current ml-0.5" />
                       </button>
                    ) : (
                       <button 
                          onClick={() => handleDelayedToggle(task.id)}
                          className="w-5 h-5 rounded border border-gray-600 flex items-center justify-center hover:border-blue-400 hover:text-blue-400 shrink-0 transition-colors"
                       >
                       </button>
                    )}

                    <div className="flex-1 min-w-0">
                       <div className="text-[13px] text-gray-200 truncate leading-tight">{task.title}</div>
                       {task.type === 'TIMED' && task.remainingTime !== undefined && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                             {formatTime(task.remainingTime)}
                          </div>
                       )}
                    </div>
                    
                    <button 
                         onClick={() => handleDelayedToggle(task.id)}
                         className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-green-400"
                         title="Concluir"
                    >
                        <Icon name="checkSquare" size={14} />
                    </button>

                    {task.routineId && (
                       <Icon name="repeat" size={10} className="text-purple-400 opacity-50" />
                    )}
                 </div>
              ))
           )}
        </div>
      </div>
      
      <div className="absolute bottom-1 right-1 pointer-events-none opacity-30">
         <div className="w-2 h-2 border-r-2 border-b-2 border-white"></div>
      </div>
    </div>
  );
};

export default FloatingToDo;