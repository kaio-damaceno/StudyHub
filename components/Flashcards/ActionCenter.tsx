
import React, { useState, useMemo } from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { Icon } from '../ui/Icon';
import { AdaptEngine } from '../../core/flashcards/AdaptEngine';
import { CardPresentation } from '../../types';

interface ActionCenterProps {
  onStartSession: (cards: CardPresentation[]) => void;
}

type Intensity = 'QUICK' | 'STANDARD' | 'MASTERY';
type FocusFilter = 'CRITICAL' | 'SMART' | 'ALL_DUE';

const ActionCenter: React.FC<ActionCenterProps> = ({ onStartSession }) => {
  const { cards, decks } = useFlashcards();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('ALL');
  const [intensity, setIntensity] = useState<Intensity>('STANDARD');
  const [focus, setFocus] = useState<FocusFilter>('SMART');
  
  const engine = useMemo(() => new AdaptEngine(), []);

  const sessionPreview = useMemo(() => {
    const now = Date.now();
    
    // 1. Filtragem por Deck
    let pool = selectedDeckId === 'ALL' 
      ? cards 
      : cards.filter(c => c.deckId === selectedDeckId);

    // 2. Cálculo de Risco e Enriquecimento
    const analyzed = pool.map(card => {
      const risk = engine.calculateCurrentRisk(card, now);
      
      // Peso de prioridade: Risco (0-1) + Bônus de Estágio Inicial
      let priority = risk;
      if (card.stage === 'S1_ACQUISITION') priority += 1.5; // Novos são prioridade absoluta
      if (card.stage === 'S5_LAPSE') priority += 0.8;      // Lapsos são críticos
      
      return { card, risk, priority };
    });

    // 3. Ordenação por Prioridade Cognitiva
    analyzed.sort((a, b) => b.priority - a.priority);

    // 4. Aplicação de Filtros de Foco (Limiares Cognitivos)
    let filtered = analyzed;
    if (focus === 'CRITICAL') {
      filtered = analyzed.filter(item => item.risk > 0.3 || item.card.stage === 'S1_ACQUISITION');
    } else if (focus === 'SMART') {
      filtered = analyzed.filter(item => item.risk > 0.1 || item.card.stage === 'S1_ACQUISITION');
    }

    // 5. Corte por Intensidade
    let limit = 10;
    if (intensity === 'STANDARD') limit = 25;
    if (intensity === 'MASTERY') limit = 60;

    return filtered.slice(0, limit);
  }, [cards, selectedDeckId, intensity, focus, engine]);

  const handleStart = () => {
    if (sessionPreview.length === 0) return;
    
    // Converte para o formato de apresentação esperado pelo StudySession
    const presentations: CardPresentation[] = sessionPreview.map(item => ({
      card: item.card,
      priorityScore: item.priority,
      explanation: {
        message: item.card.stage === 'S1_ACQUISITION' ? "Novo Conhecimento" : 
                 item.risk > 0.4 ? "Risco de Esquecimento Alto" : "Reforço Necessário",
        visualCue: item.risk > 0.4 ? 'critical' : 'warning'
      }
    }));

    onStartSession(presentations);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#0a0e27] animate-[fadeIn_0.3s_ease] py-10 px-4 md:px-6">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        
        <div className="w-full bg-[#14182d] border border-white/5 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Glow Decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-4 shadow-inner">
              <Icon name="play" size={28} className="fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Modo de Ação</h2>
            <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto">
              Sessão inteligente focada na sua necessidade cognitiva atual. Sem filas, apenas foco.
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            
            {/* Seleção de Escopo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2">Onde vamos focar?</label>
              <div className="relative group">
                <select 
                  value={selectedDeckId}
                  onChange={e => setSelectedDeckId(e.target.value)}
                  className="w-full bg-[#0a0e27] border border-white/10 rounded-2xl px-5 py-4 text-sm text-gray-200 outline-none focus:border-blue-500/40 appearance-none cursor-pointer hover:bg-[#0f1223] transition-colors"
                >
                  <option value="ALL">Toda a Coleção</option>
                  {decks.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                  <Icon name="chevronDown" size={14} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Intensidade */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2">Intensidade</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'QUICK', label: 'Rápida', desc: '~ 5-10 cards', icon: 'zap' },
                    { id: 'STANDARD', label: 'Padrão', desc: '~ 25 cards', icon: 'play' },
                    { id: 'MASTERY', label: 'Imersão', desc: 'Sessão Longa', icon: 'brain' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setIntensity(opt.id as Intensity)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${intensity === opt.id ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : 'bg-[#0a0e27]/50 border-white/5 text-gray-500 hover:border-white/10'}`}
                    >
                      <Icon name={opt.icon} size={16} />
                      <div>
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[9px] opacity-60">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Foco Cognitivo */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2">Filtro de Foco</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'CRITICAL', label: 'Críticos', desc: 'Risco iminente', color: 'text-red-400' },
                    { id: 'SMART', label: 'Inteligente', desc: 'Risco > 10%', color: 'text-blue-400' },
                    { id: 'ALL_DUE', label: 'Tudo', desc: 'Sem restrição', color: 'text-emerald-400' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setFocus(opt.id as FocusFilter)}
                      className={`flex flex-col p-4 rounded-2xl border transition-all text-left ${focus === opt.id ? 'bg-white/5 border-white/20' : 'bg-[#0a0e27]/50 border-white/5 text-gray-500'}`}
                    >
                      <div className={`text-xs font-bold ${focus === opt.id ? opt.color : ''}`}>{opt.label}</div>
                      <div className="text-[9px] opacity-60 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            <div className="pt-4">
              <button 
                onClick={handleStart}
                disabled={sessionPreview.length === 0}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white font-bold rounded-3xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <span className="text-lg">Iniciar Sessão</span>
                <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">
                  {sessionPreview.length} cards selecionados
                </span>
              </button>
              {sessionPreview.length === 0 && (
                <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
                  Nada para revisar com estes filtros agora.
                </p>
              )}
            </div>

          </div>
        </div>
        
        {/* Mini Stats Preview */}
        <div className="mt-8 mb-12 flex gap-12 text-center opacity-40">
          <div>
            <div className="text-xl font-bold text-white">{cards.length}</div>
            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Total na Coleção</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">{cards.filter(c => c.stage === 'S1_ACQUISITION').length}</div>
            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Ainda em Aquisição</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCenter;
