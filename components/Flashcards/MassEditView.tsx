
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { Icon } from '../ui/Icon';
import { Flashcard, Deck, FlashcardType, CognitiveStage } from '../../types';
import { useContextMenu } from '../../hooks/useContextMenu';

type BrowserFilter = 
  | { type: 'ALL' }
  | { type: 'STATE', value: CognitiveStage | 'SUSPENDED' }
  | { type: 'TODAY', value: 'ADDED' | 'STUDIED' | 'DUE' }
  | { type: 'FLAG', value: Flashcard['flag'] }
  | { type: 'DECK', value: string }
  | { type: 'TAG', value: string };

const STAGE_CONFIG: Record<CognitiveStage, { label: string, color: string, icon: string }> = {
    'S1_ACQUISITION': { label: 'Aquisição (S1)', color: 'text-blue-400', icon: 'plus' },
    'S2_FIXATION': { label: 'Fixação (S2)', color: 'text-orange-400', icon: 'zap' },
    'S3_CONSOLIDATION': { label: 'Consolidação (S3)', color: 'text-emerald-400', icon: 'layers' },
    'S4_RETENTION': { label: 'Retenção (S4)', color: 'text-purple-400', icon: 'shield' },
    'S5_LAPSE': { label: 'Lapso (S5)', color: 'text-red-400', icon: 'rotateCw' }
};

const MenuDropdown: React.FC<{ label: string, items: { label: string, shortcut?: string, onClick: () => void, variant?: 'default' | 'danger', disabled?: boolean }[] }> = ({ label, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-md ${isOpen ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
                {label}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-[#1e233c] border border-white/10 rounded-xl shadow-2xl z-[100] py-1.5 animate-[fadeIn_0.1s_ease] backdrop-blur-xl">
                    {items.map((item, idx) => (
                        <button 
                            key={idx}
                            disabled={item.disabled}
                            onClick={() => { if(!item.disabled) { item.onClick(); setIsOpen(false); } }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${item.disabled ? 'opacity-20 cursor-not-allowed' : item.variant === 'danger' ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-blue-600 hover:text-white'}`}
                        >
                            <span>{item.label}</span>
                            {item.shortcut && <span className="text-[9px] opacity-40 font-mono ml-4">{item.shortcut}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface DeckManagerRowProps {
  deck: Deck;
  level?: number;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  updateDeck: (id: string, data: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  onReparent: (id: string) => void;
  allCards: Flashcard[];
  allDecks: Deck[];
}

const DeckManagerRow: React.FC<DeckManagerRowProps> = ({ 
    deck, level = 0, expanded, onToggleExpand, editingId, setEditingId, updateDeck, deleteDeck, onReparent, allCards, allDecks 
}) => {
    const children = allDecks.filter(d => d.parentId === deck.id);
    const isExpanded = expanded.has(deck.id);
    const cardCount = allCards.filter(c => c.deckId === deck.id).length;
    
    const getTotalCardsRecursive = (dId: string): number => {
        let count = allCards.filter(c => c.deckId === dId).length;
        allDecks.filter(d => d.parentId === dId).forEach(child => {
            count += getTotalCardsRecursive(child.id);
        });
        return count;
    };
    const totalRecursiveCount = getTotalCardsRecursive(deck.id);

    return (
        <div className="flex flex-col">
            <div className={`group flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent hover:bg-white/5 ${editingId === deck.id ? 'bg-blue-600/10 border-blue-500/30' : ''}`}>
                <div className="flex shrink-0" style={{ width: `${level * 20}px` }}>{level > 0 && <div className="w-full h-full border-l border-white/10 ml-2" />}</div>
                <button onClick={() => onToggleExpand(deck.id)} className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-gray-500 ${children.length === 0 && 'invisible'}`}><Icon name={isExpanded ? "chevronDown" : "chevronRight"} size={12} /></button>
                <div className={`shrink-0 ${totalRecursiveCount > 0 ? 'text-blue-400' : 'text-gray-600'}`}><Icon name={children.length > 0 ? (isExpanded ? "folderOpen" : "folder") : "cards"} size={16} /></div>
                <div className="flex-1 min-w-0">
                    {editingId === deck.id ? (
                        <input autoFocus defaultValue={deck.title} onBlur={(e) => { if(e.target.value !== deck.title && e.target.value.trim()) updateDeck(deck.id, { title: e.target.value }); setEditingId(null); }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className="w-full bg-blue-900/30 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white outline-none" />
                    ) : (
                        <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-200 truncate">{deck.title}</span><button onClick={() => setEditingId(deck.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-white transition-opacity"><Icon name="edit2" size={10} /></button></div>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end"><span className="text-[10px] font-mono font-bold text-blue-400/80">{totalRecursiveCount} total</span>{cardCount > 0 && <span className="text-[8px] font-bold text-gray-600 uppercase">{cardCount} diretos</span>}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Reparentar" onClick={() => onReparent(deck.id)} className="p-2 rounded-lg text-gray-500 hover:bg-white/10 hover:text-blue-400"><Icon name="move" size={14} /></button>
                        <button title="Excluir" onClick={() => { if(confirm(`Excluir baralho "${deck.title}"? Todos os cards e sub-baralhos dele também serão removidos.`)) deleteDeck(deck.id); }} className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400"><Icon name="trash" size={14} /></button>
                    </div>
                </div>
            </div>
            {isExpanded && children.length > 0 && (
                <div className="flex flex-col">
                    {children.map(child => (
                        <DeckManagerRow 
                            key={child.id} 
                            deck={child} 
                            level={level + 1}
                            expanded={expanded}
                            onToggleExpand={onToggleExpand}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            updateDeck={updateDeck}
                            deleteDeck={deleteDeck}
                            onReparent={onReparent}
                            allCards={allCards}
                            allDecks={allDecks}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const MassEditView: React.FC = () => {
  const { 
    cards, decks, 
    updateDeck, deleteDeck,
    bulkDeleteCards, bulkMoveCards, bulkSuspendCards, 
    bulkUpdateFlag, bulkUpdateTags, bulkUpdateType, atomicPruneDecks
  } = useFlashcards();

  const { handleContextMenu } = useContextMenu();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BrowserFilter>({ type: 'ALL' });
  const [sortKey, setSortKey] = useState<keyof Flashcard | 'deck'>('front');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedDecksInSidebar, setExpandedDecksInSidebar] = useState<Set<string>>(new Set());
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [isPruning, setIsPruning] = useState(false);

  // Estados dos Modais
  const [actionModal, setActionModal] = useState<'NONE' | 'MOVE' | 'TAGS_ADD' | 'TAGS_REMOVE' | 'MANAGE_DECKS'>('NONE');
  const [modalInputValue, setModalInputValue] = useState('');
  const [deckTreeExpanded, setDeckTreeExpanded] = useState<Set<string>>(new Set());
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    const now = Date.now();
    const today = new Date().toDateString();

    const getDeckAndChildrenIds = (parentId: string): string[] => {
        const ids = [parentId];
        decks.filter(d => d.parentId === parentId).forEach(child => {
            ids.push(...getDeckAndChildrenIds(child.id));
        });
        return ids;
    };

    return cards.filter(c => {
      const matchesSearch = c.front.toLowerCase().includes(search.toLowerCase()) || 
                            c.back.toLowerCase().includes(search.toLowerCase()) ||
                            c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      switch(activeFilter.type) {
        case 'STATE':
            if (activeFilter.value === 'SUSPENDED') return !!c.isSuspended;
            return c.stage === activeFilter.value && !c.isSuspended;
        case 'TAG':
            return c.tags?.includes(activeFilter.value);
        case 'TODAY':
          if (activeFilter.value === 'ADDED') return new Date(c.createdAt).toDateString() === today;
          if (activeFilter.value === 'DUE') return !c.isSuspended && (c.nextReview ? c.nextReview <= now : true);
          if (activeFilter.value === 'STUDIED') return c.metrics.history.some(h => new Date(h.timestamp).toDateString() === today);
          return true;
        case 'FLAG': return c.flag === activeFilter.value;
        case 'DECK': 
          return getDeckAndChildrenIds(activeFilter.value).includes(c.deckId);
        default: return true;
      }
    });
  }, [cards, search, activeFilter, decks]);

  const sortedCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
      let valA: any = a[sortKey as keyof Flashcard] || '';
      let valB: any = b[sortKey as keyof Flashcard] || '';
      if (sortKey === 'deck') {
        valA = decks.find(d => d.id === a.deckId)?.title || '';
        valB = decks.find(d => d.id === b.deckId)?.title || '';
      }
      const order = sortOrder === 'asc' ? 1 : -1;
      return valA.toString().localeCompare(valB.toString()) * order;
    });
  }, [filteredCards, sortKey, sortOrder, decks]);

  const handleCardClick = (e: React.MouseEvent, cardId: string) => {
      const next = new Set<string>(selectedIds);
      
      if (e.shiftKey && lastSelectedId) {
          const currentIndex = sortedCards.findIndex(c => c.id === cardId);
          const lastIndex = sortedCards.findIndex(c => c.id === lastSelectedId);
          
          if (currentIndex !== -1 && lastIndex !== -1) {
              const start = Math.min(currentIndex, lastIndex);
              const end = Math.max(currentIndex, lastIndex);
              for (let i = start; i <= end; i++) {
                  next.add(sortedCards[i].id);
              }
          }
      } else if (e.ctrlKey || e.metaKey) {
          if (next.has(cardId)) next.delete(cardId);
          else next.add(cardId);
          setLastSelectedId(cardId);
      } else {
          next.clear();
          next.add(cardId);
          setLastSelectedId(cardId);
      }
      
      setSelectedIds(next);
  };

  const onRowContextMenu = (e: React.MouseEvent, card: Flashcard) => {
      // Se a linha não estiver selecionada, seleciona ela primeiro (e limpa as outras)
      if (!selectedIds.has(card.id)) {
          setSelectedIds(new Set([card.id]));
          setLastSelectedId(card.id);
      }
      
      // O menu opera sobre a seleção atual (que inclui este item agora)
      const targetIds = selectedIds.has(card.id) ? Array.from(selectedIds) : [card.id];

      handleContextMenu(e, [
          { label: card.isSuspended ? 'Reativar' : 'Suspender', icon: 'stop', onClick: () => bulkSuspendCards(targetIds, !card.isSuspended) },
          { label: 'Mover...', icon: 'move', onClick: () => setActionModal('MOVE') },
          { label: 'Gerenciar Tags...', icon: 'hash', onClick: () => setActionModal('TAGS_ADD') },
          { type: 'separator' },
          { label: 'Excluir', icon: 'trash', variant: 'danger', onClick: () => { if(confirm('Excluir cards selecionados?')) bulkDeleteCards(targetIds); } }
      ]);
  };

  const toggleSelectAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      const visibleIds = sortedCards.map(c => c.id);
      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
      
      const next = new Set(selectedIds);
      if (allVisibleSelected) {
          visibleIds.forEach(id => next.delete(id));
      } else {
          visibleIds.forEach(id => next.add(id));
      }
      setSelectedIds(next);
  };

  const handleApplyTags = () => {
    if (selectedIds.size > 0 && modalInputValue.trim()) {
      const tags = modalInputValue
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      if (actionModal === 'TAGS_ADD') {
          bulkUpdateTags(Array.from(selectedIds), tags, 'ADD');
      } else if (actionModal === 'TAGS_REMOVE') {
          bulkUpdateTags(Array.from(selectedIds), tags, 'REMOVE');
      }
      
      setModalInputValue('');
      setActionModal('NONE');
    }
  };

  const handleMoveToDeck = (deckId: string) => {
    if (selectedIds.size > 0) {
      bulkMoveCards(Array.from(selectedIds), deckId);
      setActionModal('NONE');
    }
  };

  const handleReparent = (deckId: string) => {
      const currentDeck = decks.find(d => d.id === deckId);
      const targetQuery = prompt(`Digite o NOME ou ID do novo baralho pai para "${currentDeck?.title}":\n(Deixe vazio para mover para a raiz)`);
      
      if (targetQuery === null) return;
      
      if (targetQuery.trim() === "") {
          updateDeck(deckId, { parentId: undefined });
          return;
      }

      const target = decks.find(d => d.id === targetQuery || d.title.toLowerCase() === targetQuery.trim().toLowerCase());
      if (!target) return alert("Baralho destino não encontrado.");
      if (target.id === deckId) return alert("Um baralho não pode ser pai de si mesmo.");

      updateDeck(deckId, { parentId: target.id });
  };

  const handlePruneEmpty = async () => {
      if (!confirm("Isso removerá TODOS os baralhos vazios automaticamente (sem cards e sem filhos).\nProsseguir?")) return;
      
      setIsPruning(true);
      try {
          const deletedCount = await atomicPruneDecks();
          if (deletedCount > 0) {
              alert(`${deletedCount} baralhos inúteis foram removidos.`);
          } else {
              alert("Nenhum baralho vazio encontrado.");
          }
      } finally {
          setIsPruning(false);
      }
  };

  const handleToggleExpand = (id: string) => {
      const next = new Set(deckTreeExpanded);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setDeckTreeExpanded(next);
  };

  const SidebarDeckTree = ({ parentId, level = 0 }: { parentId?: string, level?: number }) => {
      const children = decks.filter(d => d.parentId === parentId);
      if (children.length === 0) return null;
      return (
          <div className={`${level > 0 ? 'ml-3 border-l border-white/[0.03] pl-2' : ''} space-y-0.5`}>
              {children.map(d => {
                  const isExpanded = expandedDecksInSidebar.has(d.id);
                  const hasSub = decks.some(child => child.parentId === d.id);
                  const isActive = activeFilter.type === 'DECK' && activeFilter.value === d.id;
                  return (
                      <div key={d.id}>
                          <div 
                            onClick={() => setActiveFilter({ type: 'DECK', value: d.id })}
                            className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] cursor-pointer transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                          >
                              <button onClick={(e) => { e.stopPropagation(); const n = new Set(expandedDecksInSidebar); if(n.has(d.id)) n.delete(d.id); else n.add(d.id); setExpandedDecksInSidebar(n); }} className={`w-4 h-4 flex items-center justify-center rounded transition-colors hover:bg-white/10 ${!hasSub && 'invisible'}`}><Icon name={isExpanded ? "chevronDown" : "chevronRight"} size={10} /></button>
                              <Icon name={isExpanded && hasSub ? "folderOpen" : "folder"} size={12} className={isActive ? "text-blue-400" : "opacity-40"} />
                              <span className="truncate">{d.title}</span>
                          </div>
                          {isExpanded && <SidebarDeckTree parentId={d.id} level={level + 1} />}
                      </div>
                  );
              })}
          </div>
      );
  };

  const menus: { label: string; items: { label: string; shortcut?: string; onClick: () => void; variant?: 'default' | 'danger'; disabled?: boolean; }[] }[] = [
      { 
          label: 'Editar', 
          items: [
              { label: 'Selecionar tudo', shortcut: 'Ctrl+A', onClick: () => {
                  const visibleIds = sortedCards.map(c => c.id);
                  setSelectedIds(new Set(visibleIds));
              }},
              { label: 'Inverter seleção', onClick: () => {
                  const visibleIds = sortedCards.map(c => c.id);
                  const next = new Set(selectedIds);
                  visibleIds.forEach(id => {
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                  });
                  setSelectedIds(next);
              }},
              { label: 'Limpar seleção', onClick: () => setSelectedIds(new Set()) }
          ]
      },
      {
          label: 'Exibir',
          items: [
              { label: showSidebar ? 'Ocultar Painel Lateral' : 'Exibir Painel Lateral', onClick: () => setShowSidebar(!showSidebar) },
              { label: isCompact ? 'Desativar Modo Compacto' : 'Ativar Modo Compacto', onClick: () => setIsCompact(!isCompact) }
          ]
      },
      {
          label: 'Baralhos',
          items: [
              { label: 'Gerenciar Estrutura...', shortcut: 'Ctrl+G', onClick: () => setActionModal('MANAGE_DECKS') },
              { label: 'Mover Notas Selecionadas...', shortcut: 'Ctrl+D', disabled: selectedIds.size === 0, onClick: () => setActionModal('MOVE') }
          ]
      },
      {
          label: 'Notas',
          items: [
              { label: 'Suspender Selecionadas', disabled: selectedIds.size === 0, onClick: () => bulkSuspendCards(Array.from(selectedIds), true) },
              { label: 'Reativar Selecionadas', disabled: selectedIds.size === 0, onClick: () => bulkSuspendCards(Array.from(selectedIds), false) },
              { label: 'Adicionar etiquetas...', shortcut: 'Ctrl+Shift+A', disabled: selectedIds.size === 0, onClick: () => setActionModal('TAGS_ADD') },
              { label: 'Remover etiquetas...', disabled: selectedIds.size === 0, onClick: () => setActionModal('TAGS_REMOVE') },
              { label: 'Excluir permanentemente', shortcut: 'Ctrl+Del', variant: 'danger', disabled: selectedIds.size === 0, onClick: () => { if(confirm(`Excluir ${selectedIds.size} notas permanentemente?`)) bulkDeleteCards(Array.from(selectedIds)); } }
          ]
      }
  ];

  const allVisibleSelected = sortedCards.length > 0 && sortedCards.every(c => selectedIds.has(c.id));

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0a0e27] overflow-hidden relative">
      
      <div className="h-10 bg-[#0f1223] border-b border-white/5 flex items-center px-4 gap-1 shrink-0 z-50">
          <div className="flex items-center gap-1 mr-4">
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">B</div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Navegador</span>
          </div>
          {menus.map(menu => <MenuDropdown key={menu.label} label={menu.label} items={menu.items} />) }
          
          <div className="ml-auto flex items-center gap-4">
              <div className="flex gap-1">
                  <button onClick={() => setShowSidebar(!showSidebar)} title="Filtros" className={`p-1.5 rounded transition-colors ${showSidebar ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-white'}`}><Icon name="menu" size={14}/></button>
                  <button onClick={() => setIsCompact(!isCompact)} title="Modo Compacto" className={`p-1.5 rounded transition-colors ${isCompact ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-white'}`}><Icon name="layout" size={14}/></button>
              </div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{selectedIds.size} selecionados</div>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
            <div className="w-64 border-r border-white/5 bg-[#0f1223]/50 flex flex-col shrink-0 animate-[slideInLeft_0.2s_ease]">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input type="text" placeholder="Filtrar notas..." className="w-full bg-[#14182d] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-[11px] text-white outline-none focus:border-blue-500/40" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                    <div className="space-y-1">
                        <div className="px-3 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Exibir</div>
                        <button onClick={() => setActiveFilter({ type: 'ALL' })} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-md transition-all ${activeFilter.type === 'ALL' ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}><Icon name="layers" size={14} /> Coleção Inteira</button>
                        <button onClick={() => setActiveFilter({ type: 'STATE', value: 'SUSPENDED' })} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-md transition-all ${activeFilter.type === 'STATE' && activeFilter.value === 'SUSPENDED' ? 'bg-red-600/10 text-red-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}><Icon name="stop" size={14} /> Suspensos</button>
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Pastas</div>
                        <SidebarDeckTree />
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Etiquetas</div>
                        {allTags.length === 0 && <div className="px-3 py-1 text-[10px] text-gray-700 italic">Nenhuma etiqueta encontrada.</div>}
                        {allTags.map(tag => {
                            const isActive = activeFilter.type === 'TAG' && activeFilter.value === tag;
                            return (
                                <button key={tag} onClick={() => setActiveFilter({ type: 'TAG', value: tag })} className={`w-full flex items-center gap-2 px-3 py-1 text-[11px] rounded-md transition-all ${isActive ? 'bg-purple-600/10 text-purple-400 font-bold' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
                                    <Icon name="hash" size={10} className="opacity-40" />
                                    <span className="truncate">{tag}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 py-2 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Estágios SRS</div>
                        {(Object.keys(STAGE_CONFIG) as CognitiveStage[]).map(stage => {
                            const config = STAGE_CONFIG[stage];
                            const isActive = activeFilter.type === 'STATE' && activeFilter.value === stage;
                            return (
                                <button key={stage} onClick={() => setActiveFilter({ type: 'STATE', value: stage })} className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] rounded-md transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                                    <div className="flex items-center gap-2"><Icon name={config.icon} size={12} className={isActive ? config.color : 'opacity-40'} /> {config.label}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0e27]">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 z-20 border-b border-white/10">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#0f1223]">
                            <th className="p-4 w-12 text-center">
                                <button onClick={toggleSelectAll} className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${allVisibleSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                                    {allVisibleSelected && <Icon name="checkSquare" size={10} className="text-white" />}
                                </button>
                            </th>
                            <th className="p-4 w-48 cursor-pointer hover:text-white" onClick={() => {setSortKey('deck'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');}}>Baralho</th>
                            <th className="p-4 cursor-pointer hover:text-white" onClick={() => {setSortKey('front'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');}}>Frente / Pergunta</th>
                            <th className="p-4 w-32">Estágio</th>
                            <th className="p-4 w-48">Etiquetas</th>
                            <th className="p-4 w-40 cursor-pointer hover:text-white" onClick={() => {setSortKey('nextReview'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');}}>Próxima Revisão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {sortedCards.map(card => {
                            const isSelected = selectedIds.has(card.id);
                            const stage = STAGE_CONFIG[card.stage];
                            const deck = decks.find(d => d.id === card.deckId);
                            
                            return (
                                <tr 
                                    key={card.id} 
                                    onClick={(e) => handleCardClick(e, card.id)}
                                    onContextMenu={(e) => onRowContextMenu(e, card)}
                                    className={`group transition-all cursor-default ${isSelected ? 'bg-blue-600/20' : 'hover:bg-white/[0.01]'} ${card.isSuspended ? 'opacity-40' : ''} ${isCompact ? 'text-[11px]' : 'text-[12px]'}`}
                                >
                                    <td className={`${isCompact ? 'p-2' : 'p-4'} text-center`}>
                                        <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-white/10 group-hover:border-blue-500/40'}`}>
                                            {isSelected && <Icon name="checkSquare" size={10} className="text-white" />}
                                        </div>
                                    </td>
                                    <td className={isCompact ? 'p-2' : 'p-4'}>
                                        <div className="flex items-center gap-2 text-gray-500 truncate max-w-[180px]">
                                            <Icon name="folder" size={10} className="opacity-40" />
                                            {deck?.title}
                                        </div>
                                    </td>
                                    <td className={isCompact ? 'p-2' : 'p-4'}>
                                        <div className="flex items-center gap-2">
                                            {card.isSuspended && <div className="p-1 bg-red-500/20 text-red-500 rounded text-[9px] font-bold uppercase shrink-0">Suspenso</div>}
                                            <div className="text-gray-200 truncate font-medium max-w-md" dangerouslySetInnerHTML={{ __html: card.front }} />
                                        </div>
                                    </td>
                                    <td className={isCompact ? 'p-2' : 'p-4'}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${stage.color.replace('text', 'bg')}`} />
                                            <span className={`text-[10px] font-bold uppercase ${stage.color}`}>{stage.label.split(' ')[0]}</span>
                                        </div>
                                    </td>
                                    <td className={isCompact ? 'p-2' : 'p-4'}>
                                        <div className="flex flex-wrap gap-1">
                                            {card.tags?.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded-md border border-white/5 truncate max-w-[80px]">#{tag}</span>
                                            ))}
                                            {card.tags && card.tags.length > 3 && <span className="text-[9px] text-gray-600 font-bold">+{card.tags.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td className={`${isCompact ? 'p-2' : 'p-4'} text-gray-500 font-mono text-[11px]`}>
                                        {card.isSuspended ? 'N/A' : (card.nextReview ? new Date(card.nextReview).toLocaleDateString() : 'Novo')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {actionModal === 'MANAGE_DECKS' && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
              <div className="bg-[#0f1223] border border-blue-500/20 rounded-[40px] w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-[popIn_0.3s_ease]">
                  <header className="p-8 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-transparent shrink-0">
                      <div className="flex justify-between items-start">
                          <div><h3 className="text-2xl font-bold text-white mb-1">Gerenciar Estrutura</h3><p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Organização avançada e refatoração de baralhos.</p></div>
                          <button onClick={() => setActionModal('NONE')} className="w-12 h-12 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full flex items-center justify-center transition-all"><Icon name="x" size={24} /></button>
                      </div>
                      <div className="flex gap-3 mt-8">
                          <button onClick={() => setDeckTreeExpanded(new Set(decks.map(d => d.id)))} className="px-4 py-2 bg-blue-600/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all uppercase">Expandir Tudo</button>
                          <button onClick={() => setDeckTreeExpanded(new Set())} className="px-4 py-2 bg-white/5 text-gray-400 text-[10px] font-bold rounded-lg border border-white/5 hover:bg-white/10 transition-all uppercase">Recolher Tudo</button>
                          <button 
                            disabled={isPruning}
                            onClick={handlePruneEmpty} 
                            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all uppercase ml-auto shadow-lg disabled:opacity-50 flex items-center gap-2"
                          >
                            {isPruning ? <Icon name="rotateCw" size={14} className="animate-spin" /> : null}
                            Poda Inteligente (Limpar Vazios)
                          </button>
                      </div>
                  </header>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-2">
                    {decks.filter(d => !d.parentId).sort((a,b) => a.title.localeCompare(b.title)).map(rootDeck => (
                        <DeckManagerRow 
                            key={rootDeck.id} 
                            deck={rootDeck} 
                            level={0}
                            expanded={deckTreeExpanded}
                            onToggleExpand={handleToggleExpand}
                            editingId={editingDeckId}
                            setEditingId={setEditingDeckId}
                            updateDeck={updateDeck}
                            deleteDeck={deleteDeck}
                            onReparent={handleReparent}
                            allCards={cards}
                            allDecks={decks}
                        />
                    ))}
                  </div>
              </div>
          </div>
      )}

      {(actionModal === 'MOVE' || actionModal === 'TAGS_ADD' || actionModal === 'TAGS_REMOVE') && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#14182d] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-[popIn_0.2s_ease]">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{actionModal === 'MOVE' ? 'Mover para baralho' : 'Ações de Etiquetas'}</h3>
                      <button onClick={() => setActionModal('NONE')} className="text-gray-500 hover:text-white"><Icon name="x" size={20} /></button>
                  </div>
                  {actionModal === 'MOVE' ? (
                      <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                          {decks.map(d => (<button key={d.id} onClick={() => handleMoveToDeck(d.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-400 text-xs font-bold text-gray-400 transition-all border border-white/5 flex items-center gap-3"><Icon name="folder" size={14} className="opacity-40" /> {d.title}</button>))}
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">Modificando etiquetas em {selectedIds.size} registros.</p>
                          <input autoFocus className="w-full bg-[#0a0e27] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500/40" placeholder="ex: anatomia, difícil, prova" value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApplyTags()} />
                          <button onClick={handleApplyTags} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all rounded-2xl uppercase tracking-widest">Confirmar Alteração</button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default MassEditView;
