
import React, { createContext, useContext, useState, useCallback } from 'react';

interface OverlayContextType {
  isEditing: boolean;
  toggleEditing: () => void;
  contextKey: string;
  setContextKey: (key: string) => void;
  hasDrawing: boolean; // Para indicar visualmente se há algo salvo nesta página
  setHasDrawing: (v: boolean) => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) throw new Error('useOverlay must be used within OverlayProvider');
  return context;
};

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [contextKey, setContextKeyState] = useState<string>('');
  const [hasDrawing, setHasDrawing] = useState(false);

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  const setContextKey = useCallback((key: string) => {
    // Se a chave mudar, saímos do modo de edição automaticamente para evitar desenhar no lugar errado
    if (key !== contextKey) {
        setContextKeyState(key);
        setIsEditing(false); 
        // Na Fase 3, aqui carregaremos se 'hasDrawing' é true do storage
    }
  }, [contextKey]);

  return (
    <OverlayContext.Provider value={{
      isEditing,
      toggleEditing,
      contextKey,
      setContextKey,
      hasDrawing,
      setHasDrawing
    }}>
      {children}
    </OverlayContext.Provider>
  );
};
