
import React, { useState, useRef, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Routine, RoutineScope } from '../../types';
import { useRoutines } from '../../contexts/RoutineContext';
import { useContextMenu } from '../../hooks/useContextMenu';

const COLORS = [
  { id: 'blue', value: '#3b82f6', label: 'Azul' },
  { id: 'green', value: '#22c55e', label: 'Verde' },
  { id: 'purple', value: '#a855f7', label: 'Roxo' },
  { id: 'orange', value: '#f97316', label: 'Laranja' },
  { id: 'red', value: '#ef4444', label: 'Vermelho' },
  { id: 'pink', value: '#ec4899', label: 'Rosa' },
  { id: 'cyan', value: '#06b6d4', label: 'Ciano' },
];

const DAYS = [
  { id: 1, label: 'Segunda', short: 'Seg' },
  { id: 2, label: 'Terça', short: 'Ter' },
  { id: 3, label: 'Quarta', short: 'Qua' },
  { id: 4, label: 'Quinta', short: 'Qui' },
  { id: 5, label: 'Sexta', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' },
];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WeeklySchedule: React.FC = () => {
  const { routines, addRoutine, editRoutine, deleteRoutine } = useRoutines();
  const { handleContextMenu } = useContextMenu();

  // --- Estado de Visualização ---
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY'); 
  const [currentDate, setCurrentDate] = useState(new Date()); // Data base para o mês visível
  
  // Mobile Specific: Dia focado (0-6)
  const [activeMobileDay, setActiveMobileDay] = useState(new Date().getDay());
  
  // --- Estado do Modal Inteligente ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // --- Campos do Formulário Inteligente ---
  const [planType, setPlanType] = useState<'RECURRING' | 'ONEOFF'>('RECURRING');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState(60);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [specificDate, setSpecificDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Navegação de Datas ---
  const handlePrevMonth = () => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(newDate);
  };

  const handleToday = () => {
      setCurrentDate(new Date());
      setActiveMobileDay(new Date().getDay());
  };

  const handlePrevDay = () => setActiveMobileDay(prev => prev === 0 ? 6 : prev - 1);
  const handleNextDay = () => setActiveMobileDay(prev => prev === 6 ? 0 : prev + 1);

  // --- Lógica de Abertura de Modal ---
  const openNewModal = (type: 'RECURRING' | 'ONEOFF', prefill?: { day?: number, hour?: number, dateStr?: string }) => {
    setEditingId(null);
    setTitle('');
    setTime(prefill?.hour ? `${prefill.hour.toString().padStart(2, '0')}:00` : '08:00');
    setDuration(60);
    setPlanType(type);
    setSelectedColor(COLORS[0].value);

    // Preenchimento inteligente
    if (type === 'RECURRING') {
        setSelectedDays(prefill?.day !== undefined ? [prefill.day] : [activeMobileDay]);
        setSpecificDate('');
    } else {
        // Se abriu via clique no calendário mensal
        if (prefill?.dateStr) {
            setSpecificDate(prefill.dateStr);
        } else {
            // Padrão para hoje
            const today = new Date();
            setSpecificDate(today.toISOString().split('T')[0]);
        }
        setSelectedDays([]);
    }
    
    setIsModalOpen(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingId(routine.id);
    setTitle(routine.title);
    setTime(routine.time);
    setDuration(routine.duration || 60);
    setSelectedColor(routine.color);
    
    if (routine.specificDate) {
        setPlanType('ONEOFF');
        setSpecificDate(routine.specificDate);
        setSelectedDays([]);
    } else {
        setPlanType('RECURRING');
        setSelectedDays(routine.days);
        setSpecificDate('');
    }
    setIsModalOpen(true);
  };

  const onBlockContextMenu = (e: React.MouseEvent, routine: Routine) => {
      e.stopPropagation();
      e.preventDefault();

      handleContextMenu(e, [
          { label: 'Editar', icon: 'edit2', onClick: () => openEditModal(routine) },
          { label: 'Alterar Cor', icon: 'palette', onClick: () => {
              const idx = COLORS.findIndex(c => c.value === routine.color);
              const nextColor = COLORS[(idx + 1) % COLORS.length].value;
              editRoutine(routine.id, { color: nextColor });
          }},
          { type: 'separator' },
          { label: 'Excluir', icon: 'trash', variant: 'danger', onClick: () => deleteRoutine(routine.id) }
      ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (planType === 'RECURRING' && selectedDays.length === 0) return;
    if (planType === 'ONEOFF' && !specificDate) return;

    const routineData: any = {
      title,
      time,
      duration,
      color: selectedColor,
      scope: 'WEEKLY', // Legacy compatibility, usamos specificDate para diferenciar agora
      days: planType === 'RECURRING' ? selectedDays : [],
      specificDate: planType === 'ONEOFF' ? specificDate : undefined,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    };

    if (editingId) {
      editRoutine(editingId, routineData);
    } else {
      addRoutine(routineData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      deleteRoutine(editingId);
      setIsModalOpen(false);
    }
  };

  // --- Lógica de Renderização Mensal ---
  const getCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const firstDayOfMonth = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Ajuste para começar na segunda-feira (1) em vez de domingo (0)
      // getDay(): 0=Dom, 1=Seg...
      // Desejado: 0=Seg, ... 6=Dom
      let startDay = firstDayOfMonth.getDay() - 1;
      if (startDay === -1) startDay = 6;

      const days = [];
      // Empty slots before first day
      for (let i = 0; i < startDay; i++) {
          days.push(null);
      }
      // Actual days
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      return days;
  };

  const calendarDays = useMemo(() => getCalendarDays(), [currentDate]);

  // --- Lógica de Renderização Semanal (Blocos CSS) ---
  const getBlockStyle = (routine: Routine) => {
    const [h, m] = routine.time.split(':').map(Number);
    const startHour = 7;
    const top = ((h - startHour) * 80) + (m * (80/60)); 
    const height = (routine.duration || 60) * (80/60);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: routine.color
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e27] text-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease]">
      
      {/* HEADER DE NAVEGAÇÃO & CONTROLE (REDESENHADO) */}
      <div className="px-6 py-6 bg-[#0f1223] border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 z-20 shadow-lg">
         
         {/* Left: Title & Month Nav Combined */}
         <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 shadow-inner">
                     <Icon name="calendar" size={20} />
                 </div>
                 <div>
                     <h1 className="text-xl font-bold text-white tracking-tight leading-none">Cronograma</h1>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Planejamento de Estudos</p>
                 </div>
             </div>

             <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

             {/* Month Navigator */}
             <div className="flex items-center bg-[#14182d] border border-white/5 rounded-xl p-1 shadow-sm">
                 <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                     <Icon name="chevronDown" className="rotate-90" size={14} />
                 </button>
                 <div className="px-4 flex flex-col items-center justify-center w-[140px]">
                     <span className="text-xs font-bold text-gray-200 uppercase tracking-widest">{MONTHS[currentDate.getMonth()]}</span>
                     <span className="text-[9px] text-gray-600 font-mono">{currentDate.getFullYear()}</span>
                 </div>
                 <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                     <Icon name="chevronRight" size={14} />
                 </button>
             </div>
             
             <button onClick={handleToday} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider">
                 Voltar para Hoje
             </button>
         </div>

         {/* Right: Controls */}
         <div className="flex gap-3">
             {/* Toggle View Mode */}
             <div className="flex bg-[#14182d] rounded-xl p-1 border border-white/5">
                <button 
                    onClick={() => setViewMode('WEEKLY')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${viewMode === 'WEEKLY' ? 'bg-[#1e233c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Icon name="calendarDays" size={14} /> <span className="hidden lg:inline">Semana Fixa</span>
                </button>
                <button 
                    onClick={() => setViewMode('MONTHLY')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${viewMode === 'MONTHLY' ? 'bg-[#1e233c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Icon name="calendar" size={14} /> <span className="hidden lg:inline">Mês Real</span>
                </button>
             </div>
             
             <button 
                onClick={() => openNewModal('ONEOFF')} 
                className="hidden md:flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
             >
                 <Icon name="plus" size={16} /> Novo Evento
             </button>
         </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          
          {/* MODO SEMANAL (TEMPLATE FIXO) */}
          {viewMode === 'WEEKLY' && (
            <>
              {/* Header Mobile (Nav Dias) */}
              <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f1223] border-b border-white/5">
                  <button onClick={handlePrevDay} className="p-2 bg-white/5 rounded-full active:scale-95 transition-transform"><Icon name="arrowLeft" size={16} /></button>
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{DAYS.find(d => d.id === activeMobileDay)?.label}</span>
                  <button onClick={handleNextDay} className="p-2 bg-white/5 rounded-full active:scale-95 transition-transform"><Icon name="arrowRight" size={16} /></button>
              </div>

              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#0a0e27] custom-scrollbar select-none">
                  <div className="w-full pb-20 md:pb-0 min-h-[1200px]">
                      
                      {/* Grid Header (Desktop) */}
                      <div className="hidden md:flex sticky top-0 z-30 border-b border-white/[0.05] bg-[#0a0e27]/95 backdrop-blur shadow-lg">
                          <div className="w-[60px] shrink-0 border-r border-white/[0.05]"></div>
                          {DAYS.map(day => (
                              <div key={day.id} className="flex-1 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-r border-white/[0.05]">
                                  {day.label}
                              </div>
                          ))}
                      </div>

                      <div className="flex relative h-full">
                          {/* Coluna de Horas */}
                          <div className="sticky left-0 z-20 w-[50px] md:w-[60px] bg-[#0a0e27] border-r border-white/[0.05] shrink-0">
                              {HOURS.map(hour => (
                                  <div key={hour} className="h-[80px] flex items-start justify-center pt-2 relative">
                                      <span className="text-[10px] font-mono text-gray-600 -mt-2">{hour}:00</span>
                                  </div>
                              ))}
                          </div>

                          {/* Colunas de Dias */}
                          <div className="flex-1 flex relative">
                              {DAYS.map(day => {
                                  const isHiddenOnMobile = day.id !== activeMobileDay;
                                  
                                  // Filtra apenas rotinas fixas (sem data específica) para este dia
                                  const dayRoutines = routines.filter(r => !r.specificDate && r.days.includes(day.id));

                                  return (
                                      <div 
                                        key={day.id} 
                                        className={`
                                            relative border-r border-white/[0.05] bg-[#0a0e27] transition-all duration-300 
                                            ${isHiddenOnMobile ? 'hidden md:flex md:flex-col md:flex-1' : 'flex-1 flex flex-col'}
                                        `}
                                      >
                                           {HOURS.map(hour => (
                                               <div key={hour} onClick={() => openNewModal('RECURRING', { day: day.id, hour })} className="h-[80px] w-full border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer relative group/cell shrink-0">
                                                   <div className="absolute top-0 left-0 w-full h-[1px] bg-white/[0.02]"></div>
                                                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity"><Icon name="plus" size={12} className="text-white/20" /></div>
                                               </div>
                                           ))}

                                           {/* Blocos */}
                                           {dayRoutines.map(routine => {
                                               const style = getBlockStyle(routine);
                                               return (
                                                   <div 
                                                        key={routine.id} 
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(routine); }} 
                                                        onContextMenu={(e) => onBlockContextMenu(e, routine)}
                                                        className="absolute left-1 right-1 rounded-lg px-3 py-2 cursor-pointer hover:brightness-110 shadow-lg flex flex-col overflow-hidden z-10 border border-black/10 active:scale-95 transition-transform group" 
                                                        style={{ top: style.top, height: style.height, backgroundColor: routine.color }}
                                                    >
                                                       <div className="flex justify-between items-start">
                                                           <span className="text-[11px] md:text-xs font-bold text-white leading-tight truncate">{routine.title}</span>
                                                           <Icon name="repeat" size={10} className="text-white/50" />
                                                       </div>
                                                       {(routine.duration || 60) >= 45 && <div className="text-[9px] text-white/80 font-medium mt-1 flex items-center gap-1 truncate opacity-70 group-hover:opacity-100">{routine.time} - {routine.duration} min</div>}
                                                   </div>
                                               );
                                           })}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              </div>
            </>
          )}

          {/* MODO MENSAL (CALENDÁRIO REAL) */}
          {viewMode === 'MONTHLY' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="grid grid-cols-7 gap-1 md:gap-4 max-w-6xl mx-auto h-full">
                      {/* Headers */}
                      {DAYS.map(d => (
                          <div key={d.id} className="text-center py-2 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">{d.label}</div>
                      ))}

                      {/* Dias */}
                      {calendarDays.map((date, idx) => {
                          if (!date) return <div key={`empty-${idx}`} className="bg-transparent" />;
                          
                          const dateStr = date.toISOString().split('T')[0];
                          const dayOfWeek = date.getDay();
                          const isToday = new Date().toDateString() === date.toDateString();

                          // 1. Encontrar rotinas fixas (template) para este dia da semana
                          const recurring = routines.filter(r => !r.specificDate && r.days.includes(dayOfWeek));
                          
                          // 2. Encontrar eventos específicos para esta data
                          const oneOffs = routines.filter(r => r.specificDate === dateStr);

                          const allItems = [...oneOffs, ...recurring].sort((a,b) => a.time.localeCompare(b.time));

                          return (
                              <div 
                                key={dateStr} 
                                onClick={() => openNewModal('ONEOFF', { dateStr })}
                                className={`
                                    min-h-[100px] md:min-h-[140px] bg-[#14182d] border rounded-xl p-2 flex flex-col gap-1 transition-all cursor-pointer hover:border-blue-500/30 group relative overflow-hidden
                                    ${isToday ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-white/5'}
                                `}
                              >
                                  <div className={`text-[10px] md:text-xs font-bold mb-1 flex justify-between ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                                      <span>{date.getDate()}</span>
                                      {isToday && <span className="text-[9px] uppercase tracking-wider">Hoje</span>}
                                  </div>
                                  
                                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                      {allItems.slice(0, 4).map(item => (
                                          <div 
                                            key={item.id + (item.specificDate ? '_fix' : '_rec')} 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                            onContextMenu={(e) => onBlockContextMenu(e, item)}
                                            className={`
                                                flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] md:text-[10px] font-medium truncate
                                                ${item.specificDate ? 'bg-white/10 text-white border-l-2' : 'bg-[#0a0e27] text-gray-400 opacity-60 hover:opacity-100'}
                                            `}
                                            style={{ borderLeftColor: item.specificDate ? item.color : 'transparent' }}
                                          >
                                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                              <span className="truncate flex-1">{item.title}</span>
                                              {item.specificDate && <Icon name="star" size={8} className="text-yellow-400" />}
                                          </div>
                                      ))}
                                      {allItems.length > 4 && (
                                          <div className="text-[9px] text-gray-600 text-center italic">+ {allItems.length - 4} mais</div>
                                      )}
                                  </div>

                                  {/* Hover Add Button */}
                                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg scale-75 group-hover:scale-100 transition-transform"><Icon name="plus" size={16} /></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* FAB Mobile */}
      <button onClick={() => openNewModal('ONEOFF')} className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 rounded-full text-white shadow-lg flex items-center justify-center z-50 active:scale-90 transition-transform"><Icon name="plus" size={24} /></button>

      {/* MODAL PLANEJADOR INTELIGENTE */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
              <div className="bg-[#14182d] border border-blue-500/20 w-full md:w-[500px] md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease] md:animate-[popIn_0.2s_ease] max-h-[95vh] flex flex-col">
                  
                  {/* Header do Modal (Tipo de Plano) */}
                  <div className="flex items-center p-2 bg-[#0a0e27] border-b border-white/5">
                      <button 
                        onClick={() => { setPlanType('RECURRING'); setSpecificDate(''); }}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${planType === 'RECURRING' ? 'bg-[#1e233c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          <Icon name="rotateCw" size={14} /> Hábito Semanal
                      </button>
                      <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                      <button 
                        onClick={() => { setPlanType('ONEOFF'); setSelectedDays([]); }}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${planType === 'ONEOFF' ? 'bg-[#1e233c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          <Icon name="calendar" size={14} /> Evento Único
                      </button>
                      <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 ml-2 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-500"><Icon name="x" size={18} /></button>
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#0f1223]">
                      
                      <div className="text-center mb-2">
                          <h3 className="text-lg font-bold text-white mb-1">
                              {planType === 'RECURRING' ? 'Criar Rotina Fixa' : 'Agendar Evento'}
                          </h3>
                          <p className="text-xs text-gray-500">
                              {planType === 'RECURRING' ? 'Atividades que se repetem toda semana (Aulas, Treino...)' : 'Compromissos com data específica (Provas, Entregas...)'}
                          </p>
                      </div>

                      {/* Nome */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">O que vamos fazer?</label>
                          <input 
                              autoFocus
                              type="text" 
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              className="w-full bg-[#14182d] border border-white/10 rounded-2xl px-5 py-4 text-base text-white focus:border-blue-500 outline-none transition-all placeholder-gray-600 shadow-inner"
                              placeholder="Ex: Estudar Matemática, Prova de História..."
                          />
                      </div>

                      {/* Seleção de Tempo (Comum) */}
                      <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Horário</label>
                              <input 
                                  type="time" 
                                  value={time}
                                  onChange={e => setTime(e.target.value)}
                                  className="w-full bg-[#14182d] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all text-center font-mono"
                              />
                          </div>
                          <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Duração</label>
                              <div className="flex items-center bg-[#14182d] border border-white/10 rounded-2xl px-2">
                                  <button onClick={() => setDuration(Math.max(15, duration - 15))} className="p-2 text-gray-500 hover:text-white"><Icon name="minus" size={14}/></button>
                                  <div className="flex-1 text-center text-sm font-mono text-white">{duration} min</div>
                                  <button onClick={() => setDuration(duration + 15)} className="p-2 text-gray-500 hover:text-white"><Icon name="plus" size={14}/></button>
                              </div>
                          </div>
                      </div>

                      {/* Seletor Específico por Tipo */}
                      <div className="p-4 bg-[#14182d] rounded-2xl border border-white/5">
                          {planType === 'RECURRING' ? (
                              <div className="space-y-3">
                                  <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2"><Icon name="repeat" size={12} /> Repetir nos dias:</label>
                                  <div className="flex justify-between gap-2">
                                      {DAYS.map(day => (
                                          <button
                                              key={day.id}
                                              type="button"
                                              onClick={() => {
                                                  if (selectedDays.includes(day.id)) setSelectedDays(selectedDays.filter(d => d !== day.id));
                                                  else setSelectedDays([...selectedDays, day.id]);
                                              }}
                                              className={`w-10 h-10 rounded-full text-xs font-bold transition-all flex items-center justify-center border-2 ${
                                                  selectedDays.includes(day.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-110' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'
                                              }`}
                                          >
                                              {day.label[0]}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  <label className="text-[10px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-2"><Icon name="calendar" size={12} /> Data do Evento:</label>
                                  <input 
                                      type="date"
                                      value={specificDate}
                                      onChange={e => setSpecificDate(e.target.value)}
                                      className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all font-mono"
                                  />
                              </div>
                          )}
                      </div>

                      {/* Cores */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Etiqueta de Cor</label>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {COLORS.map(c => (
                                  <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => setSelectedColor(c.value)}
                                      className={`w-8 h-8 rounded-full transition-all shrink-0 border-2 ${selectedColor === c.value ? 'scale-125 border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                      style={{ backgroundColor: c.value }}
                                      title={c.label}
                                  />
                              ))}
                          </div>
                      </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-[#0a0e27] border-t border-white/10 flex gap-3">
                      {editingId && (
                          <button 
                            type="button" 
                            onClick={handleDelete} 
                            className="px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-bold border border-transparent hover:border-red-500/20 transition-all"
                          >
                              <Icon name="trash" size={18} />
                          </button>
                      )}
                      <button 
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                          {editingId ? 'Salvar Alterações' : 'Confirmar Agendamento'} <Icon name="checkSquare" size={16} />
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default WeeklySchedule;
