
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useContextMenuContext } from '../../contexts/ContextMenuContext';
import { Icon } from './Icon';

const UiContextMenu: React.FC = () => {
  const { isOpen, position, items, closeMenu } = useContextMenuContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    
    // Também fecha se a janela perder o foco ou rolar
    const handleScroll = () => closeMenu();
    const handleResize = () => closeMenu();

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); 
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, closeMenu]);

  // Ajuste de Posição (Boundary Detection)
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const { innerWidth, innerHeight } = window;
      const rect = menuRef.current.getBoundingClientRect();
      
      let x = position.x;
      let y = position.y;

      // Se sair pela direita
      if (x + rect.width > innerWidth) {
        x = innerWidth - rect.width - 10;
      }

      // Se sair por baixo
      if (y + rect.height > innerHeight) {
        y = y - rect.height;
      }

      setAdjustedPos({ x, y });
    }
  }, [isOpen, position, items]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[99999] min-w-[220px] bg-[#14182d]/95 backdrop-blur-xl border border-blue-400/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-1.5 flex flex-col animate-[scaleIn_0.1s_ease-out] origin-top-left overflow-hidden"
      style={{ top: adjustedPos.y, left: adjustedPos.x }}
      onContextMenu={(e) => e.preventDefault()} 
    >
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="h-[1px] bg-white/10 my-1 mx-2" />;
        }

        // TypeScript guard
        const menuItem = item;

        return (
          <button
            key={index}
            disabled={menuItem.disabled}
            onClick={() => {
              if (menuItem.onClick && !menuItem.disabled) {
                menuItem.onClick();
                closeMenu();
              }
            }}
            className={`
              group flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors w-full text-left
              ${menuItem.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600/20 cursor-pointer'}
              ${menuItem.variant === 'danger' ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'}
            `}
          >
            <div className={`w-4 h-4 flex items-center justify-center shrink-0 ${menuItem.variant === 'danger' ? 'text-red-400' : 'text-gray-400 group-hover:text-blue-400'}`}>
              {menuItem.icon && <Icon name={menuItem.icon} size={14} />}
            </div>
            
            <span className="flex-1 truncate">{menuItem.label}</span>
            
            {menuItem.shortcut && (
              <span className="text-[9px] text-gray-500 font-mono group-hover:text-gray-400 ml-4">
                {menuItem.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
};

export default UiContextMenu;
