
import React, { useState } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import { useContextMenu } from '../../hooks/useContextMenu';
import { NoteBlock } from '../../types';

const NotesListView: React.FC = () => {
  const { blocks, deleteBlock, focusBlock, toggleFavorite, viewMode, addBlock, duplicateBlock } = useNotes();
  const { handleContextMenu } = useContextMenu();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'title' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isFavoritesMode = viewMode === 'FAVORITES';

  const filteredBlocks = blocks.filter(b => 
    !b.isTrash &&
    (!isFavoritesMode || b.isFavorite) &&
    (b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.content.text && b.content.text.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
      if (sortKey === 'title') {
          return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else {
          return sortOrder === 'asc' ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt;
      }
  });

  const toggleSort = (key: 'title' | 'updatedAt') => {
      if (sortKey === key) {
          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortOrder('desc');
      }
  };

  const handleCreateNote = () => {
      addBlock('text', { x: 100, y: 100 });
  };

  const onNoteContextMenu = (e: React.MouseEvent, block: NoteBlock) => {
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'edit2', onClick: () => focusBlock(block.id) },
          { label: block.isFavorite ? 'Remover Favorito' : 'Favoritar', icon: 'star', onClick: () => toggleFavorite(block.id) },
          { label: 'Duplicar', icon: 'copyPlus', onClick: () => duplicateBlock(block.id) },
          { type: 'separator' },
          { label: 'Mover para Lixeira', icon: 'trash', variant: 'danger', onClick: () => deleteBlock(block.id) }
      ]);
  };

  return (
    <div className="flex-1 bg-[#0a0e27] p-4 md:p-8 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                    {isFavoritesMode ? 'Favoritos' : 'Minhas Notas'}
                </h1>
                <p className="text-xs text-gray-400 hidden md:block">
                    {isFavoritesMode ? 'Suas notas marcadas como importantes.' : 'Gerencie todas as suas anotações em um só lugar.'}
                </p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar..."
                        className="w-full md:w-[250px] bg-[#1e233c] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <button 
                    onClick={handleCreateNote}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl shadow-lg md:hidden"
                >
                    <Icon name="plus" size={20} />
                </button>
            </div>
        </div>

        {/* List Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent md:bg-[#14182d]/30 md:border border-white/5 rounded-xl">
            
            {/* Desktop Header Row */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 bg-[#1e233c]/50 border-b border-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                <div className="w-8"></div>
                <button onClick={() => toggleSort('title')} className="text-left hover:text-white flex items-center gap-1">
                    Título {sortKey === 'title' && <Icon name={sortOrder === 'asc' ? 'chevronUp' : 'chevronDown'} size={12} />}
                </button>
                <div className="w-[120px] text-left">Pasta</div>
                <div className="w-[120px] text-left">Tags</div>
                <button onClick={() => toggleSort('updatedAt')} className="w-[120px] text-left hover:text-white flex items-center gap-1">
                    Data {sortKey === 'updatedAt' && <Icon name={sortOrder === 'asc' ? 'chevronUp' : 'chevronDown'} size={12} />}
                </button>
                <div className="w-[80px] text-right">Ações</div>
            </div>

            {/* List Content */}
            <div className="space-y-3 md:space-y-0">
                {sortedBlocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                        <Icon name="notebook" size={48} className="mb-4" />
                        <p>{isFavoritesMode ? "Nenhum favorito." : "Nenhuma nota encontrada."}</p>
                    </div>
                ) : (
                    sortedBlocks.map(block => (
                        <div 
                            key={block.id} 
                            onClick={() => focusBlock(block.id)}
                            onContextMenu={(e) => onNoteContextMenu(e, block)}
                            className="
                                md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] md:gap-4 md:px-4 md:py-3 md:border-b border-white/5 md:hover:bg-[#1e233c] md:items-center group cursor-pointer
                                flex flex-col p-4 bg-[#1e233c]/60 rounded-xl border border-white/5 active:scale-[0.98] transition-all
                            "
                        >
                            {/* Icon */}
                            <div className="hidden md:flex w-8 justify-center">
                                <Icon name={block.type === 'folder' ? 'folderOpen' : 'fileText'} size={16} className="text-blue-400" />
                            </div>
                            
                            {/* Title & Preview */}
                            <div className="flex-1 min-w-0 mb-2 md:mb-0">
                                <div className="font-bold text-base md:text-sm text-gray-200 truncate mb-1 md:mb-0">
                                    {block.title}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 md:hidden">
                                    {block.content.text || "Sem conteúdo..."}
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-2 justify-between md:contents">
                                
                                {/* Folder */}
                                <div className="w-auto md:w-[120px] truncate text-xs text-gray-500 order-2 md:order-none">
                                    {block.folderId && (
                                        <span className="flex items-center gap-1 text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md">
                                            <Icon name="folderOpen" size={10} /> {block.folderId}
                                        </span>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="w-auto md:w-[120px] flex gap-1 overflow-hidden order-3 md:order-none">
                                    {(block.tags || []).slice(0, 2).map((tag, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Date */}
                                <div className="w-auto md:w-[120px] text-xs text-gray-600 order-1 md:order-none">
                                    {new Date(block.updatedAt).toLocaleDateString()}
                                </div>

                                {/* Actions */}
                                <div className="w-auto md:w-[80px] flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity order-4 md:order-none ml-auto">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(block.id); }}
                                        className={`p-2 md:p-1.5 rounded-lg transition-colors ${block.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:bg-white/10 hover:text-yellow-400'}`}
                                    >
                                        <Icon name="star" size={16} className={block.isFavorite ? 'fill-current' : ''} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                        className="p-2 md:p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                    >
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default NotesListView;
