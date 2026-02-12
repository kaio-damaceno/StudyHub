
import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { useTasks } from '../../contexts/TaskContext';
import { Task } from '../../types';
import { useContextMenu } from '../../hooks/useContextMenu';

interface TaskViewProps {
  onOpenSchedule: () => void;
}

const TaskView: React.FC<TaskViewProps> = ({ 
  onOpenSchedule
}) => {
  const { tasks, addTask, deleteTask, toggleTask, toggleTimer, toggleWidget } = useTasks();
  const { handleContextMenu } = useContextMenu();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'SIMPLE' | 'TIMED' | 'ROUTINE'>('SIMPLE');
  
  // Duração dividida em horas e minutos
  const [durationHours, setDurationHours] = useState<string>('0');
  const [durationMinutes, setDurationMinutes] = useState<string>('25');

  const handleQuickAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskTitle.trim() || activeTab === 'ROUTINE') return;

      const h = parseInt(durationHours) || 0;
      const m = parseInt(durationMinutes) || 0;
      let totalMinutes = (h * 60) + m;

      // Se o usuário não colocou nada ou zero, padrão para 25 se for timed
      if (activeTab === 'TIMED' && totalMinutes <= 0) totalMinutes = 25;

      addTask({
          title: newTaskTitle,
          type: activeTab === 'TIMED' ? 'TIMED' : 'SIMPLE',
          duration: activeTab === 'TIMED' ? totalMinutes : undefined,
          remainingTime: activeTab === 'TIMED' ? totalMinutes * 60 : undefined,
      });

      setNewTaskTitle('');
      setDurationHours('0');
      setDurationMinutes('25');
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const formatTime = (seconds?: number) => {
      if (seconds === undefined) return '';
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const onTaskContextMenu = (e: React.MouseEvent, task: Task) => {
      const items: any[] = [
          { label: task.completed ? 'Reabrir' : 'Concluir', icon: 'checkSquare', onClick: () => toggleTask(task.id) }
      ];

      if (task.type === 'TIMED') {
          items.push({ 
              label: task.isTimerRunning ? 'Pausar Foco' : 'Iniciar Foco', 
              icon: task.isTimerRunning ? 'pause' : 'play',
              onClick: () => toggleTimer(task.id)
          });
      }

      items.push({ type: 'separator' });
      items.push({ label: 'Excluir', icon: 'trash', variant: 'danger', onClick: () => deleteTask(task.id) });

      handleContextMenu(e, items);
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row bg-[#0a0e27] overflow-hidden animate-[fadeIn_0.3s_ease]">
       
       {/* COLUNA ESQUERDA (Superior no Mobile): Painel de Criação */}
       <div className="w-full md:w-[360px] bg-[#0f1223] border-r border-white/5 flex flex-col p-4 md:p-8 relative shrink-0 overflow-y-auto max-h-[40vh] md:max-h-full">
          
          <div className="mb-4 md:mb-8 flex items-start justify-between">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Minhas Tarefas</h1>
                <p className="text-xs text-gray-400">Foco diário e organização.</p>
            </div>
          </div>

          <div className="bg-[#14182d] p-1 rounded-xl border border-white/5 mb-4">
             <div className="flex p-1 bg-[#0a0e27] rounded-lg mb-4 border border-white/5">
                 <button 
                    onClick={() => setActiveTab('SIMPLE')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'SIMPLE' ? 'bg-[#1e233c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                    Simples
                 </button>
                 <button 
                    onClick={() => setActiveTab('TIMED')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'TIMED' ? 'bg-[#1e233c] text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                    Foco
                 </button>
                 <button 
                    onClick={() => setActiveTab('ROUTINE')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'ROUTINE' ? 'bg-[#1e233c] text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                    Rotina
                 </button>
             </div>

             {activeTab === 'ROUTINE' ? (
                 <div className="px-4 py-8 text-center">
                     <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                         <Icon name="calendar" size={24} />
                     </div>
                     <p className="text-sm text-gray-300 font-medium mb-2">Gerenciar Cronograma</p>
                     <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                         Rotinas recorrentes e horários de aula devem ser configurados no gerenciador visual.
                     </p>
                     <button 
                        onClick={onOpenSchedule}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors w-full"
                     >
                         Abrir Cronograma
                     </button>
                 </div>
             ) : (
                 <form onSubmit={handleQuickAdd} className="px-3 pb-3">
                     <div className="space-y-4">
                        <div>
                            <input 
                                type="text" 
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder={activeTab === 'TIMED' ? "O que você vai estudar?" : "O que precisa ser feito?"}
                                className="w-full bg-[#0a0e27] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:bg-[#0f1223] focus:border-blue-500/30 outline-none placeholder-gray-600 transition-all"
                                autoFocus={window.innerWidth > 768} // Evita teclado abrir sozinho no mobile
                            />
                        </div>

                        {activeTab === 'TIMED' && (
                            <div className="space-y-2 animate-[fadeIn_0.2s_ease]">
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                                    Tempo de Foco
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center bg-[#0a0e27] border border-white/5 rounded-lg px-3 overflow-hidden">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={durationHours}
                                            onChange={(e) => setDurationHours(e.target.value)}
                                            className="w-full bg-transparent border-none text-sm text-white p-2.5 focus:ring-0 outline-none font-mono text-center"
                                            placeholder="0"
                                        />
                                        <span className="text-xs text-gray-500 font-bold pr-1">H</span>
                                    </div>
                                    <div className="flex-1 flex items-center bg-[#0a0e27] border border-white/5 rounded-lg px-3 overflow-hidden">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(e.target.value)}
                                            className="w-full bg-transparent border-none text-sm text-white p-2.5 focus:ring-0 outline-none font-mono text-center"
                                            placeholder="0"
                                        />
                                        <span className="text-xs text-gray-500 font-bold pr-1">Min</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button 
                            disabled={!newTaskTitle} 
                            className={`
                                w-full text-[#0a0e27] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wide py-3 rounded-lg transition-all shadow-lg
                                ${activeTab === 'TIMED' ? 'bg-purple-400 hover:bg-purple-300 shadow-purple-900/20' : 'bg-blue-400 hover:bg-blue-300 shadow-blue-900/20'}
                            `}
                        >
                            Adicionar
                        </button>
                     </div>
                 </form>
             )}
          </div>

          <button 
            onClick={toggleWidget}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-[#1e233c] to-[#252b48] hover:from-blue-900/20 hover:to-blue-900/30 border border-blue-400/20 rounded-xl p-5 flex items-center gap-4 transition-all shadow-lg hover:shadow-blue-900/20 mb-6 hidden md:flex"
          >
             <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-[#0a0e27] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Icon name="externalLink" size={24} />
             </div>
             <div className="text-left flex-1">
                <div className="text-base font-bold text-white group-hover:text-blue-100 transition-colors">Iniciar Widget</div>
                <div className="text-xs text-gray-400">Modo flutuante para focar</div>
             </div>
             <div className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-400">
                <Icon name="arrowRight" size={20} />
             </div>
          </button>

          <div className="mt-auto p-4 rounded-xl bg-gradient-to-b from-transparent to-[#14182d] border border-white/5 hidden md:block">
              <div className="flex items-start gap-3">
                  <Icon name="lightbulb" size={20} className="text-gray-600 mt-1" />
                  <div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                          <span className="text-white font-semibold">Dica:</span> Use tarefas de foco para sessões de Pomodoro. O timer continuará rodando no widget flutuante.
                      </p>
                  </div>
              </div>
          </div>
       </div>

       {/* COLUNA DIREITA (Inferior no Mobile): Lista de Tarefas */}
       <div className="flex-1 flex flex-col min-w-0 bg-[#0a0e27] p-4 md:p-8 overflow-hidden h-full">
          <div className="flex items-center justify-between mb-4 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                  Tarefas de Hoje
              </h2>
              <span className="text-xs font-medium text-gray-500 border border-white/10 px-3 py-1.5 rounded-full">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-20 md:pb-0">
              
              <div className="space-y-3">
                  {activeTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 md:py-20 opacity-30">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                             <Icon name="checkSquare" size={32} className="text-gray-400" />
                          </div>
                          <p className="text-gray-400 font-medium">Lista vazia</p>
                      </div>
                  )}
                  
                  {activeTasks.map(task => (
                      <div 
                        key={task.id} 
                        onContextMenu={(e) => onTaskContextMenu(e, task)}
                        className={`
                            group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 relative overflow-hidden cursor-default
                            ${task.isTimerRunning 
                                ? 'bg-[#14182d] border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
                                : 'bg-[#14182d]/50 border-white/[0.03] hover:bg-[#14182d] hover:border-white/10 hover:shadow-lg'
                            }
                        `}
                      >
                          {task.type === 'TIMED' && task.remainingTime !== undefined && task.duration && (
                              <div 
                                className="absolute bottom-0 left-0 h-[2px] bg-purple-500/50 transition-all duration-1000"
                                style={{ width: `${Math.min(100, (task.remainingTime / (task.duration * 60)) * 100)}%` }}
                              />
                          )}

                          {task.type === 'TIMED' ? (
                              <button 
                                onClick={() => toggleTimer(task.id)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${task.isTimerRunning ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#1e233c] text-purple-400 hover:bg-purple-500 hover:text-white'}`}
                              >
                                  <Icon name={task.isTimerRunning ? "pause" : "play"} size={16} className="fill-current ml-0.5" />
                              </button>
                          ) : (
                              <button 
                                onClick={() => toggleTask(task.id)}
                                className="w-6 h-6 rounded-md border-2 border-gray-700 flex items-center justify-center hover:border-blue-500 hover:bg-blue-500/10 transition-colors shrink-0"
                              >
                              </button>
                          )}

                          <div className="flex-1 min-w-0 py-1">
                              <div className="text-sm md:text-[15px] text-gray-200 font-medium truncate">{task.title}</div>
                              <div className="flex items-center gap-3 mt-1.5">
                                  {task.type === 'TIMED' && (
                                      <span className={`text-xs font-mono font-medium flex items-center gap-1.5 ${task.isTimerRunning ? 'text-purple-300' : 'text-gray-500'}`}>
                                          <Icon name="clock" size={12} /> 
                                          {formatTime(task.remainingTime)}
                                      </span>
                                  )}
                                  {task.routineId && (
                                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-bold tracking-wider">
                                          Rotina
                                      </span>
                                  )}
                              </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                    onClick={() => toggleTask(task.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all"
                                    title="Concluir"
                               >
                                   <Icon name="checkSquare" size={16} />
                               </button>
                               <button 
                                    onClick={() => deleteTask(task.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    title="Excluir"
                               >
                                   <Icon name="trash" size={16} />
                               </button>
                          </div>
                      </div>
                  ))}
              </div>

              {completedTasks.length > 0 && (
                  <div className="pt-8">
                      <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-4 flex items-center gap-3">
                          Concluídas ({completedTasks.length})
                          <div className="h-[1px] flex-1 bg-white/5"></div>
                      </h3>
                      <div className="space-y-2 opacity-70 md:opacity-50 hover:opacity-100 transition-opacity">
                          {completedTasks.map(task => (
                              <div 
                                key={task.id} 
                                onContextMenu={(e) => onTaskContextMenu(e, task)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#14182d] border border-transparent hover:border-white/5 transition-colors group cursor-default"
                              >
                                  <button onClick={() => toggleTask(task.id)} className="text-green-500">
                                      <Icon name="checkSquare" size={16} />
                                  </button>
                                  <span className="text-sm text-gray-500 line-through flex-1 truncate">{task.title}</span>
                                  <button onClick={() => deleteTask(task.id)} className="text-gray-700 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Icon name="x" size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

          </div>
       </div>
    </div>
  );
};

export default TaskView;
