
import React, { useState, useEffect } from 'react';
import { useMindMap } from '../../../contexts/MindMapContext';
import { useFlashcards } from '../../../contexts/FlashcardContext';
import { Icon } from '../../ui/Icon';

const MindMapFlashcardViewerModal: React.FC = () => {
  const { viewingReference, setViewingReference } = useMindMap();
  const { cards } = useFlashcards();
  const [isFlipped, setIsFlipped] = useState(false);

  // Hook deve ser chamado incondicionalmente
  const refId = viewingReference?.id;

  useEffect(() => {
      setIsFlipped(false);
  }, [refId]);

  if (!viewingReference || viewingReference.type !== 'FLASHCARD') return null;

  const card = cards.find(c => c.id === viewingReference.id);

  if (!card) {
      return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
            <div className="bg-[#14182d] border border-white/10 p-8 rounded-xl text-center shadow-2xl">
                <Icon name="alert" size={32} className="mx-auto text-yellow-500 mb-4" />
                <p className="text-gray-300 mb-4">Este flashcard não foi encontrado. Talvez tenha sido excluído.</p>
                <button onClick={() => setViewingReference(null)} className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm hover:bg-blue-500 transition-colors">Fechar</button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-3xl relative flex flex-col items-center max-h-full">
        
        {/* Close Button Outside */}
        <button 
            onClick={() => setViewingReference(null)}
            className="absolute -top-12 right-0 md:-right-12 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all z-10 backdrop-blur-md"
        >
            <Icon name="x" size={20} />
        </button>

        {/* Card Container - Auto Resize com limites seguros */}
        <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] max-h-[85vh] bg-[#14182d] border border-white/10 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all duration-300"
        >
            {/* Header Indicador Fixo */}
            <div className="shrink-0 h-16 flex items-center justify-center z-10 bg-gradient-to-b from-[#14182d] to-transparent pointer-events-none">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm border border-white/5 shadow-lg ${isFlipped ? 'text-blue-300 bg-blue-900/20' : 'text-gray-500 bg-black/20'}`}>
                    {isFlipped ? "Resposta" : "Pergunta"}
                </span>
            </div>

            {/* Conteúdo com Scroll Automático */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 flex flex-col items-center justify-center">
                <div className="w-full text-center whitespace-pre-wrap break-words">
                    {isFlipped ? (
                        <div className="animate-[fadeIn_0.3s_ease] text-xl md:text-3xl text-blue-300 font-bold leading-relaxed" dangerouslySetInnerHTML={{ __html: card.back || '...' }} />
                    ) : (
                        <div className="animate-[fadeIn_0.3s_ease] text-xl md:text-2xl text-gray-200 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: card.front }} />
                    )}
                </div>
            </div>

            {/* Footer Indicador Fixo */}
            <div className="shrink-0 h-12 flex items-center justify-center pointer-events-none bg-gradient-to-t from-[#14182d] to-transparent">
                <span className="text-gray-500 text-xs font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para virar
                </span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MindMapFlashcardViewerModal;
