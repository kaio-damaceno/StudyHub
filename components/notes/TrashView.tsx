
import React from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import { useContextMenu } from '../../hooks/useContextMenu';
import { NoteBlock } from '../../types';

const TrashView: React.FC = () => {
  const { blocks, restoreBlock, permanentDeleteBlock, emptyTrash } = useNotes();
  const { handleContextMenu } = useContextMenu();
  const trashBlocks = blocks.filter(b => b.isTrash);

  const onTrashItemContextMenu = (e: React.MouseEvent, block: NoteBlock) => {
      handleContextMenu(e, [
          { label: 'Restaurar', icon: 'rotateCw', onClick: () => restoreBlock(block.id) },
          { label: 'Excluir Permanentemente', icon: 'trash', variant: 'danger', onClick: () => permanentDeleteBlock(block.id) }
      ]);
  };

  return (
    <div className="flex-1 bg-[#0a0e27] p-8 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-red-400 mb-1 flex items-center gap-3">
                    <Icon name="trash" size={24} /> Lixeira
                </h1>
                <p className="text-xs text-gray-400">Itens deletados podem ser restaurados ou excluídos permanentemente.</p>
            </div>
            
            {trashBlocks.length > 0 && (
                <button 
                    onClick={emptyTrash}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-xs font-bold border border-red-500/20"
                >
                    <Icon name="trash" size={14} /> Esvaziar Lixeira
                </button>
            )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#14182d]/30 border border-white/5 rounded-xl">
            {trashBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                    <Icon name="trash" size={48} className="mb-4" />
                    <p>A lixeira está vazia.</p>
                </div>
            ) : (
                trashBlocks.map(block => (
                    <div 
                        key={block.id} 
                        onContextMenu={(e) => onTrashItemContextMenu(e, block)}
                        className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-4 border-b border-white/5 hover:bg-[#1e233c]/50 transition-colors items-center group cursor-default"
                    >
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                            <Icon 
                                name={block.type === 'folder' ? 'folderOpen' : 'fileText'} 
                                size={18} 
                            />
                        </div>
                        
                        <div>
                            <div className="font-bold text-sm text-gray-200">{block.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                Originalmente em: {block.folderId || 'Sem pasta'}
                            </div>
                        </div>

                        <div className="text-xs text-gray-500">
                            Deletado (soft)
                        </div>

                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => restoreBlock(block.id)}
                                className="px-3 py-1.5 rounded-lg text-green-400 bg-green-500/10 hover:bg-green-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-2"
                                title="Restaurar"
                            >
                                <Icon name="rotateCw" size={12} /> Restaurar
                            </button>
                            <button 
                                onClick={() => permanentDeleteBlock(block.id)}
                                className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold"
                                title="Excluir Permanentemente"
                            >
                                <Icon name="x" size={12} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default TrashView;
