
import React, { useState, useEffect } from 'react';
import { useFlashcards } from '../../../contexts/FlashcardContext';
import { useMindMap } from '../../../contexts/MindMapContext';
import { Icon } from '../../ui/Icon';
import RichTextEditor from '../../Flashcards/RichTextEditor';

interface MindMapFlashcardModalProps {
  nodeId: string;
  onClose: () => void;
}

const MindMapFlashcardModal: React.FC<MindMapFlashcardModalProps> = ({ nodeId, onClose }) => {
  const { addCard, decks, addDeck } = useFlashcards();
  const { currentMap, addNodeReference } = useMindMap();
  
  const node = currentMap?.nodes[nodeId];
  
  const [targetDeckId, setTargetDeckId] = useState(decks[0]?.id || '');
  const [front, setFront] = useState(node?.text || '');
  const [back, setBack] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  useEffect(() => {
      if (decks.length === 0) setIsCreatingDeck(true);
      else if (!targetDeckId) setTargetDeckId(decks[0].id);
  }, [decks, targetDeckId]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      let finalDeckId = targetDeckId;
      if (isCreatingDeck && newDeckName.trim()) {
          const newDeck = addDeck(newDeckName.trim());
          finalDeckId = newDeck.id;
      }

      if (finalDeckId) {
          const newCardId = addCard(finalDeckId, front, back, 'BASIC');
          
          if (newCardId) {
              addNodeReference(nodeId, {
                  type: 'FLASHCARD',
                  id: newCardId,
                  label: 'Flashcard'
              });
          }
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
      {/* Container Flex para layout responsivo sem scroll global */}
      <div className="bg-[#14182d] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header Fixo */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0 bg-[#14182d] rounded-t-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Icon name="cards" size={16} className="text-green-400" /> Novo Flashcard
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><Icon name="x" size={20} /></button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <form id="flashcard-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Deck Selector */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Baralho</label>
                    {isCreatingDeck ? (
                        <div className="flex gap-2">
                            <input 
                                autoFocus
                                type="text" 
                                className="flex-1 bg-[#0a0e27] border border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                placeholder="Nome do novo baralho"
                                value={newDeckName}
                                onChange={e => setNewDeckName(e.target.value)}
                            />
                            <button type="button" onClick={() => setIsCreatingDeck(false)} className="px-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 text-xs">Cancelar</button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <select 
                                className="flex-1 bg-[#0a0e27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                                value={targetDeckId}
                                onChange={e => setTargetDeckId(e.target.value)}
                            >
                                {decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsCreatingDeck(true)} className="px-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Icon name="plus" size={16} /></button>
                        </div>
                    )}
                </div>

                {/* Front */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Frente (Pergunta)</label>
                    <RichTextEditor value={front} onChange={(val) => setFront(val)} placeholder="Pergunta..." minHeight="80px" />
                </div>

                {/* Back */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Verso (Resposta)</label>
                    <RichTextEditor value={back} onChange={(val) => setBack(val)} placeholder="Resposta..." minHeight="100px" />
                </div>
            </form>
        </div>

        {/* Footer Fixo */}
        <div className="p-6 border-t border-white/5 shrink-0 bg-[#14182d] rounded-b-2xl flex justify-end">
            <button 
                type="submit" 
                form="flashcard-form"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
                Criar Flashcard
            </button>
        </div>
      </div>
    </div>
  );
};

export default MindMapFlashcardModal;
