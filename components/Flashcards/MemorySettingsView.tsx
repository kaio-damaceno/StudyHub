
import React from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { Icon } from '../ui/Icon';

const MemorySettingsView: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useFlashcards();

  const handleToggle = (category: string, field: string, current: boolean) => {
    updateSettings({
      [category]: { [field]: !current }
    });
  };

  const handleValue = (category: string, field: string, value: any) => {
    updateSettings({
      [category]: { [field]: value }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0e27] p-8 animate-[fadeIn_0.3s_ease]">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Configurações do Flashcards</h1>
                <p className="text-sm text-gray-500">Ajuste o motor SRS e a estética ao seu gosto.</p>
            </div>
            <button 
                onClick={resetSettings}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
                Resetar para o Padrão
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 1. ALGORITMO (ADAPT-SRS) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Icon name="zap" size={14} /> Algoritmo & Motor
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">Modo Inteligente</span>
                    <button 
                        onClick={() => handleToggle('algorithm', 'isAdaptiveDefault', settings.algorithm.isAdaptiveDefault)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.algorithm.isAdaptiveDefault ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.algorithm.isAdaptiveDefault ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>
            
            <div className={`bg-[#14182d] border border-white/5 rounded-3xl p-6 space-y-8 transition-opacity ${settings.algorithm.isAdaptiveDefault ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">Meta de Retenção</label>
                        <span className="text-sm font-mono text-blue-400 font-bold">{Math.round(settings.algorithm.retentionTarget * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0.80" max="0.95" step="0.01" 
                        value={settings.algorithm.retentionTarget}
                        onChange={(e) => handleValue('algorithm', 'retentionTarget', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-[#0a0e27] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Novos / Dia</label>
                        <input 
                            type="number" value={settings.algorithm.newCardsLimit}
                            onChange={(e) => handleValue('algorithm', 'newCardsLimit', parseInt(e.target.value))}
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Revisões / Dia</label>
                        <input 
                            type="number" value={settings.algorithm.reviewsLimit}
                            onChange={(e) => handleValue('algorithm', 'reviewsLimit', parseInt(e.target.value))}
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0a0e27]/50 rounded-2xl border border-white/5">
                    <div>
                        <div className="text-xs font-bold text-gray-300">Resete total no Lapso</div>
                        <div className="text-[10px] text-gray-600">Se errar um card antigo, ele vira "Novo" novamente.</div>
                    </div>
                    <button 
                        onClick={() => handleToggle('algorithm', 'lapseReset', settings.algorithm.lapseReset)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.algorithm.lapseReset ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.algorithm.lapseReset ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>
            {settings.algorithm.isAdaptiveDefault && (
                <p className="text-[10px] text-blue-400 font-bold px-4 italic">O motor Adapt-SRS está gerenciando seu ritmo automaticamente para máxima eficiência.</p>
            )}
          </section>

          {/* 2. ESTÉTICA & UI */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Icon name="palette" size={14} /> Estética dos Cartões
            </h3>
            
            <div className="bg-[#14182d] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Tema Visual</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'midnight', label: 'Midnight', color: 'bg-[#0f1223]' },
                            { id: 'paper', label: 'Papel', color: 'bg-[#f4f1ea]' },
                            { id: 'foco', label: 'Foco (Preto)', color: 'bg-black' },
                            { id: 'dark', label: 'Dark', color: 'bg-[#1a1a1a]' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => handleValue('ui', 'theme', t.id)}
                                className={`h-12 rounded-xl border-2 transition-all ${settings.ui.theme === t.id ? 'border-purple-500 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'} ${t.color}`}
                                title={t.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tipografia</label>
                        <select 
                            value={settings.ui.fontFamily}
                            onChange={(e) => handleValue('ui', 'fontFamily', e.target.value)}
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                        >
                            <option value="sans">Sans Serif (Moderna)</option>
                            <option value="serif">Serifada (Livro)</option>
                            <option value="mono">Monospace (Código)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tam. Fonte</label>
                        <input 
                            type="number" value={settings.ui.fontSize}
                            onChange={(e) => handleValue('ui', 'fontSize', parseInt(e.target.value))}
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0a0e27]/50 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold text-gray-300">Modo Canhoto</div>
                    <button 
                        onClick={() => handleToggle('ui', 'leftyMode', settings.ui.leftyMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.ui.leftyMode ? 'bg-purple-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.ui.leftyMode ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>
          </section>

          {/* 3. EXPERIÊNCIA DE SESSÃO */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Icon name="play" size={14} /> Workflow de Estudo
            </h3>
            
            <div className="bg-[#14182d] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Cronômetro de Resposta</span>
                    <button 
                        onClick={() => handleToggle('session', 'showTimer', settings.session.showTimer)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.session.showTimer ? 'bg-emerald-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.session.showTimer ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-reprodução de Áudio</span>
                    <button 
                        onClick={() => handleToggle('session', 'autoPlayAudio', settings.session.autoPlayAudio)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.session.autoPlayAudio ? 'bg-emerald-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.session.autoPlayAudio ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Exibir Intervalos nos Botões</span>
                    <button 
                        onClick={() => handleToggle('session', 'showIntervals', settings.session.showIntervals)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.session.showIntervals ? 'bg-emerald-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.session.showIntervals ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ordem de Prioridade</label>
                    <div className="flex gap-2">
                        {['MIXED', 'NEW_FIRST', 'REVIEWS_FIRST'].map(o => (
                            <button 
                                key={o} 
                                onClick={() => handleValue('session', 'studyOrder', o)}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${settings.session.studyOrder === o ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400' : 'bg-[#0a0e27] border-white/5 text-gray-600 hover:text-gray-400'}`}
                            >
                                {o === 'MIXED' ? 'Mista' : o === 'NEW_FIRST' ? 'Novos' : 'Revisões'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </section>

          {/* 4. GAMIFICAÇÃO */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <Icon name="star" size={14} /> Gamificação & Lembretes
            </h3>
            
            <div className="bg-[#14182d] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Meta Diária (Cards)</label>
                    <div className="flex gap-3 items-center">
                        <input 
                            type="range" min="10" max="100" step="5" 
                            value={settings.gamification.dailyGoal}
                            onChange={(e) => handleValue('gamification', 'dailyGoal', parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-[#0a0e27] rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="text-sm font-mono font-bold text-orange-400 w-8">{settings.gamification.dailyGoal}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Exibir Ofensiva (Streak)</span>
                    <button 
                        onClick={() => handleToggle('gamification', 'showStreak', settings.gamification.showStreak)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.gamification.showStreak ? 'bg-orange-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.gamification.showStreak ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Notificações Push</span>
                    <button 
                        onClick={() => handleToggle('gamification', 'notifications', settings.gamification.notifications)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.gamification.notifications ? 'bg-orange-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.gamification.notifications ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>
          </section>

        </div>

        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default MemorySettingsView;
