
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ContextMenuItem } from '../types';

interface ContextMenuContextType {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  openMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const useContextMenuContext = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenuContext must be used within a ContextMenuProvider');
  }
  return context;
};

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [items, setItems] = useState<ContextMenuItem[]>([]);

  const openMenu = useCallback((e: React.MouseEvent, newItems: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Armazena a posição do clique; o componente UI ajustará para não sair da tela
    setPosition({ x: e.clientX, y: e.clientY });
    setItems(newItems);
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ContextMenuContext.Provider value={{
      isOpen,
      position,
      items,
      openMenu,
      closeMenu
    }}>
      {children}
    </ContextMenuContext.Provider>
  );
};
