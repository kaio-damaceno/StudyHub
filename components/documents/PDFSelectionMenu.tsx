
import React, { useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';

interface PDFSelectionMenuProps {
  position: { top: number; left: number };
  onClose: () => void;
  onCopy: () => void;
  onAddToNote: () => void;
  onAddFlashcard?: () => void;
}

const PDFSelectionMenu: React.FC<PDFSelectionMenuProps> = ({ position, onClose, onCopy, onAddToNote, onAddFlashcard }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-[1000] flex items-center bg-[#1e233c] border border-blue-400/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1.5 gap-1 animate-[fadeInUp_0.2s_ease]"
      style={{ top: position.top - 50, left: position.left }}
    >
      <button 
        onClick={onCopy}
        className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
        title="Copiar Texto"
      >
        <Icon name="copy" size={16} />
      </button>
      
      <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
      
      <button 
        onClick={onAddToNote}
        className="flex items-center gap-2 px-3 py-2 hover:bg-blue-600/20 hover:text-blue-300 rounded-lg text-gray-300 transition-colors text-xs font-bold"
        title="Adicionar à Nota"
      >
        <Icon name="filePlus" size={16} />
        <span className="hidden md:inline">Enviar p/ Nota</span>
      </button>

      <button 
        onClick={onAddFlashcard}
        className="flex items-center gap-2 px-3 py-2 hover:bg-green-600/20 hover:text-green-300 rounded-lg text-gray-300 transition-colors text-xs font-bold"
        title="Criar Flashcard"
      >
        <Icon name="rotateCw" size={16} />
        <span className="hidden md:inline">Flashcard</span>
      </button>
      
      {/* Seta decorativa apontando para baixo */}
      <div className="absolute -bottom-2 left-4 w-4 h-4 bg-[#1e233c] border-b border-r border-blue-400/30 transform rotate-45"></div>
    </div>
  );
};

export default PDFSelectionMenu;
