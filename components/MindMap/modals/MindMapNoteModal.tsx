
import React, { useState } from 'react';
import { useNotes } from '../../../contexts/NotesContext';
import { useMindMap } from '../../../contexts/MindMapContext';
import { Icon } from '../../ui/Icon';

interface MindMapNoteModalProps {
  nodeId: string;
  onClose: () => void;
}

const MindMapNoteModal: React.FC<MindMapNoteModalProps> = ({ nodeId, onClose }) => {
  const { blocks, addBlock } = useNotes();
  const { currentMap, addNodeReference } = useMindMap();
  
  const node = currentMap?.nodes[nodeId];
  const [mode, setMode] = useState<'CREATE' | 'LINK'>('CREATE');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState(node?.text || '');

  // Filter notes for linking (exclude trash)
  const availableNotes = blocks.filter(b => 
      !b.isTrash && 
      (b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (b.content.text && b.content.text.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      const noteId = `note_${Date.now()}`;
      addBlock('container', { x: 100, y: 100 }, undefined, undefined, noteId);
      addNodeReference(nodeId, {
          type: 'NOTE',
          id: noteId,
          label: newNoteTitle || 'Anotação'
      });
      onClose();
  };

  const handleLink = (noteId: string, noteTitle: string) => {
      addNodeReference(nodeId, {
          type: 'NOTE',
          id: noteId,
          label: noteTitle
      });
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
      {/* Container Flex com altura máxima */}
      <div className="bg-[#14182d] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
        
        {/* Header Tabs Fixas */}
        <div className="flex border-b border-white/5 bg-[#0f1223] shrink-0 rounded-t-2xl relative">
            <button 
                onClick={() => setMode('CREATE')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'CREATE' ? 'bg-[#1e233c] text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}
            >
                Nova Nota
            </button>
            <button 
                onClick={() => setMode('LINK')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'LINK' ? 'bg-[#1e233c] text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}
            >
                Vincular Existente
            </button>
            <button onClick={onClose} className="absolute top-2 right-2 p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5"><Icon name="x" size={18} /></button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[#14182d] rounded-b-2xl">
            {mode === 'CREATE' ? (
                <form onSubmit={handleCreate} className="space-y-4 flex flex-col h-full">
                    <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Título da Nota</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50"
                            value={newNoteTitle}
                            onChange={e => setNewNoteTitle(e.target.value)}
                            placeholder="Título..."
                        />
                        <p className="text-[10px] text-gray-500">Uma nova nota será criada na seção de Anotações.</p>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all shrink-0">
                        Criar e Vincular
                    </button>
                </form>
            ) : (
                <div className="flex flex-col h-full min-h-0">
                    <div className="relative mb-4 shrink-0">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar notas..."
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {availableNotes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-xs">Nenhuma nota encontrada.</div>
                        ) : (
                            availableNotes.map(note => (
                                <button 
                                    key={note.id}
                                    onClick={() => handleLink(note.id, note.title)}
                                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-blue-500/30 transition-all group shrink-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-200 group-hover:text-blue-200 truncate">{note.title}</span>
                                        {note.folderId && <span className="text-[9px] bg-black/20 px-2 py-0.5 rounded text-gray-500">{note.folderId}</span>}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate mt-1">
                                        {note.content.text || "Sem conteúdo de texto..."}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MindMapNoteModal;
