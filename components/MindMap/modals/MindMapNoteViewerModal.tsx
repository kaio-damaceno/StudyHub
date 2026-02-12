
import React from 'react';
import { useMindMap } from '../../../contexts/MindMapContext';
import { Icon } from '../../ui/Icon';
import BlockEditor from '../../notes/BlockEditor';

const MindMapNoteViewerModal: React.FC = () => {
  const { viewingReference, setViewingReference } = useMindMap();

  if (!viewingReference || viewingReference.type !== 'NOTE') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-[fadeIn_0.2s_ease]">
      {/* Container ajustável: cresce com o conteúdo mas respeita limites da tela */}
      <div className="bg-[#0a0e27] border border-white/10 w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Header Customizado do Modal */}
        <div className="h-14 bg-[#0f1223] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                    <Icon name="fileText" size={16} />
                </div>
                <h3 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
                    {viewingReference.label || 'Nota Vinculada'}
                </h3>
            </div>
            <button 
                onClick={() => setViewingReference(null)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
                <Icon name="x" size={16} />
            </button>
        </div>

        {/* Área de Conteúdo: Reusa o BlockEditor com espaço maximizado */}
        <div className="flex-1 relative bg-[#0a0e27]">
            <BlockEditor blockId={viewingReference.id} />
        </div>
      </div>
    </div>
  );
};

export default MindMapNoteViewerModal;
