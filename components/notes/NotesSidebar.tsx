
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { useNotes } from '../../contexts/NotesContext';
import { BlockType, NoteBlock } from '../../types';
import { useContextMenu } from '../../hooks/useContextMenu';

export const NotesSidebar: React.FC = () => {
  const { 
      blocks, 
      focusBlock, 
      setViewMode, 
      setFolder, 
      viewMode, 
      folders, 
      setOpenedFolderId,
      deleteFolder,
      renameFolder,
      toggleFavorite,
      deleteBlock,
      duplicateBlock
  } = useNotes();

  const { handleContextMenu } = useContextMenu();

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECENT'>('DASHBOARD');
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Filtra blocos para a busca (ignora lixeira)
  const searchResults = blocks.filter(b => 
    !b.isTrash &&
    searchTerm.trim() !== '' && (
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.content.text && b.content.text.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Fecha o modal de busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragStartBlock = (e: React.DragEvent, type: BlockType) => {
      e.dataTransfer.setData('application/studyhub-block-type', type);
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragStartTemplate = (e: React.DragEvent, templateId: string) => {
      e.dataTransfer.setData('application/studyhub-template-id', templateId);
      e.dataTransfer.effectAllowed = 'copy';
      // Visual feedback
      const el = e.currentTarget as HTMLElement;
      el.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.opacity = '1';
  };

  // Lógica de Drop na Pasta
  const handleDropOnFolder = (e: React.DragEvent, folderName: string) => {
      e.preventDefault();
      const noteId = e.dataTransfer.getData('application/studyhub-note-id');
      if (noteId) {
          setFolder(noteId, folderName);
      }
  };

  const handleDragOverFolder = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleFolderClick = (folderName: string) => {
      setOpenedFolderId(folderName);
      setViewMode('FOLDERS');
  };

  const handleManageFoldersClick = () => {
      setOpenedFolderId(null); // Reseta a pasta aberta para mostrar a grid geral
      setViewMode('FOLDERS');
  };

  // --- Context Menus ---

  const onFolderContextMenu = (e: React.MouseEvent, folderName: string) => {
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'folderOpen', onClick: () => handleFolderClick(folderName) },
          { label: 'Renomear', icon: 'edit2', onClick: () => {
              const newName = prompt('Novo nome da pasta:', folderName);
              if (newName) renameFolder(folderName, newName);
          }},
          { type: 'separator' },
          { label: 'Excluir Pasta', icon: 'trash', variant: 'danger', onClick: () => {
              if(confirm(`Excluir pasta "${folderName}"? As notas não serão apagadas.`)) deleteFolder(folderName);
          }}
      ]);
  };

  const onRecentNoteContextMenu = (e: React.MouseEvent, note: NoteBlock) => {
      handleContextMenu(e, [
          { label: 'Abrir Nota', icon: 'fileText', onClick: () => focusBlock(note.id) },
          { label: note.isFavorite ? 'Remover dos Favoritos' : 'Favoritar', icon: 'star', onClick: () => toggleFavorite(note.id) },
          { label: 'Duplicar', icon: 'copyPlus', onClick: () => duplicateBlock(note.id) },
          { type: 'separator' },
          { label: 'Mover para Lixeira', icon: 'trash', variant: 'danger', onClick: () => deleteBlock(note.id) }
      ]);
  };

  const recentActivity = [...blocks].filter(b => !b.isTrash).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const SMART_TEMPLATES_UI = [
    { id: 'cornell', label: 'Método Cornell', icon: 'book', desc: 'Resumo, anotações e palavras-chave.' },
    { id: 'week-plan', label: 'Planejamento Semanal', icon: 'calendarCheck', desc: 'Metas, prioridades e agenda rápida.' },
    { id: 'meeting', label: 'Ata de Reunião', icon: 'users', desc: 'Pauta, participantes e ações.' },
    { id: 'kanban-card', label: 'Projeto / Card', icon: 'layout', desc: 'Status, escopo e checklist.' },
  ];

  return (
    <div className="w-[280px] bg-[#0f1223] border-l border-white/5 flex flex-col shrink-0 h-full z-20">
        
        {/* Header Title */}
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <Icon name="notebook" className="text-blue-400" size={20} />
            <h2 className="text-sm font-bold text-white tracking-wide">Anotações</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            
            {/* Search Section */}
            <div className="relative" ref={searchRef}>
                <div className="flex items-center bg-[#14182d] border border-white/10 rounded-lg px-3 py-2 transition-colors focus-within:border-blue-500/50">
                    <Icon name="search" size={14} className="text-gray-500 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Buscar Notas..." 
                        className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-gray-600"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSearchResults(true);
                        }}
                        onFocus={() => setShowSearchResults(true)}
                    />
                </div>

                {/* Mini Modal de Resultados */}
                {showSearchResults && searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e233c] border border-blue-400/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-[fadeIn_0.1s_ease]">
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-xs">
                                    Nenhuma nota encontrada.
                                </div>
                            ) : (
                                searchResults.map(block => (
                                    <button
                                        key={block.id}
                                        onClick={() => {
                                            focusBlock(block.id);
                                            setShowSearchResults(false);
                                        }}
                                        onContextMenu={(e) => onRecentNoteContextMenu(e, block)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <Icon name="fileText" size={12} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-200 truncate">{block.title}</div>
                                            <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                                {new Date(block.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-1">
                <button 
                    onClick={() => setViewMode('LIST')}
                    className={`w-full border border-transparent rounded-lg py-2 px-3 flex items-center gap-3 text-xs font-bold transition-all group ${viewMode === 'LIST' ? 'bg-[#1e233c] text-white border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Icon name="notebook" size={16} className={viewMode === 'LIST' ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"} />
                    Todas as Notas
                </button>
                
                <button 
                    onClick={() => setViewMode('FAVORITES')}
                    className={`w-full border border-transparent rounded-lg py-2 px-3 flex items-center gap-3 text-xs font-bold transition-all group ${viewMode === 'FAVORITES' ? 'bg-[#1e233c] text-white border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Icon name="star" size={16} className={viewMode === 'FAVORITES' ? "text-yellow-400" : "text-gray-500 group-hover:text-yellow-400"} />
                    Favoritos
                </button>

                <button 
                    onClick={() => setViewMode('TRASH')}
                    className={`w-full border border-transparent rounded-lg py-2 px-3 flex items-center gap-3 text-xs font-bold transition-all group ${viewMode === 'TRASH' ? 'bg-[#1e233c] text-white border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Icon name="trash" size={16} className={viewMode === 'TRASH' ? "text-red-400" : "text-gray-500 group-hover:text-red-400"} />
                    Lixeira
                </button>
            </div>

            <div className="h-[1px] bg-white/5 w-full"></div>

            {/* Folders List (Drop Zones) */}
            <div>
                <div className="flex items-center justify-between mb-2 px-2">
                    <button 
                        onClick={() => setIsFoldersOpen(!isFoldersOpen)}
                        className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-white transition-colors"
                    >
                        <Icon name={isFoldersOpen ? "chevronDown" : "chevronRight"} size={12} />
                        Pastas
                    </button>
                    <button 
                        onClick={handleManageFoldersClick}
                        className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-blue-400 transition-colors"
                        title="Gerenciar Pastas"
                    >
                        <Icon name="settings" size={12} />
                    </button>
                </div>
                
                {isFoldersOpen && (
                    <div className="space-y-0.5 animate-[fadeIn_0.2s_ease]">
                        {folders.length === 0 && (
                            <div className="px-4 py-2 text-xs text-gray-600 italic">Nenhuma pasta criada.</div>
                        )}
                        {folders.map(folder => (
                            <div 
                                key={folder}
                                onClick={() => handleFolderClick(folder)}
                                onContextMenu={(e) => onFolderContextMenu(e, folder)}
                                onDrop={(e) => handleDropOnFolder(e, folder)}
                                onDragOver={handleDragOverFolder}
                                className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white transition-colors border border-transparent hover:border-blue-500/20"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Icon name="folderOpen" size={14} className="text-blue-500/70 group-hover:text-blue-400" />
                                    <span className="text-xs truncate">{folder}</span>
                                </div>
                                <span className="text-[9px] bg-white/5 px-1.5 rounded text-gray-500 group-hover:text-white">
                                    {blocks.filter(b => b.folderId === folder && !b.isTrash).length}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-[1px] bg-white/5 w-full"></div>

            {/* Smart Templates */}
            <div>
                <button 
                    onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                    className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 px-2 hover:text-white transition-colors"
                >
                     <Icon name={isTemplatesOpen ? "chevronDown" : "chevronRight"} size={12} />
                     Templates Inteligentes
                </button>
                
                {isTemplatesOpen && (
                    <div className="grid grid-cols-1 gap-2 px-1 animate-[fadeIn_0.2s_ease]">
                        {SMART_TEMPLATES_UI.map((item) => (
                            <div 
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStartTemplate(e, item.id)}
                                onDragEnd={handleDragEnd}
                                className="bg-[#14182d] hover:bg-[#1e233c] border border-white/5 hover:border-blue-500/30 rounded-xl p-3 flex gap-3 cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-8 h-8 rounded-lg bg-[#0a0e27] flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0 border border-white/5">
                                    <Icon name={item.icon} size={14} />
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                    <span className="text-[11px] font-bold text-gray-200 group-hover:text-blue-200 truncate">{item.label}</span>
                                    <span className="text-[9px] text-gray-600 truncate">{item.desc}</span>
                                </div>
                            </div>
                        ))}
                        
                        {/* Basic Block Draggables (Smaller) */}
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                             {[
                                { type: 'text', icon: 'pilcrow' },
                                { type: 'image', icon: 'image' },
                                { type: 'code', icon: 'code' },
                             ].map(item => (
                                 <div 
                                     key={item.type}
                                     draggable
                                     onDragStart={(e) => handleDragStartBlock(e, item.type as BlockType)}
                                     className="bg-[#14182d] hover:bg-[#1e233c] border border-white/5 rounded-lg p-2 flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-gray-500/30"
                                     title={`Bloco: ${item.type}`}
                                 >
                                     <Icon name={item.icon} size={14} className="text-gray-500" />
                                 </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Atividade Recente */}
            {activeTab === 'RECENT' && (
                <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Recentes</h3>
                    <div className="space-y-3">
                        {recentActivity.map(block => (
                            <div 
                                key={block.id} 
                                className="flex gap-3 items-start group cursor-pointer px-2" 
                                onClick={() => focusBlock(block.id)}
                                onContextMenu={(e) => onRecentNoteContextMenu(e, block)}
                            >
                                <div className="w-1 h-full min-h-[20px] bg-blue-500/20 rounded-full group-hover:bg-blue-500 transition-colors" />
                                <div>
                                    <div className="text-xs font-bold text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-1">{block.title}</div>
                                    <div className="text-[10px] text-gray-600">Editado agora mesmo</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};
