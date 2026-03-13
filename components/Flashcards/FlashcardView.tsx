
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { Deck, CardPresentation, FlashcardType, AdaptFlashcard, OcclusionRect } from '../../types';
import { Icon } from '../ui/Icon';
import PortabilityModal from './PortabilityModal';
import ImageOcclusionEditor from './ImageOcclusionEditor';
import AudioRecorder from './AudioRecorder';
import RichTextEditor from './RichTextEditor';
import ActionCenter from './ActionCenter';
import StatisticsView from './StatisticsView';
import MassEditView from './MassEditView';
import MemorySettingsView from './MemorySettingsView';
import { useContextMenu } from '../../hooks/useContextMenu';

type ViewMode = 'LIBRARY' | 'STUDY' | 'ACTION_CENTER' | 'RESULTS' | 'BROWSER' | 'SETTINGS';

interface FlashcardToast {
    id: string;
    message: string;
    type: 'success' | 'info';
}

const renderClozeText = (text: string | undefined, targetIdx: number, reveal: boolean) => {
    if (!text) return "";
    const clozeRegex = /{{c(\d+)::(.*?)}}/g;
    return text.replace(clozeRegex, (match, idx, content) => {
        const currentIdx = parseInt(idx);
        if (currentIdx === targetIdx) {
            return reveal 
                ? `<span class="text-blue-400 font-bold border-b-2 border-blue-400/30">${content}</span>` 
                : `<span class="bg-blue-600/20 text-blue-400 px-2 rounded border border-blue-500/30 font-mono">[...]</span>`;
        }
        return content;
    });
};

const DeckTreeItem: React.FC<{ 
    deck: Deck, level: number, allDecks: Deck[], onToggleExpand: (id: string) => void, expanded: Record<string, boolean>,
    onSelect: (id: string) => void, onAddSubDeck: (parentId: string) => void, onEdit: (deck: Deck) => void,
    onQuickAddCard: (deckId: string) => void, onDelete: (id: string) => void
}> = ({ deck, level, allDecks, onToggleExpand, expanded, onSelect, onAddSubDeck, onEdit, onQuickAddCard, onDelete }) => {
    const { getDeckStats } = useFlashcards();
    const { handleContextMenu } = useContextMenu();
    const stats = getDeckStats(deck.id);
    const subDecks = allDecks.filter(d => d.parentId === deck.id);
    const hasChildren = subDecks.length > 0;
    const isExpanded = expanded[deck.id];

    const onDeckContextMenu = (e: React.MouseEvent) => {
        handleContextMenu(e, [
            { label: 'Estudar Agora', icon: 'play', onClick: () => onSelect(deck.id) },
            { label: 'Adicionar Carta', icon: 'plus', onClick: () => onQuickAddCard(deck.id) },
            { type: 'separator' },
            { label: 'Novo Sub-baralho', icon: 'folder', onClick: () => onAddSubDeck(deck.id) },
            { label: 'Renomear', icon: 'edit2', onClick: () => onEdit(deck) },
            { type: 'separator' },
            { label: 'Excluir Baralho', icon: 'trash', variant: 'danger', onClick: () => onDelete(deck.id) }
        ]);
    };

    return (
        <div className="flex flex-col select-none animate-[fadeIn_0.2s_ease]">
            <div 
                className={`group flex items-center py-3 px-4 border-b border-white/5 transition-all cursor-pointer relative ${level === 0 ? 'bg-[#1e233c]/20' : 'hover:bg-[#1e233c]/40'} ${stats.criticalCards > 0 ? 'border-l-2 border-l-red-500/50' : 'border-l-2 border-l-transparent'}`} 
                onClick={() => onSelect(deck.id)}
                onContextMenu={onDeckContextMenu}
            >
                <div className="flex-1 flex items-center gap-2 min-w-0" style={{ paddingLeft: `${level * 24}px` }}>
                    <button onClick={(e) => { e.stopPropagation(); onToggleExpand(deck.id); }} className={`w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-500 transition-colors ${!hasChildren && 'invisible'}`}><Icon name={isExpanded ? "chevronDown" : "chevronRight"} size={14} /></button>
                    <div className={`text-blue-400 ${hasChildren ? 'opacity-100' : 'opacity-70'}`}><Icon name={hasChildren ? "folder" : "cards"} size={18} /></div>
                    <div className="flex flex-col min-w-0 ml-1"><span className="text-sm font-medium text-gray-200 truncate">{deck.title}</span></div>
                </div>
                <div className="flex items-center gap-4 mr-4">
                    <div className="flex items-center gap-1 min-w-[40px] justify-end" title="Novos"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[10px] font-mono text-gray-500">{stats.newCards}</span></div>
                    <div className="flex items-center gap-1 min-w-[40px] justify-end" title="Revisar"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><span className="text-[10px] font-mono text-gray-500">{stats.criticalCards}</span></div>
                </div>
                
                {/* Botões visíveis ao hover (atalhos rápidos) */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onQuickAddCard(deck.id); }} className="p-1.5 text-gray-400 hover:text-green-400 rounded transition-colors" title="Add Card"><Icon name="plus" size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onAddSubDeck(deck.id); }} className="p-1.5 text-gray-400 hover:text-blue-400 rounded transition-colors" title="Novo Subdeck"><Icon name="folderOpen" size={14} /></button>
                </div>
            </div>
            {isExpanded && hasChildren && (
                <div className="flex flex-col border-l border-white/5 ml-6">
                    {subDecks.map(sub => (
                        <DeckTreeItem 
                            key={sub.id} 
                            deck={sub} 
                            level={level + 1} 
                            allDecks={allDecks} 
                            onToggleExpand={onToggleExpand} 
                            expanded={expanded} 
                            onSelect={onSelect} 
                            onAddSubDeck={onAddSubDeck} 
                            onEdit={onEdit} 
                            onQuickAddCard={onQuickAddCard} 
                            onDelete={onDelete} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const RatingButton = ({ label, interval, colorHover, onClick, shortcut, showInterval }: { label: string, interval: string, colorHover: string, onClick: () => void, shortcut: string, showInterval: boolean }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-800 transition-all active:scale-95 group hover:bg-white/[0.02] ${colorHover} bg-transparent flex-1`}>
        {showInterval && <span className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tight">{interval}</span>}
        <span className="text-base font-bold text-gray-400 group-hover:text-current">{label}</span>
        <span className="text-[9px] font-mono border border-white/10 px-2 py-0.5 rounded text-gray-600 mt-2">{shortcut}</span>
    </button>
);

const StudySession: React.FC<{ 
    selectedDeckId: string | 'CUSTOM', 
    customQueue?: CardPresentation[],
    onExit: () => void, 
    getDueCards: (deckId: string) => CardPresentation[], 
    processReview: (cardId: string, rating: any) => string
}> = ({ selectedDeckId, customQueue, onExit, getDueCards, processReview }) => {
    const { settings } = useFlashcards();
    const [queue, setQueue] = useState<CardPresentation[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
    const [isFinished, setIsFinished] = useState(false);
    const [typeInput, setTypeInput] = useState('');
    const [toasts, setToasts] = useState<FlashcardToast[]>([]);
    const [timerSeconds, setTimerSeconds] = useState(0);
    
    const [capturedAudio, setCapturedAudio] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedDeckId === 'CUSTOM' && customQueue) {
            setQueue(customQueue);
        } else if (selectedDeckId !== 'CUSTOM') {
            const cards = getDueCards(selectedDeckId);
            setQueue(cards);
        }
    }, [selectedDeckId, customQueue, getDueCards]);

    useEffect(() => {
        let interval: any;
        if (!isFinished && settings.session.showTimer) {
            interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isFinished, settings.session.showTimer]);

    const currentItem = queue[currentIndex];

    useEffect(() => {
        if (!isFlipped && currentItem?.card.type === 'TYPING') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (!isFlipped && currentItem?.card.type === 'AUDIO' && currentItem.card.audioData?.frontAudio && settings.session.autoPlayAudio) {
            setTimeout(() => audioRef.current?.play(), 300);
        }
    }, [currentIndex, isFlipped, currentItem, settings.session.autoPlayAudio]);

    const addToast = (message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [{ id, message, type: 'info' as 'info' }, ...prev].slice(0, 3));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 1500);
    };

    const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
        if (!currentItem) return;
        
        const feedback = processReview(currentItem.card.id, rating);
        addToast(feedback);
        
        setSessionStats(prev => ({ 
            total: prev.total + 1, 
            correct: prev.correct + (rating === 'again' ? 0 : 1) 
        }));

        setTypeInput('');
        setCapturedAudio(null);
        setTimerSeconds(0);
        
        if (currentIndex < queue.length - 1) { 
            setIsFlipped(false); 
            setCurrentIndex(prev => prev + 1); 
        } else { 
            setIsFinished(true); 
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isFinished || queue.length === 0) return;
            if (e.code === 'Space' || e.code === 'Enter') {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLDivElement && (e.target as HTMLElement).isContentEditable) return; 
                e.preventDefault(); 
                if (!isFlipped) setIsFlipped(true);
            } else if (isFlipped) {
                const keys = settings.ui.leftyMode 
                    ? { '4': 'again', '3': 'hard', '2': 'good', '1': 'easy' } 
                    : { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
                const rating = (keys as any)[e.key];
                if (rating) handleRate(rating);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, isFinished, queue, currentIndex, settings.ui.leftyMode]);

    if (queue.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#0a0e27]">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce"><Icon name="checkSquare" size={40} className="text-green-500" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Tudo revisado!</h2>
            <button onClick={onExit} className="mt-8 px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">Voltar</button>
        </div>
    );

    if (isFinished) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#0a0e27]">
            <h2 className="text-3xl font-bold text-white mb-8">Sessão Concluída!</h2>
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="flex flex-col items-center"><div className="text-5xl font-bold text-gray-200">{sessionStats.total}</div><div className="text-xs text-gray-500 uppercase font-bold mt-2">Estudados</div></div>
                <div className="flex flex-col items-center"><div className="text-5xl font-bold text-blue-400">{sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 100}%</div><div className="text-xs text-gray-500 uppercase font-bold mt-2">Acertos</div></div>
            </div>
            <button onClick={onExit} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold">Concluir</button>
        </div>
    );

    if (!currentItem || !currentItem.card) return null;

    const { card } = currentItem;
    const isTyping = card.type === 'TYPING';
    const isCloze = card.type === 'CLOZE';
    const isOcclusion = card.type === 'IMAGE_OCCLUSION';
    const isAudio = card.type === 'AUDIO';
    const clozeIdx = card.clozeIndex || 1;

    // Apply UI Settings (Theme)
    const cardThemeClasses = {
        midnight: "bg-[#14182d] border-white/5 text-gray-200",
        paper: "bg-[#f4f1ea] border-black/5 text-gray-900 shadow-xl",
        foco: "bg-black border-white/10 text-gray-100",
        dark: "bg-[#1a1a1a] border-white/5 text-gray-200"
    }[settings.ui.theme];

    // Apply Typography and Size
    const fontStyle = {
        fontFamily: settings.ui.fontFamily === 'serif' ? 'Georgia, serif' : settings.ui.fontFamily === 'mono' ? 'monospace' : 'inherit',
        fontSize: `${settings.ui.fontSize}px`,
        textAlign: settings.ui.alignment as any
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0e27] relative overflow-hidden">
            <div className="absolute bottom-10 right-10 flex flex-col gap-2 z-[100] pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="bg-blue-500/30 backdrop-blur-md text-blue-200 px-5 py-3 rounded-2xl text-[10px] font-bold shadow-xl animate-[slideInRight_0.2s_ease] flex items-center gap-3 border border-blue-400/20">
                        <Icon name="clock" size={12} className="opacity-70" />
                        {toast.message}
                    </div>
                ))}
            </div>

            <div className="p-4 flex justify-between items-center border-b border-white/5 bg-[#0f1223]">
                <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><Icon name="x" size={20} /></button>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{currentIndex + 1} de {queue.length}</div>
                    {settings.session.showTimer && (
                        <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
                            <Icon name="clock" size={12} /> {timerSeconds}s
                        </div>
                    )}
                </div>
                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full relative">
                <div onClick={() => !isFlipped && card.type !== 'AUDIO' && setIsFlipped(true)} className={`w-full min-h-[380px] rounded-[40px] shadow-2xl p-12 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${cardThemeClasses} ${!isFlipped && card.type !== 'AUDIO' ? 'cursor-pointer hover:border-blue-500/30' : ''}`}>
                    <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1 rounded-full ${currentItem.explanation.visualCue === 'critical' ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                            {currentItem.explanation.message}
                        </span>
                    </div>
                    
                    <div className="w-full space-y-6" style={fontStyle}>
                        <style>{`
                            .card-content * { font-size: inherit !important; font-family: inherit !important; color: inherit !important; }
                            .card-content strong { font-weight: 800; opacity: 1; }
                            ${settings.ui.theme === 'paper' ? '.card-content { color: #1a202c; }' : ''}
                        `}</style>
                        
                        {isAudio ? (
                            <div className="space-y-10 flex flex-col items-center card-content">
                                <div className="w-24 h-24 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 animate-pulse border border-blue-500/20">
                                    <Icon name="play" size={40} className="fill-current" />
                                </div>
                                <audio ref={audioRef} src={card.audioData?.frontAudio} controls className="opacity-50 hover:opacity-100 transition-opacity" />
                                {card.front && <div className="opacity-60 italic" dangerouslySetInnerHTML={{ __html: card.front }} />}
                                {!isFlipped && (
                                    <div className="w-full max-w-xs mx-auto">
                                        <AudioRecorder onAudioReady={setCapturedAudio} label="Grave sua resposta para comparar" />
                                    </div>
                                )}
                                {isFlipped && (
                                    <div className="mt-8 pt-8 border-t border-white/5 w-full animate-[fadeIn_0.5s_ease]">
                                        <div className="text-blue-400 font-bold" dangerouslySetInnerHTML={{ __html: card.back || "Resposta de Áudio" }} />
                                        {capturedAudio && (
                                            <div className="flex flex-col items-center gap-2 p-4 bg-[#0a0e27]/50 rounded-2xl border border-blue-500/10 mt-4">
                                                <span className="text-[10px] text-blue-400 font-bold uppercase">Sua Gravação:</span>
                                                <audio src={capturedAudio} controls className="h-8" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : isOcclusion && card.occlusionData ? (
                            <div className="relative inline-block max-w-full card-content">
                                <img src={card.occlusionData.imageUrl} className="max-w-full max-h-[50vh] rounded-lg block" alt="Study" />
                                {card.occlusionData.rects.map(rect => {
                                    const isTarget = rect.id === card.occlusionData?.targetRectId;
                                    const show = !isTarget || !isFlipped;
                                    if (!show) return null;
                                    return (
                                        <div key={rect.id} className="absolute bg-black" style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`, border: isTarget ? '2px solid #ef4444' : 'none' }} />
                                    );
                                })}
                            </div>
                        ) : isCloze ? (
                            <div className="space-y-6 card-content">
                                <div className={`transition-all ${isFlipped ? 'opacity-40 scale-95' : 'scale-100'}`} dangerouslySetInnerHTML={{ __html: renderClozeText(card.front, clozeIdx, isFlipped) }} />
                                {(card.back?.includes(`{{c${clozeIdx}::`) || isFlipped) && card.back && (
                                    <div className={`mt-6 pt-6 border-t border-white/5 transition-all ${!isFlipped ? 'opacity-70' : 'text-blue-400 font-bold'}`} dangerouslySetInnerHTML={{ __html: renderClozeText(card.back, clozeIdx, isFlipped) }} />
                                )}
                            </div>
                        ) : (
                            <div className="card-content">
                                <div className={`transition-all ${isFlipped ? 'mb-8 opacity-40 scale-90' : 'scale-100'}`} dangerouslySetInnerHTML={{ __html: card.front }} />
                                {isFlipped && (
                                    <div className="mt-8 pt-8 border-t border-white/5 w-full animate-[fadeIn_0.5s_ease]">
                                        <div className="text-blue-400 font-bold" dangerouslySetInnerHTML={{ __html: card.back }} />
                                    </div>
                                )}
                            </div>
                        )}
                        {isTyping && !isFlipped && (
                            <input ref={inputRef} type="text" value={typeInput} onChange={e => setTypeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setIsFlipped(true)} placeholder="Digite sua resposta..." className="mt-8 w-full max-w-md bg-[#0a0e27] border border-blue-500/30 rounded-xl px-4 py-3 text-center text-white outline-none focus:border-blue-500 transition-all" />
                        )}
                        {isTyping && isFlipped && (
                            <div className="mt-6 p-4 rounded-2xl bg-[#0a0e27]/50 border border-white/5 flex flex-col items-center">
                                <span className="text-[10px] text-gray-500 uppercase font-bold mb-2">Sua Resposta:</span>
                                <span className={`text-lg font-bold ${typeInput.trim().toLowerCase() === card.back.trim().toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>{typeInput || "(Vazio)"}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full mt-12 min-h-[120px] flex items-center justify-center">
                    {!isFlipped ? <button onClick={() => setIsFlipped(true)} className="px-16 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all text-xl">Ver Resposta</button>
                    : <div className={`flex gap-4 w-full animate-[slideUp_0.2s_ease] ${settings.ui.leftyMode ? 'flex-row-reverse' : 'flex-row'}`}>
                        <RatingButton showInterval={settings.session.showIntervals} label="Errei" interval="< 1m" colorHover="hover:text-red-400 hover:border-red-400/40" onClick={() => handleRate('again')} shortcut={settings.ui.leftyMode ? "4" : "1"} />
                        <RatingButton showInterval={settings.session.showIntervals} label="Difícil" interval="2d" colorHover="hover:text-orange-300 hover:border-orange-400/40" onClick={() => handleRate('hard')} shortcut={settings.ui.leftyMode ? "3" : "2"} />
                        <RatingButton showInterval={settings.session.showIntervals} label="Bom" interval="4d" colorHover="hover:text-blue-300 hover:border-blue-400/40" onClick={() => handleRate('good')} shortcut={settings.ui.leftyMode ? "2" : "3"} />
                        <RatingButton showInterval={settings.session.showIntervals} label="Fácil" interval="7d" colorHover="hover:text-emerald-300 hover:border-emerald-400/40" onClick={() => handleRate('easy')} shortcut={settings.ui.leftyMode ? "1" : "4"} />
                    </div>}
                </div>
            </div>
        </div>
    );
};

const FlashcardView: React.FC = () => {
  const { decks, addDeck, deleteDeck, updateDeck, addCard, getDueCards, processReview, getDeckStats } = useFlashcards();
  const [activeView, setActiveView] = useState<ViewMode>('LIBRARY');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDecks, setExpandedDecks] = useState<Record<string, boolean>>({});
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [parentDeckId, setParentDeckId] = useState<string | undefined>(undefined);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [targetDeckId, setTargetDeckId] = useState<string>('');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardType, setCardType] = useState<FlashcardType>('BASIC');
  const [isPortabilityModalOpen, setIsPortabilityModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [customQueue, setCustomQueue] = useState<CardPresentation[] | undefined>(undefined);
  const [isOcclusionEditorOpen, setIsOcclusionEditorOpen] = useState(false);
  const [occlusionImage, setOcclusionImage] = useState<string | null>(null);
  const [frontAudioBase64, setFrontAudioBase64] = useState<string | null>(null);

  const rootDecks = useMemo(() => {
      let filtered = decks.filter(d => !d.parentId);
      if (searchQuery) filtered = decks.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return filtered;
  }, [decks, searchQuery]);

  const handleOpenDeckModal = (parentId?: string, deckToEdit?: Deck) => {
      if (deckToEdit) { setEditingDeck(deckToEdit); setNewDeckName(deckToEdit.title); setParentDeckId(undefined); }
      else { setEditingDeck(null); setNewDeckName(''); setParentDeckId(parentId); }
      setIsDeckModalOpen(true);
  };

  const handleSaveDeck = (e: React.FormEvent) => {
      e.preventDefault(); if (!newDeckName.trim()) return;
      if (editingDeck) updateDeck(editingDeck.id, { title: newDeckName }); else addDeck(newDeckName, '', parentDeckId);
      setIsDeckModalOpen(false);
  };

  const handleOpenCardModal = (deckId?: string) => {
      if (decks.length === 0) return alert("Crie um deck primeiro!");
      setTargetDeckId(deckId || decks[0].id); setCardFront(''); setCardBack(''); setCardType('BASIC'); setFrontAudioBase64(null); setIsCardModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setOcclusionImage(reader.result as string);
              setIsOcclusionEditorOpen(true);
              setIsCardModalOpen(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveOcclusions = (rects: OcclusionRect[]) => {
      if (occlusionImage && targetDeckId) {
          addCard(targetDeckId, cardFront || "Image Occlusion", "", 'IMAGE_OCCLUSION', { imageUrl: occlusionImage, rects });
          setIsOcclusionEditorOpen(false);
          setOcclusionImage(null);
          setCardFront('');
      }
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
      e.preventDefault(); 
      if (!targetDeckId) return;
      if (cardType === 'IMAGE_OCCLUSION') { document.getElementById('occlusion-file-input')?.click(); return; }
      if (cardType === 'AUDIO' && !frontAudioBase64) { alert("Grave ou faça upload de um áudio para a frente."); return; }
      if (cardType !== 'CLOZE' && cardType !== 'AUDIO' && (!cardFront.trim() || !cardBack.trim())) return;
      addCard(targetDeckId, cardFront, cardBack, cardType, cardType === 'AUDIO' ? { audioData: { frontAudio: frontAudioBase64 } } : undefined);
      setCardFront(''); setCardBack(''); setFrontAudioBase64(null);
  };

  const startActionSession = (queue: CardPresentation[]) => {
    setCustomQueue(queue);
    setSelectedDeckId('CUSTOM');
    setActiveView('STUDY');
  };

  return (
    <div className="flex h-full w-full bg-[#0a0e27] text-gray-200 overflow-hidden">
        <div className="w-[240px] bg-[#0f1223] border-r border-white/5 flex flex-col shrink-0 z-20">
            <div className="p-8 border-b border-white/5 flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg"><Icon name="cards" size={24} /></div><h1 className="text-lg font-bold text-white tracking-tight uppercase">Flashcards</h1></div>
            <div className="flex-1 p-4 space-y-2">
                <button onClick={() => setActiveView('ACTION_CENTER')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'ACTION_CENTER' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Icon name="play" size={20} /> Modo de Ação</button>
                <button onClick={() => setActiveView('LIBRARY')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'LIBRARY' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Icon name="cards" size={20} /> Meus Decks</button>
                <button onClick={() => setActiveView('BROWSER')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'BROWSER' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Icon name="list" size={20} /> Navegador</button>
                <button onClick={() => setActiveView('RESULTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'RESULTS' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Icon name="rotateCw" size={20} /> Resultados</button>
                <div className="h-[1px] bg-white/5 my-4" />
                <button onClick={() => setActiveView('SETTINGS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'SETTINGS' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Icon name="settings" size={20} /> Configurações</button>
                <button onClick={() => setIsPortabilityModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all"><Icon name="download" size={20} /> Portabilidade</button>
            </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
            {activeView === 'LIBRARY' && <>
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#0a0e27]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="relative w-72"><Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" /><input type="text" placeholder="Filtrar coleção..." className="w-full bg-[#14182d] border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-gray-300 outline-none focus:border-blue-500/40" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                    <div className="flex gap-3"><button onClick={() => handleOpenDeckModal()} className="px-6 py-2.5 bg-[#14182d] hover:bg-[#1e233c] text-gray-300 text-xs font-bold rounded-xl border border-white/5">Criar Deck</button><button onClick={() => handleOpenCardModal()} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"><Icon name="plus" size={14} /> Adicionar Carta</button></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4"><div className="max-w-5xl mx-auto">{rootDecks.length === 0 ? <div className="flex flex-col items-center justify-center py-32 opacity-30 text-center"><Icon name="cards" size={64} className="mb-4" /><p className="text-xl font-bold">Nenhum deck criado</p></div> : rootDecks.map(deck => <DeckTreeItem key={deck.id} deck={deck} level={0} allDecks={decks} expanded={expandedDecks} onToggleExpand={id => setExpandedDecks(prev => ({...prev, [id]: !prev[id]}))} onSelect={id => { setSelectedDeckId(id); setActiveView('STUDY'); }} onAddSubDeck={handleOpenDeckModal} onEdit={d => handleOpenDeckModal(undefined, d)} onQuickAddCard={handleOpenCardModal} onDelete={deleteDeck} />)}</div></div>
            </>}
            
            {activeView === 'ACTION_CENTER' && <ActionCenter onStartSession={startActionSession} />}
            {activeView === 'RESULTS' && <StatisticsView />}
            {activeView === 'BROWSER' && <MassEditView />}
            {activeView === 'SETTINGS' && <MemorySettingsView />}
            {activeView === 'STUDY' && <StudySession selectedDeckId={selectedDeckId!} customQueue={customQueue} onExit={() => { setActiveView('LIBRARY'); setCustomQueue(undefined); }} getDueCards={getDueCards} processReview={processReview} />}
        </div>
        
        {isOcclusionEditorOpen && occlusionImage && (
            <div className="fixed inset-0 z-[150] bg-black">
                <ImageOcclusionEditor imageUrl={occlusionImage} onSave={handleSaveOcclusions} onCancel={() => { setIsOcclusionEditorOpen(false); setOcclusionImage(null); }} />
            </div>
        )}

        {isPortabilityModalOpen && <PortabilityModal onClose={() => setIsPortabilityModalOpen(false)} />}
        {isDeckModalOpen && <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[#14182d] border border-white/10 w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-[popIn_0.2s_ease]"><h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest mb-6">{editingDeck ? 'Renomear' : 'Novo Deck'}</h3><form onSubmit={handleSaveDeck}><input autoFocus className="w-full bg-[#0a0e27] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/40" placeholder="Ex: Anatomia" value={newDeckName} onChange={e => setNewDeckName(e.target.value)} /><div className="flex gap-3 mt-8"><button type="button" onClick={() => setIsDeckModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-gray-500">Cancelar</button><button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg">Salvar</button></div></form></div></div>}
        {isCardModalOpen && <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[#14182d] border border-white/10 w-full max-w-xl rounded-[40px] shadow-2xl animate-[popIn_0.2s_ease]">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Novo Flashcard</h3><button onClick={() => setIsCardModalOpen(false)} className="text-gray-500 hover:text-white"><Icon name="x" size={20} /></button></div>
            <div className="max-h-[70vh] overflow-y-auto p-10 pt-6 space-y-6 custom-scrollbar">
                <form onSubmit={handleAddCardSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Deck</label>
                            <select className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-blue-500/40" value={targetDeckId} onChange={e => setTargetDeckId(e.target.value)}>{decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">Tipo</label>
                            <select className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-blue-500/40" value={cardType} onChange={e => setCardType(e.target.value as FlashcardType)}>
                                <option value="BASIC">Simples</option>
                                <option value="REVERSE">Inverso (A⇄B)</option>
                                <option value="CLOZE">Omissão (Cloze)</option>
                                <option value="TYPING">Digitação</option>
                                <option value="IMAGE_OCCLUSION">Oclusão de Imagem</option>
                                <option value="AUDIO">Áudio (Pronúncia)</option>
                            </select>
                        </div>
                    </div>
                    {cardType === 'AUDIO' && <AudioRecorder onAudioReady={setFrontAudioBase64} label="Áudio da Pergunta/Pronúncia" />}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">{cardType === 'CLOZE' ? 'Texto Base' : cardType === 'IMAGE_OCCLUSION' ? 'Título/Contexto' : cardType === 'AUDIO' ? 'Texto da Pergunta (Opcional)' : 'Frente (Pergunta)'}</label>
                        <RichTextEditor value={cardFront} onChange={(val) => setCardFront(val)} showCloze={cardType === 'CLOZE'} placeholder={cardType === 'CLOZE' ? 'A capital é {{c1::Paris}}' : 'Digite o conteúdo da frente...'} />
                    </div>
                    {cardType !== 'IMAGE_OCCLUSION' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-600 uppercase ml-1">{cardType === 'CLOZE' ? 'Verso (Opcional/Explicação)' : 'Verso (Resposta)'}</label>
                            <RichTextEditor value={cardBack} onChange={(val) => setCardBack(val)} showCloze={cardType === 'CLOZE'} placeholder="Digite o conteúdo do verso..." />
                        </div>
                    )}
                    {cardType === 'IMAGE_OCCLUSION' && <div className="hidden"><input id="occlusion-file-input" type="file" accept="image/*" onChange={handleImageUpload} /></div>}
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={() => setIsCardModalOpen(false)} className="px-8 py-3 text-xs font-bold text-gray-500">Fechar</button><button type="submit" disabled={!targetDeckId} className="px-12 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg">{cardType === 'IMAGE_OCCLUSION' ? 'Escolher Imagem' : 'Salvar'}</button></div>
                </form>
            </div>
        </div></div>}
    </div>
  );
};

export default FlashcardView;
