
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { UserSettings, HistoryInterval } from '../../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [appVersion, setAppVersion] = useState<string>('1.0.0');

  useEffect(() => {
      if (window.api && window.api.getAppVersion) {
          window.api.getAppVersion().then(v => setAppVersion(v));
      }
  }, []);

  const handleCheckUpdate = () => {
      if (window.api && window.api.checkForUpdates) {
          window.api.checkForUpdates();
          alert("Verificando atualizações em segundo plano...");
      } else {
          alert("Função de atualização indisponível neste ambiente.");
      }
  };
  
  const themes = [
    { id: 'default', name: 'Original', color: 'bg-[#0a0e27]', gradient: 'linear-gradient(180deg, #0a0e27 0%, #1a1d3e 50%, #252850 100%)' },
    { id: 'ocean', name: 'Oceano Profundo', color: 'bg-[#0f172a]', gradient: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
    { id: 'midnight', name: 'Meia-noite', color: 'bg-[#000000]', gradient: 'linear-gradient(180deg, #000000 0%, #111111 50%, #222222 100%)' },
    { id: 'sunset', name: 'Crepúsculo', color: 'bg-[#2a0a18]', gradient: 'linear-gradient(180deg, #2a0a18 0%, #501525 50%, #752030 100%)' },
    { id: 'forest', name: 'Floresta Noturna', color: 'bg-[#052e16]', gradient: 'linear-gradient(180deg, #052e16 0%, #064e3b 50%, #065f46 100%)' },
  ];

  const fonts = [
      { id: 'Inter', name: 'Inter (Padrão)', class: 'font-sans' },
      { id: 'Roboto', name: 'Roboto', class: 'font-[Roboto]' },
      { id: 'Lato', name: 'Lato', class: 'font-[Lato]' },
      { id: 'Montserrat', name: 'Montserrat', class: 'font-[Montserrat]' },
      { id: 'Open Sans', name: 'Open Sans', class: 'font-[Open_Sans]' },
      { id: 'Playfair Display', name: 'Playfair (Serif)', class: 'font-[Playfair_Display]' },
      { id: 'Fira Code', name: 'Fira Code (Mono)', class: 'font-mono' }
  ];

  const searchEngines = [
    { id: 'google', name: 'Google', icon: 'search' },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: 'shield' },
    { id: 'bing', name: 'Bing', icon: 'globe' },
    { id: 'yahoo', name: 'Yahoo', icon: 'search' },
  ];

  const historyOptions: { value: HistoryInterval, label: string }[] = [
      { value: 'NEVER', label: 'Nunca' },
      { value: '1_HOUR', label: '1 vez por hora' },
      { value: '1_DAY', label: '1 vez por dia' },
      { value: '1_WEEK', label: 'Por semana' },
      { value: '1_MONTH', label: 'Por mês' },
      { value: '3_MONTHS', label: 'A cada 3 meses' },
      { value: '6_MONTHS', label: 'A cada 6 meses' },
      { value: '1_YEAR', label: 'A cada ano' },
      { value: '2_YEARS', label: 'A cada 2 anos' },
  ];

  const handleCursorUpdate = (key: string, value: any) => {
      onUpdateSettings({ 
          cursorGlow: { ...settings.cursorGlow, [key]: value } 
      });
  };

  const handleAnimationUpdate = (key: string, value: any) => {
      onUpdateSettings({ 
          animations: { ...settings.animations, [key]: value } 
      });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-transparent overflow-hidden animate-[fadeIn_0.3s_ease]">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-blue-400/10 bg-[#0f1223]/50 flex items-center gap-4 shrink-0">
          <div className="p-3 bg-blue-400/10 rounded-xl text-blue-400">
              <Icon name="settings" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Configurações</h1>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          {/* SECÇÃO: APARÊNCIA E TEMA */}
          <section className="bg-[#1e233c]/30 border border-blue-400/10 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                   <Icon name="palette" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-200">Aparência e Tema</h2>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                {themes.map(theme => (
                   <button
                      key={theme.id}
                      onClick={() => onUpdateSettings({ theme: theme.id as any })}
                      className={`
                        relative aspect-square rounded-xl border-2 transition-all overflow-hidden group
                        ${settings.theme === theme.id 
                           ? 'border-purple-500 scale-105 shadow-xl' 
                           : 'border-transparent hover:scale-105 hover:border-white/20'
                        }
                      `}
                   >
                      <div className={`absolute inset-0 ${theme.color} opacity-80`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                         <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md px-1 rounded bg-black/30">
                            {theme.name}
                         </span>
                      </div>
                      
                      {settings.theme === theme.id && (
                         <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            <Icon name="checkSquare" size={12} />
                         </div>
                      )}
                   </button>
                ))}
             </div>

             <div className="space-y-6 border-t border-white/5 pt-6">
                 {/* Tipografia */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Fonte Principal</label>
                         <select 
                            value={settings.fontFamily || 'Inter'}
                            onChange={(e) => onUpdateSettings({ fontFamily: e.target.value as any })}
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-all cursor-pointer"
                         >
                             {fonts.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tamanho do Texto</label>
                         <div className="flex bg-[#0a0e27] rounded-xl border border-white/10 p-1">
                             {[
                                 { id: 'small', label: 'Pequeno', size: 'A' },
                                 { id: 'medium', label: 'Médio', size: 'A' },
                                 { id: 'large', label: 'Grande', size: 'A' },
                                 { id: 'xlarge', label: 'Extra', size: 'A' }
                             ].map((s, idx) => (
                                 <button
                                    key={s.id}
                                    onClick={() => onUpdateSettings({ textSize: s.id as any })}
                                    className={`flex-1 py-2 rounded-lg flex flex-col items-center justify-center transition-all ${settings.textSize === s.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                 >
                                     <span style={{ fontSize: 12 + (idx * 2) }} className="font-bold">{s.size}</span>
                                     <span className="text-[9px] mt-1">{s.label}</span>
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
          </section>

          {/* SECÇÃO: INTERFACE E ANIMAÇÕES */}
          <section className="bg-[#1e233c]/30 border border-blue-400/10 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                   <Icon name="monitor" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-200">Interface & Efeitos</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Animações */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-gray-300">Animações da Interface</span>
                         <button 
                            onClick={() => handleAnimationUpdate('enabled', !settings.animations?.enabled)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${settings.animations?.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                         >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${settings.animations?.enabled ? 'left-7' : 'left-1'}`} />
                         </button>
                     </div>
                     
                     <div className={`space-y-2 transition-opacity ${!settings.animations?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                         <label className="text-[10px] font-bold text-gray-500 uppercase">Velocidade</label>
                         <div className="flex gap-2">
                             {[
                                 { id: 'slow', label: 'Lenta' },
                                 { id: 'normal', label: 'Normal' },
                                 { id: 'fast', label: 'Rápida' }
                             ].map(opt => (
                                 <button
                                    key={opt.id}
                                    onClick={() => handleAnimationUpdate('speed', opt.id)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${settings.animations?.speed === opt.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0a0e27] border-white/10 text-gray-500'}`}
                                 >
                                     {opt.label}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Sombra do Mouse */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-gray-300">Brilho do Cursor (Glow)</span>
                         <button 
                            onClick={() => handleCursorUpdate('enabled', !settings.cursorGlow?.enabled)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${settings.cursorGlow?.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                         >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${settings.cursorGlow?.enabled ? 'left-7' : 'left-1'}`} />
                         </button>
                     </div>

                     <div className={`space-y-4 transition-opacity ${!settings.cursorGlow?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                         <div className="flex items-center gap-4">
                             <div className="flex-1 space-y-1">
                                 <label className="text-[10px] font-bold text-gray-500 uppercase">Tamanho</label>
                                 <input 
                                    type="range" min="50" max="400" step="10"
                                    value={settings.cursorGlow?.size || 180}
                                    onChange={(e) => handleCursorUpdate('size', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-[#0a0e27] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                 />
                             </div>
                             <div className="flex-1 space-y-1">
                                 <label className="text-[10px] font-bold text-gray-500 uppercase">Opacidade</label>
                                 <input 
                                    type="range" min="0.05" max="0.5" step="0.05"
                                    value={settings.cursorGlow?.opacity || 0.15}
                                    onChange={(e) => handleCursorUpdate('opacity', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-[#0a0e27] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                 />
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-3">
                             <label className="text-[10px] font-bold text-gray-500 uppercase">Cor</label>
                             <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1">
                                 {['#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#eab308', '#ec4899', '#ffffff'].map(c => (
                                     <button
                                        key={c}
                                        onClick={() => handleCursorUpdate('color', c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${settings.cursorGlow?.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                     />
                                 ))}
                                 <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0">
                                     <input 
                                        type="color" 
                                        value={settings.cursorGlow?.color || '#3b82f6'}
                                        onChange={(e) => handleCursorUpdate('color', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                     />
                                     <div className="w-full h-full" style={{ backgroundColor: settings.cursorGlow?.color }}></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          </section>

          {/* SECÇÃO: GERAL / BUSCA */}
          <section className="bg-[#1e233c]/30 border border-blue-400/10 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                   <Icon name="globe" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-200">Geral e Busca</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {searchEngines.map(engine => (
                   <button
                      key={engine.id}
                      onClick={() => onUpdateSettings({ searchEngine: engine.id as any })}
                      className={`
                        flex items-center gap-4 p-4 rounded-xl border transition-all text-left group
                        ${settings.searchEngine === engine.id 
                           ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                           : 'bg-[#0a0e27]/50 border-white/5 text-gray-400 hover:bg-[#0a0e27] hover:border-white/10'
                        }
                      `}
                   >
                      <div className={`p-2 rounded-full ${settings.searchEngine === engine.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                          <Icon name={engine.icon} size={16} />
                      </div>
                      <span className="font-medium">{engine.name}</span>
                      {settings.searchEngine === engine.id && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                   </button>
                ))}
             </div>

             <div className="flex items-center justify-between p-4 bg-[#0a0e27]/50 rounded-xl border border-white/5">
                <div>
                   <h3 className="text-sm font-bold text-gray-200 mb-1">Limpeza Automática de Histórico</h3>
                   <p className="text-xs text-gray-500">
                      Escolha com que frequência o histórico de navegação deve ser excluído.
                   </p>
                </div>
                
                <div className="relative">
                    <select
                        value={settings.historyClearInterval}
                        onChange={(e) => onUpdateSettings({ historyClearInterval: e.target.value as HistoryInterval })}
                        className="bg-[#1e233c] border border-white/10 text-gray-200 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer appearance-none pr-8"
                    >
                        {historyOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Icon name="chevronDown" size={12} />
                    </div>
                </div>
             </div>
          </section>

          {/* SECÇÃO: SOBRE O SISTEMA */}
          <section className="bg-[#1e233c]/30 border border-blue-400/10 rounded-2xl p-6 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400">
                   <Icon name="zap" size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-200">Sobre o Sistema</h2>
             </div>

             <div className="flex items-center justify-between p-4 bg-[#0a0e27]/50 rounded-xl border border-white/5">
                 <div>
                     <h3 className="text-sm font-bold text-gray-200">Study Hub Browser</h3>
                     <p className="text-xs text-gray-500 mt-1">Versão Atual: <span className="font-mono text-blue-400">{appVersion}</span></p>
                 </div>
                 <button 
                    onClick={handleCheckUpdate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                 >
                     <Icon name="rotateCw" size={14} /> Verificar Atualizações
                 </button>
             </div>
          </section>

          {/* Info Version Footer */}
          <div className="text-center pt-4 pb-4">
             <p className="text-xs text-gray-600 font-mono">Study Hub Browser v{appVersion} &bull; Open Source</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
