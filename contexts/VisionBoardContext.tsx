
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VisionBlock, VisionBlockType } from '../types';

interface VisionBoardContextType {
  blocks: VisionBlock[];
  isEditing: boolean;
  isEnabled: boolean;
  setIsEditing: (v: boolean) => void;
  setIsEnabled: (v: boolean) => void;
  addBlock: (type: VisionBlockType, initialData?: Partial<VisionBlock>) => void;
  updateBlock: (id: string, updates: Partial<VisionBlock>) => void;
  removeBlock: (id: string) => void;
  reorderLayer: (id: string, action: 'front' | 'back' | 'up' | 'down' | number) => void;
  clearBoard: () => void;
  importBoard: (data: any) => void;
}

const VisionBoardContext = createContext<VisionBoardContextType | undefined>(undefined);

export const useVisionBoard = () => {
  const context = useContext(VisionBoardContext);
  if (!context) throw new Error('useVisionBoard must be used within VisionBoardProvider');
  return context;
};

export const VisionBoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blocks, setBlocks] = useState<VisionBlock[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (window.api) {
        const saved = await window.api.storage.get<VisionBlock[]>('vision-board-blocks');
        const savedEnabled = await window.api.storage.get<boolean>('vision-board-enabled');
        if (saved) setBlocks(saved);
        if (savedEnabled !== null) setIsEnabled(savedEnabled);
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (isLoaded && window.api) {
      window.api.storage.set('vision-board-blocks', blocks);
      window.api.storage.set('vision-board-enabled', isEnabled);
    }
  }, [blocks, isEnabled, isLoaded]);

  const addBlock = useCallback((type: VisionBlockType, initialData: Partial<VisionBlock> = {}) => {
    setBlocks(prev => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map(b => b.z)) : 0;
      // Rotação aleatória entre -5 e 5 graus
      const randomRot = (Math.random() * 10) - 5;
      
      const newBlock: VisionBlock = {
        id: `vb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        x: 35,
        y: 25,
        z: maxZ + 1,
        width: type === 'text' ? 320 : 400,
        height: type === 'text' ? 120 : 300,
        rotation: randomRot,
        content: {
          text: type === 'text' ? 'Seu mantra aqui...' : '',
          style: { 
            fontFamily: 'cursive', 
            fontSize: 28, 
            color: '#ffffff',
            bold: false,
            italic: false
          },
          ...initialData.content
        },
        ...initialData
      };
      return [...prev, newBlock];
    });
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<VisionBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== id);
      return filtered.sort((a, b) => a.z - b.z).map((b, i) => ({ ...b, z: i + 1 }));
    });
  }, []);

  const reorderLayer = useCallback((id: string, action: 'front' | 'back' | 'up' | 'down' | number) => {
    setBlocks(prev => {
      const sorted = [...prev].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex(b => b.id === id);
      if (idx === -1) return prev;

      const target = sorted[idx];

      if (typeof action === 'number') {
        sorted.splice(idx, 1);
        sorted.splice(action, 0, target);
      } else {
        switch (action) {
          case 'front':
            sorted.splice(idx, 1);
            sorted.push(target);
            break;
          case 'back':
            sorted.splice(idx, 1);
            sorted.unshift(target);
            break;
          case 'up':
            if (idx < sorted.length - 1) {
              [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
            }
            break;
          case 'down':
            if (idx > 0) {
              [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
            }
            break;
        }
      }

      return sorted.map((b, i) => ({ ...b, z: i + 1 }));
    });
  }, []);

  const clearBoard = useCallback(() => {
    if (confirm('Limpar o Vision Board?')) setBlocks([]);
  }, []);

  const importBoard = useCallback((data: any) => {
    if (Array.isArray(data)) {
        // Validação básica
        const isValid = data.every(b => b.id && b.type && typeof b.x === 'number');
        if (isValid) {
            if (blocks.length > 0 && !confirm('Isso substituirá o mural atual. Deseja continuar?')) {
                return;
            }
            setBlocks(data);
        } else {
            alert('Arquivo inválido ou corrompido.');
        }
    } else {
        alert('Formato de arquivo inválido.');
    }
  }, [blocks]);

  return (
    <VisionBoardContext.Provider value={{
      blocks, isEditing, isEnabled, setIsEditing, setIsEnabled, addBlock, updateBlock, removeBlock, reorderLayer, clearBoard, importBoard
    }}>
      {children}
    </VisionBoardContext.Provider>
  );
};
