
import React, { useState } from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { Icon } from '../ui/Icon';

interface PortabilityModalProps {
  onClose: () => void;
}

const PortabilityModal: React.FC<PortabilityModalProps> = ({ onClose }) => {
  const { importFlashcards, exportFlashcards } = useFlashcards();
  const [status, setStatus] = useState<{ message: string, type: 'idle' | 'success' | 'error' | 'loading' }>({
    message: '',
    type: 'idle'
  });

  const handleImport = async () => {
    setStatus({ message: 'Abrindo seletor de arquivos...', type: 'loading' });
    const result = await importFlashcards();
    
    if (result.success) {
      setStatus({ message: result.message, type: 'success' });
      setTimeout(onClose, 2000);
    } else {
      if (result.canceled) {
        setStatus({ message: '', type: 'idle' });
      } else {
        setStatus({ message: result.message, type: 'error' });
      }
    }
  };

  const handleExport = async () => {
    setStatus({ message: 'Preparando dados...', type: 'loading' });
    const result = await exportFlashcards();
    
    if (result.success) {
      setStatus({ message: 'Arquivo gerado com sucesso!', type: 'success' });
      setTimeout(onClose, 1500);
    } else {
      if (result.canceled) {
        setStatus({ message: '', type: 'idle' });
      } else {
        setStatus({ message: result.message || 'Falha na exportação.', type: 'error' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
      <div className="bg-[#14182d] border border-white/10 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
              <Icon name="rotateCw" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-100 uppercase tracking-widest">Portabilidade</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Sessão Exportar */}
          <div className="p-6 bg-[#1e233c]/40 border border-white/5 rounded-3xl flex flex-col items-center text-center group hover:border-blue-500/20 transition-all">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform shadow-inner">
                <Icon name="download" size={32} />
            </div>
            <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Exportar</h4>
            <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">Salve sua coleção em um arquivo de texto compatível com Anki.</p>
            
            <button 
              onClick={handleExport} 
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              Gerar Arquivo .txt
            </button>
          </div>

          {/* Sessão Importar */}
          <div className="p-6 bg-[#1e233c]/40 border border-white/5 rounded-3xl flex flex-col items-center text-center group hover:border-green-500/20 transition-all">
            <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center text-green-400 mb-4 group-hover:rotate-12 transition-transform shadow-inner">
                <Icon name="rotateCw" size={32} />
            </div>
            <h4 className="text-sm font-bold text-green-400 uppercase mb-2">Importar</h4>
            <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">Adicione flashcards de arquivos externos ou backups antigos.</p>
            
            <button 
              onClick={handleImport} 
              disabled={status.type === 'loading'}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95"
            >
              Selecionar Arquivo
            </button>
          </div>
        </div>

        {/* Status Feedback */}
        {status.message && (
          <div className={`mt-8 p-4 rounded-2xl text-center text-xs font-bold transition-all animate-[slideUp_0.3s_ease] border ${
            status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
            status.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
            'bg-blue-500/10 text-blue-400 animate-pulse border-blue-500/20'
          }`}>
            <div className="flex items-center justify-center gap-2">
                {status.type === 'loading' && <Icon name="refresh" size={14} className="animate-spin" />}
                {status.message}
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center opacity-40">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">
                Suporta formato Anki (UTF-8, delimitado por ;)
            </p>
        </div>
      </div>
    </div>
  );
};

export default PortabilityModal;
