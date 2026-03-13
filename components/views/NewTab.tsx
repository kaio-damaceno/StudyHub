
import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { BookmarkItem } from '../../types';
import VisionBoardCanvas from '../VisionBoard/VisionBoardCanvas';
import { useVisionBoard } from '../../contexts/VisionBoardContext';
import { useContextMenu } from '../../hooks/useContextMenu';

const getLogoPath = () => 'logo.svg';

interface NewTabProps {
  onSearch: (query: string) => void;
  onOpenTaskView: () => void; 
  bookmarks?: BookmarkItem[]; 
  onNavigate?: (url: string) => void;
  onAddBookmark?: (url: string, title: string) => void;
  onRemoveBookmark?: (id: string) => void; 
  onUpdateBookmark?: (id: string, updates: Partial<BookmarkItem>) => void; 
}

const NewTab: React.FC<NewTabProps> = ({ 
    onSearch, onOpenTaskView, bookmarks = [], onNavigate, 
    onRemoveBookmark, onUpdateBookmark 
}) => {
  const { isEditing, isEnabled, setIsEditing } = useVisionBoard();
  const { handleContextMenu } = useContextMenu();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const logoPath = useMemo(() => getLogoPath(), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  const onBookmarkContextMenu = (e: React.MouseEvent, b: BookmarkItem) => {
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'externalLink', onClick: () => onNavigate?.(b.url) },
          { label: 'Editar', icon: 'edit2', onClick: () => {
              const newTitle = prompt('Nome do favorito:', b.title);
              if (newTitle && onUpdateBookmark) onUpdateBookmark(b.id, { title: newTitle });
          }},
          { type: 'separator' },
          { label: 'Remover', icon: 'trash', variant: 'danger', onClick: () => onRemoveBookmark?.(b.id) }
      ]);
  };

  // Configuração dos 8 Atalhos Principais
  const shortcuts = [
    { 
        title: 'Vision Board', 
        desc: 'Mural dos Sonhos', 
        icon: 'palette', 
        color: 'text-fuchsia-400', 
        bg: 'bg-fuchsia-400/10', 
        borderHover: 'group-hover:border-fuchsia-500/50',
        action: () => setIsEditing(true)
    },
    { 
        title: 'Tarefas', 
        desc: 'To-Do & Foco', 
        icon: 'checkSquare', 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-400/10', 
        borderHover: 'group-hover:border-emerald-500/50',
        action: onOpenTaskView 
    },
    { 
        title: 'Agenda', 
        desc: 'Cronograma', 
        icon: 'calendar', 
        color: 'text-orange-400', 
        bg: 'bg-orange-400/10', 
        borderHover: 'group-hover:border-orange-500/50',
        route: 'studyhub://schedule' 
    },
    { 
        title: 'Caderno', 
        desc: 'Anotações', 
        icon: 'notebook', 
        color: 'text-purple-400', 
        bg: 'bg-purple-400/10', 
        borderHover: 'group-hover:border-purple-500/50',
        route: 'studyhub://notes' 
    },
    { 
        title: 'Flashcards', 
        desc: 'Revisão Espaçada', 
        icon: 'cards', 
        color: 'text-pink-400', 
        bg: 'bg-pink-400/10', 
        borderHover: 'group-hover:border-pink-500/50',
        route: 'studyhub://flashcards' 
    },
    { 
        title: 'Mapas', 
        desc: 'Mapas Mentais', 
        icon: 'network', 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-400/10', 
        borderHover: 'group-hover:border-cyan-500/50',
        route: 'studyhub://mindmap' 
    },
    { 
        title: 'Leitor', 
        desc: 'Docs & PDF', 
        icon: 'fileText', 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-400/10', 
        borderHover: 'group-hover:border-yellow-500/50',
        route: 'studyhub://documents' 
    },
    { 
        title: 'Biblioteca', 
        desc: 'Seus Arquivos', 
        icon: 'library', 
        color: 'text-indigo-400', 
        bg: 'bg-indigo-400/10', 
        borderHover: 'group-hover:border-indigo-500/50',
        route: 'studyhub://library' 
    },
  ];

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-transparent">
      
      {/* CAMADA 0: O VISION BOARD (BACKGROUND PURO) */}
      <VisionBoardCanvas />

      {/* CAMADA 1: OVERLAY DE FOCO / BLUR */}
      {isEnabled && !isEditing && (
        <div className={`absolute inset-0 transition-all duration-700 pointer-events-none z-[1] ${isFocused ? 'bg-black/70 backdrop-blur-xl' : 'bg-black/40 backdrop-blur-sm'}`} />
      )}

      {/* CAMADA 2: INTERFACE DO HUB (FOREGROUND) */}
      <div className={`
          absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar transition-all duration-500 z-10
          ${isEditing ? 'opacity-0 scale-95 pointer-events-none invisible' : 'opacity-100 scale-100 visible'}
      `}>
        
        <div className="w-full max-w-5xl flex flex-col items-center min-h-min py-8">
          
          {/* Logo & Search Section */}
          <div className="flex flex-col items-center mb-10 w-full max-w-2xl">
            <div className="flex items-center gap-3 mb-6 opacity-90 hover:opacity-100 transition-opacity">
                <img src={logoPath} alt="Logo" className="h-12 w-auto object-contain" />
                <h1 className="text-2xl font-bold text-white tracking-tight">Study Hub</h1>
            </div>

            <div className="w-full relative group">
                <div className={`absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
                <form onSubmit={handleSearch} className="relative w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                        <Icon name="search" size={20} />
                    </div>
                    <input 
                        type="text"
                        value={query}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquisar ou digitar URL..."
                        className="w-full h-14 bg-[#1e233c]/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-6 text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 shadow-2xl transition-all"
                    />
                </form>
            </div>

            {/* Quick Bookmarks */}
            {bookmarks.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-full">
                {bookmarks.slice(0, 5).map((b) => (
                    <button
                        key={b.id}
                        onClick={() => onNavigate?.(b.url)}
                        onContextMenu={(e) => onBookmarkContextMenu(e, b)}
                        className="flex items-center gap-2 bg-[#1e233c]/60 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-1.5 transition-all group"
                    >
                        <img src={`https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=32`} alt="" className="w-3.5 h-3.5 rounded-sm opacity-70 group-hover:opacity-100" />
                        <span className="text-[11px] font-medium text-gray-400 group-hover:text-white truncate max-w-[100px]">{b.title}</span>
                    </button>
                ))}
                </div>
            )}
          </div>

          {/* GRID DE ATALHOS (8 Componentes) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {shortcuts.map((item) => (
              <button 
                key={item.title}
                onClick={() => item.action ? item.action() : onNavigate?.(item.route || '')} 
                className={`
                    group relative 
                    bg-[#1e233c]/40 
                    backdrop-blur-md 
                    border border-white/5 
                    ${item.borderHover}
                    rounded-2xl 
                    p-5 
                    flex flex-col items-center justify-center 
                    gap-3 
                    cursor-pointer 
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:bg-[#1e233c]/80
                    hover:shadow-2xl
                `}
              >
                 <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center 
                    ${item.bg} ${item.color} 
                    shadow-lg group-hover:scale-110 transition-transform duration-300
                 `}>
                    <Icon name={item.icon} size={24} />
                 </div>
                 
                 <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                        {item.title}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                        {item.desc}
                    </span>
                 </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewTab;
