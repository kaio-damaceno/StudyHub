
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Deck, Flashcard, CardPresentation, DeckStats, FlashcardType, MemorySettings } from '../types';
import { createNewFlashcard } from '../core/flashcards/types';
import { FlashcardAPI } from '../core/flashcards/api';
import { AnkiParser } from '../core/flashcards/AnkiParser';

interface FlashcardContextType {
  decks: Deck[];
  cards: Flashcard[];
  settings: MemorySettings;
  updateSettings: (newSettings: any) => void;
  resetSettings: () => void;
  addDeck: (title: string, description?: string, parentId?: string) => Deck;
  deleteDeck: (id: string) => void;
  bulkDeleteDecks: (ids: string[]) => void;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  addCard: (deckId: string, front: string, back: string, type: FlashcardType, extra?: any) => string; // Retorna string (ID)
  deleteCard: (id: string) => void;
  updateCard: (id: string, updates: Partial<Flashcard>) => void;
  importFlashcards: () => Promise<{success: boolean, message: string, canceled?: boolean}>;
  exportFlashcards: (deckId?: string) => Promise<{success: boolean, canceled?: boolean, message?: string}>;
  
  bulkDeleteCards: (ids: string[]) => void;
  bulkMoveCards: (ids: string[], targetDeckId: string) => void;
  bulkSuspendCards: (ids: string[], suspend: boolean) => void;
  bulkResetCards: (ids: string[]) => void;
  bulkUpdateFlag: (ids: string[], flag: Flashcard['flag']) => void;
  bulkUpdateTags: (ids: string[], tags: string[], mode: 'ADD' | 'REMOVE' | 'SET') => void;
  bulkUpdateType: (ids: string[], type: FlashcardType) => void;

  processReview: (cardId: string, performance: 'again' | 'hard' | 'good' | 'easy') => string; 
  getDueCards: (deckId: string) => CardPresentation[]; 
  getDeckStats: (deckId: string) => DeckStats;
  atomicPruneDecks: () => Promise<number>;
}

const DEFAULT_SETTINGS: MemorySettings = {
  algorithm: {
    isAdaptiveDefault: true,
    retentionTarget: 0.90,
    newCardsLimit: 20,
    reviewsLimit: 100,
    lapseReset: false
  },
  ui: {
    fontFamily: 'sans',
    fontSize: 18,
    theme: 'midnight',
    alignment: 'center',
    leftyMode: false
  },
  session: {
    showTimer: true,
    autoPlayAudio: true,
    studyOrder: 'MIXED',
    showIntervals: true
  },
  gamification: {
    dailyGoal: 20,
    showStreak: true,
    notifications: true
  }
};

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (!context) throw new Error('useFlashcards must be used within a FlashcardProvider');
  return context;
};

export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<MemorySettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const cardsRef = useRef<Flashcard[]>([]);
  const decksRef = useRef<Deck[]>([]);
  const apiRef = useRef(new FlashcardAPI());

  useEffect(() => {
    cardsRef.current = cards;
    decksRef.current = decks;
  }, [cards, decks]);

  useEffect(() => {
    async function load() {
        if (window.api && window.api.storage) {
            const loadedDecks = await window.api.storage.get<Deck[]>('flashcards-decks') || [];
            const loadedCards = await window.api.storage.get<Flashcard[]>('flashcards-cards') || [];
            const loadedSettings = await window.api.storage.get<MemorySettings>('flashcards-settings');
            setDecks(loadedDecks);
            setCards(loadedCards);
            if (loadedSettings) setSettings(loadedSettings);
        }
        setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
      if (isLoaded && window.api && window.api.storage) {
          const handler = setTimeout(() => {
              window.api.storage.set('flashcards-decks', decks);
              window.api.storage.set('flashcards-cards', cards);
              window.api.storage.set('flashcards-settings', settings);
          }, 1000);
          return () => clearTimeout(handler);
      }
  }, [decks, cards, settings, isLoaded]);

  const updateSettings = useCallback((newS: any) => {
    setSettings(prev => {
        const next = { ...prev } as any;
        for (const key in newS) {
            if (typeof newS[key] === 'object' && !Array.isArray(newS[key]) && next[key]) {
                next[key] = { ...next[key], ...newS[key] };
            } else {
                next[key] = newS[key];
            }
        }
        return next as MemorySettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const getDeckFamilyIds = useCallback((parentDeckId: string, allDecks: Deck[]): string[] => {
      const ids = [parentDeckId];
      const children = allDecks.filter(d => d.parentId === parentDeckId);
      for (const child of children) {
          ids.push(...getDeckFamilyIds(child.id, allDecks));
      }
      return ids;
  }, []);

  const getFullDeckPath = useCallback((deckId: string, allDecks: Deck[]): string => {
    const deck = allDecks.find(d => d.id === deckId);
    if (!deck) return 'Importados';
    if (!deck.parentId) return deck.title;
    return `${getFullDeckPath(deck.parentId, allDecks)}::${deck.title}`;
  }, []);

  const addDeck = useCallback((title: string, description: string = '', parentId?: string) => {
      const newDeck: Deck = {
          id: 'deck_' + Date.now() + Math.random().toString(36).substr(2, 4),
          title, description, parentId, createdAt: Date.now(),
      };
      setDecks(prev => [...prev, newDeck]);
      return newDeck;
  }, []);

  const updateDeck = useCallback((id: string, updates: Partial<Deck>) => {
      setDecks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDeck = useCallback((id: string) => {
      setDecks(prevDecks => {
          const familyIds = getDeckFamilyIds(id, prevDecks);
          setCards(prevCards => prevCards.filter(c => !familyIds.includes(c.deckId)));
          return prevDecks.filter(d => !familyIds.includes(d.id));
      });
  }, [getDeckFamilyIds]);

  const bulkDeleteDecks = useCallback((ids: string[]) => {
      setDecks(prevDecks => {
          const allFamilyIds = new Set<string>();
          ids.forEach(id => {
              getDeckFamilyIds(id, prevDecks).forEach(fid => allFamilyIds.add(fid));
          });
          const familyList = Array.from(allFamilyIds);
          setCards(prevCards => prevCards.filter(c => !familyList.includes(c.deckId)));
          return prevDecks.filter(d => !allFamilyIds.has(d.id));
      });
  }, [getDeckFamilyIds]);

  const atomicPruneDecks = useCallback(async () => {
      return new Promise<number>((resolve) => {
          // Usamos requestAnimationFrame para garantir que a UI processe eventos pendentes antes de travar a thread por alguns ms
          requestAnimationFrame(() => {
              let currentDecks = [...decksRef.current];
              const currentCards = cardsRef.current;
              let deletedCount = 0;
              let hasChange = true;

              // Algoritmo de Poda Atômica: Limpa apenas folhas vazias sucessivamente
              while (hasChange) {
                  hasChange = false;
                  const emptyLeafDecks = currentDecks.filter(d => {
                      const hasCards = currentCards.some(c => c.deckId === d.id);
                      const hasChildren = currentDecks.some(child => child.parentId === d.id);
                      return !hasCards && !hasChildren;
                  });

                  if (emptyLeafDecks.length > 0) {
                      const idsToRemove = emptyLeafDecks.map(d => d.id);
                      deletedCount += idsToRemove.length;
                      currentDecks = currentDecks.filter(d => !idsToRemove.includes(d.id));
                      hasChange = true;
                  }
              }

              if (deletedCount > 0) {
                  setDecks(currentDecks);
              }
              resolve(deletedCount);
          });
      });
  }, []);

  const addCard = useCallback((deckId: string, front: string, back: string, type: FlashcardType, extra?: any): string => {
      const newGeneratedCards: Flashcard[] = [];
      
      // Criamos o card principal primeiro para ter um ID para retornar
      const mainCard = createNewFlashcard(deckId, front, back, type === 'CLOZE' ? 'BASIC' : type, undefined);
      
      if (type === 'CLOZE') {
          const clozeRegex = /{{c(\d+)::(.*?)}}/g;
          const matches = [...(front + " " + back).matchAll(clozeRegex)];
          const indices = new Set(matches.map(m => parseInt(m[1])));
          
          if (indices.size === 0) {
              // Fallback se não houver clozes reais
              newGeneratedCards.push(mainCard);
          } else {
              // Gera cards cloze reais (o primeiro será retornado como referência)
              // Usamos o ID do mainCard para o primeiro cloze para manter consistência de retorno se possível, 
              // mas createNewFlashcard gera IDs. Vamos pegar o ID do primeiro gerado.
              let firstId = "";
              indices.forEach((idx, i) => {
                  const c = createNewFlashcard(deckId, front, back, 'CLOZE', idx);
                  newGeneratedCards.push(c);
                  if (i === 0) firstId = c.id;
              });
              setCards(prev => [...prev, ...newGeneratedCards]);
              return firstId;
          }
      } else {
          newGeneratedCards.push(mainCard);
          if (type === 'REVERSE') {
              newGeneratedCards.push(createNewFlashcard(deckId, back, front, 'BASIC'));
          }
      }
      
      if (extra) {
          newGeneratedCards.forEach(c => {
              if (extra.imageUrl) c.occlusionData = { imageUrl: extra.imageUrl, rects: extra.rects, targetRectId: extra.rects[0]?.id };
              if (extra.audioData) c.audioData = extra.audioData;
          });
      }

      setCards(prev => [...prev, ...newGeneratedCards]);
      return newGeneratedCards[0]?.id || "";
  }, []);

  const deleteCard = useCallback((id: string) => {
      setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<Flashcard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const bulkDeleteCards = useCallback((ids: string[]) => {
    setCards(prev => prev.filter(c => !ids.includes(c.id)));
  }, []);

  const bulkMoveCards = useCallback((ids: string[], targetDeckId: string) => {
    setCards(prev => prev.map(c => ids.includes(c.id) ? { ...c, deckId: targetDeckId } : c));
  }, []);

  const bulkSuspendCards = useCallback((ids: string[], suspend: boolean) => {
    setCards(prev => prev.map(c => ids.includes(c.id) ? { ...c, isSuspended: suspend } : c));
  }, []);

  const bulkResetCards = useCallback((ids: string[]) => {
    setCards(prev => prev.map(c => ids.includes(c.id) ? createNewFlashcard(c.deckId, c.front, c.back, c.type, c.clozeIndex) : c));
  }, []);

  const bulkUpdateFlag = useCallback((ids: string[], flag: Flashcard['flag']) => {
    setCards(prev => prev.map(c => ids.includes(c.id) ? { ...c, flag } : c));
  }, []);

  const bulkUpdateTags = useCallback((ids: string[], tags: string[], mode: 'ADD' | 'REMOVE' | 'SET') => {
    setCards(prev => prev.map(c => {
      if (!ids.includes(c.id)) return c;
      let newTags = [...c.tags];
      if (mode === 'ADD') {
        tags.forEach(t => { if(!newTags.includes(t)) newTags.push(t); });
      } else if (mode === 'REMOVE') {
        newTags = newTags.filter(t => !tags.includes(t));
      } else {
        newTags = tags;
      }
      return { ...c, tags: newTags };
    }));
  }, []);

  const bulkUpdateType = useCallback((ids: string[], type: FlashcardType) => {
    setCards(prev => prev.map(c => ids.includes(c.id) ? { ...c, type } : c));
  }, []);

  const importFlashcards = async () => {
      if (!window.api?.importFlashcardsDialog) return { success: false, message: "API Nativa não disponível." };
      const result = await window.api.importFlashcardsDialog();
      if (!result) return { success: false, message: "Operação cancelada.", canceled: true };
      
      try {
          const { rows } = AnkiParser.parseExport(result.content);
          if (rows.length === 0) return { success: false, message: "Nenhum dado válido no arquivo TXT." };

          let currentDecks = [...decks];
          let newCards: Flashcard[] = [];

          for (const row of rows) {
            const segments = row.deckPath.split('::').map(s => s.trim()).filter(Boolean);
            let lastParentId: string | undefined = undefined;

            if (segments.length === 0) segments.push('Importados');

            for (const segment of segments) {
               const found = currentDecks.find(d => d.title === segment && d.parentId === lastParentId);
               if (found) {
                   lastParentId = found.id;
               } else {
                   const newId = 'deck_' + Date.now() + Math.random().toString(36).substr(2, 4);
                   const newD: Deck = { id: newId, title: segment, parentId: lastParentId, createdAt: Date.now() };
                   currentDecks.push(newD);
                   lastParentId = newId;
               }
            }

            const finalDeckId = lastParentId || 'deck_default';
            const type = AnkiParser.detectType(row.front, row.back);
            
            let baseCard;
            if (type === 'CLOZE') {
                const clozeRegex = /{{c(\d+)::(.*?)}}/g;
                const indices = new Set([...(row.front + " " + row.back).matchAll(clozeRegex)].map(m => parseInt(m[1])));
                if (indices.size === 0) {
                    baseCard = createNewFlashcard(finalDeckId, row.front, row.back, 'BASIC');
                    baseCard.tags = row.tags;
                    newCards.push(AnkiParser.mapProgress(baseCard, row.interval));
                } else {
                    indices.forEach(idx => {
                        let c = createNewFlashcard(finalDeckId, row.front, row.back, 'CLOZE', idx);
                        c.tags = row.tags;
                        newCards.push(AnkiParser.mapProgress(c, row.interval));
                    });
                }
            } else {
                baseCard = createNewFlashcard(finalDeckId, row.front, row.back, type);
                baseCard.tags = row.tags;
                newCards.push(AnkiParser.mapProgress(baseCard, row.interval));
            }
          }

          setDecks(currentDecks);
          setCards(prev => [...prev, ...newCards]);
          return { success: true, message: `${newCards.length} cards importados com sucesso!` };
      } catch (e) {
          console.error("Erro na importação:", e);
          return { success: false, message: "Falha ao processar arquivo TXT. Verifique o delimitador (;)." };
      }
  };

  const exportFlashcards = async (deckId?: string) => {
    if (!window.api?.exportFlashcards) return { success: false, message: "API indisponível." };
    
    const allCards = cardsRef.current;
    const allDecks = decksRef.current;

    const familyIds = deckId ? getDeckFamilyIds(deckId, allDecks) : null;
    const targetCards = familyIds 
      ? allCards.filter(c => familyIds.includes(c.deckId)) 
      : allCards;
    
    const headers = [
        '#separator:semicolon',
        '#html:true',
        '#deck column:1',
        '#tags column:4'
    ].join('\n');

    const noteMap = new Map<string, Flashcard>();
    targetCards.forEach(c => {
        const key = `${c.deckId}|${c.front}|${c.back}`;
        if (!noteMap.has(key)) noteMap.set(key, c);
    });

    const rows = Array.from(noteMap.values()).map(c => {
        const fullPath = getFullDeckPath(c.deckId, allDecks);
        const tags = (c.tags || []).join(' ');
        const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return `${escape(fullPath)};${escape(c.front)};${escape(c.back)};${escape(tags)}`;
    });

    const content = headers + '\n' + rows.join('\n');

    const res = await window.api.exportFlashcards({ 
        content, 
        format: 'txt', 
        defaultName: `studyhub_collection_${Date.now()}.txt` 
    });
    
    return { success: res.success, canceled: res.reason === 'canceled' };
  };

  const processReview = useCallback((cardId: string, performance: 'again' | 'hard' | 'good' | 'easy') => {
      const card = cards.find(c => c.id === cardId);
      if (!card) return "Erro";
      const gradeMap = { again: 1, hard: 2, good: 3, easy: 4 };
      const { updatedCard, feedback } = apiRef.current.registerAnswer(card, gradeMap[performance] as any, 10);
      setCards(prev => prev.map(c => c.id === cardId ? updatedCard as Flashcard : c));
      return feedback;
  }, [cards]);

  const getDueCards = useCallback((deckId: string) => {
      const deckIds = getDeckFamilyIds(deckId, decks);
      return apiRef.current.getRelevantCards(cards, { deckIds });
  }, [cards, decks, getDeckFamilyIds]);
  
  const getDeckStats = useCallback((deckId: string) => {
      const familyIds = getDeckFamilyIds(deckId, decks);
      const health = apiRef.current.getDeckHealth(cards, deckId, familyIds);
      const sessionCards = apiRef.current.getRelevantCards(cards, { deckIds: familyIds });
      const totalInTree = cards.filter(c => familyIds.includes(c.deckId)).length;
      return { totalCards: totalInTree, newCards: health.distribution.new, criticalCards: sessionCards.length, stableCards: health.distribution.review };
  }, [cards, decks, getDeckFamilyIds]);

  return (
    <FlashcardContext.Provider value={{
      decks, cards, settings, updateSettings, resetSettings, addDeck, deleteDeck, bulkDeleteDecks, updateDeck, addCard, deleteCard, updateCard, importFlashcards, exportFlashcards,
      bulkDeleteCards, bulkMoveCards, bulkSuspendCards, bulkResetCards, bulkUpdateFlag, bulkUpdateTags, bulkUpdateType,
      processReview, getDueCards, getDeckStats, atomicPruneDecks
    }}>
      {children}
    </FlashcardContext.Provider>
  );
};
