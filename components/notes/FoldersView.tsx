
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import { NoteBlock } from '../../types';
import { useContextMenu } from '../../hooks/useContextMenu';

const FoldersView: React.FC = () => {
  const { 
      blocks, 
      folders, 
      createFolder, 
      deleteFolder, 
      renameFolder, 
      addBlock, 
      focusBlock, 
      toggleFavorite, 
      deleteBlock,
      openedFolderId,
      setOpenedFolderId
  } = useNotes();
  
  const { handleContextMenu } = useContextMenu();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para criação de pasta
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  // Estado para renomeação (Grid)
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Estado do Modal da Pasta Aberta (Busca local)
  const [folderSearch, setFolderSearch] = useState('');
  
  // Estado para renomeação (Modal)
  const [isRenamingModal, setIsRenamingModal] = useState(false);
  const [modalRenameInput, setModalRenameInput] = useState('');
  const modalRenameInputRef = useRef<HTMLInputElement>(null);

  // Mapear blocos para pastas
  const foldersMap = useMemo(() => {
      const map: Record<string, NoteBlock[]> = {};
      folders.forEach(f => map[f] = []);
      map['Sem Pasta'] = [];

      blocks.filter(b => !b.isTrash).forEach(block => {
          const folderName = block.folderId || 'Sem Pasta';
          if (!map[folderName]) map[folderName] = [];
          map[folderName].push(block);
      });

      return map;
  }, [blocks, folders]);

  const displayFolders = useMemo(() => {
      let keys = Object.keys(foldersMap);
      if (searchTerm) {
          keys = keys.filter(key => {
              if (key.toLowerCase().includes(searchTerm.toLowerCase())) return true;
              return foldersMap[key].some(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
          });
      }
      return keys.sort((a, b) => {
          if (a === 'Sem Pasta') return -1;
          if (b === 'Sem Pasta') return 1;
          return a.localeCompare(b);
      });
  }, [foldersMap, searchTerm]);

  const currentFolderNotes = useMemo(() => {
      if (!openedFolderId) return [];
      let notes = foldersMap[openedFolderId] || [];
      notes = notes.sort((a, b) => b.updatedAt - a.updatedAt);

      if (folderSearch) {
          notes = notes.filter(n => 
              n.title.toLowerCase().includes(folderSearch.toLowerCase()) ||
              (n.content.text && n.content.text.toLowerCase().includes(folderSearch.toLowerCase()))
          );
      }
      return notes;
  }, [openedFolderId, foldersMap, folderSearch]);

  const folderStats = useMemo(() => {
      if (!openedFolderId) return null;
      const notes = foldersMap[openedFolderId] || [];
      const total = notes.length;
      const favorites = notes.filter(n => n.isFavorite).length;
      
      const tagCounts: Record<string, number> = {};
      notes.forEach(n => n.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
      const topTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([tag]) => tag);

      const lastUpdate = notes.length > 0 ? Math.max(...notes.map(n => n.updatedAt)) : 0;

      return { total, favorites, topTags, lastUpdate };
  }, [openedFolderId, foldersMap]);

  useEffect(() => {
      if (isCreating && createInputRef.current) {
          createInputRef.current.focus();
      }
  }, [isCreating]);

  useEffect(() => {
      if (editingFolder && renameInputRef.current) {
          renameInputRef.current.focus();
          renameInputRef.current.select();
      }
  }, [editingFolder]);

  useEffect(() => {
      if (isRenamingModal && modalRenameInputRef.current) {
          modalRenameInputRef.current.focus();
          modalRenameInputRef.current.select();
      }
  }, [isRenamingModal]);

  const handleCreateSubmit = () => {
      if (newFolderName.trim()) {
          createFolder(newFolderName.trim());
      }
      setIsCreating(false);
      setNewFolderName('');
  };

  const handleRenameSubmit = () => {
      if (editingFolder && renameInput.trim() && renameInput.trim() !== editingFolder) {
          renameFolder(editingFolder, renameInput.trim());
      }
      setEditingFolder(null);
      setRenameInput('');
  };

  const handleModalRenameSubmit = () => {
      if (openedFolderId && modalRenameInput.trim() && modalRenameInput.trim() !== openedFolderId) {
          const newName = modalRenameInput.trim();
          renameFolder(openedFolderId, newName);
          setOpenedFolderId(newName);
      }
      setIsRenamingModal(false);
  };
  
  const handleCreateNoteQuick = () => {
      if (openedFolderId) {
          addBlock('text', { x: 50, y: 50 }, undefined, openedFolderId);
      }
  };

  // --- Context Menus ---
  const onFolderContextMenu = (e: React.MouseEvent, folderName: string) => {
      if (folderName === 'Sem Pasta') return;
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'folderOpen', onClick: () => setOpenedFolderId(folderName) },
          { label: 'Renomear', icon: 'edit2', onClick: () => { setEditingFolder(folderName); setRenameInput(folderName); } },
          { type: 'separator' },
          { label: 'Excluir Pasta', icon: 'trash', variant: 'danger', onClick: () => {
              if(confirm(`Excluir pasta "${folderName}"? As notas não serão apagadas.`)) deleteFolder(folderName);
          }}
      ]);
  };

  const onNoteContextMenu = (e: React.MouseEvent, note: NoteBlock) => {
      handleContextMenu(e, [
          { label: 'Abrir Nota', icon: 'fileText', onClick: () => focusBlock(note.id) },
          { label: note.isFavorite ? 'Remover Favorito' : 'Favoritar', icon: 'star', onClick: () => toggleFavorite(note.id) },
          { type: 'separator' },
          { label: 'Mover para Lixeira', icon: 'trash', variant: 'danger', onClick: () => deleteBlock(note.id) }
      ]);
  };

  return (
    <div className="flex-1 bg-[#0a0e27] p-8 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease] relative">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Pastas</h1>
                <p className="text-xs text-gray-400">Organize seu conhecimento em categorias.</p>
            </div>
            
            <div className="flex gap-4">
                <div className="relative">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar pastas..."
                        className="bg-[#1e233c] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-[250px]"
                    />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar p-1">
            
            {/* Card de Criação */}
            {isCreating ? (
                <div className="bg-[#1e233c] border border-blue-500 rounded-xl p-5 shadow-lg shadow-blue-900/20 flex flex-col h-[200px] justify-center gap-4 animate-[fadeIn_0.2s_ease]">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                            <Icon name="folderOpen" size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">Nova Pasta</h3>
                    </div>
                    <input 
                        ref={createInputRef}
                        type="text" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => { 
                            e.stopPropagation();
                            if (e.key === 'Enter') handleCreateSubmit(); 
                            if (e.key === 'Escape') setIsCreating(false); 
                        }}
                        onBlur={handleCreateSubmit}
                        onClick={e => e.stopPropagation()}
                        placeholder="Nome da pasta"
                        className="bg-[#0a0e27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none w-full text-center"
                        autoFocus
                    />
                </div>
            ) : (
                <button 
                    className="border-2 border-dashed border-white/10 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all h-[200px] group"
                    onClick={() => setIsCreating(true)}
                >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                        <Icon name="plus" size={24} />
                    </div>
                    <span className="text-sm font-bold">Nova Pasta</span>
                </button>
            )}

            {/* Lista de Pastas */}
            {displayFolders.map((folderName) => {
                const items = foldersMap[folderName] || [];
                const isEditingThis = editingFolder === folderName;

                return (
                    <div 
                        key={folderName}
                        onClick={() => setOpenedFolderId(folderName)}
                        onContextMenu={(e) => onFolderContextMenu(e, folderName)}
                        className="bg-[#1e233c]/40 border border-white/5 rounded-xl p-5 hover:bg-[#1e233c] hover:border-blue-500/30 transition-all group cursor-pointer flex flex-col h-[200px] relative hover:shadow-xl hover:translate-y-[-2px]"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${folderName === 'Sem Pasta' ? 'bg-gray-500/10 text-gray-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                <Icon name="folderOpen" size={24} />
                            </div>
                            <div className="flex gap-1">
                                <span className="text-xs font-bold text-gray-500 bg-black/20 px-2 py-1.5 rounded-full">{items.length}</span>
                                {folderName !== 'Sem Pasta' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(confirm(`Excluir pasta "${folderName}"? As notas não serão apagadas.`)) deleteFolder(folderName); }}
                                        className="text-gray-600 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Excluir"
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {isEditingThis ? (
                            <div className="mb-2" onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    onKeyDown={(e) => { 
                                        e.stopPropagation();
                                        if(e.key === 'Enter') handleRenameSubmit(); 
                                        if(e.key === 'Escape') { setEditingFolder(null); setRenameInput(''); }
                                    }}
                                    onBlur={handleRenameSubmit}
                                    className="bg-[#0a0e27] border border-blue-500 rounded px-2 py-1 text-lg font-bold text-white outline-none w-full"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between group/title">
                                <h3 className="text-lg font-bold text-gray-200 mb-2 truncate flex-1" title={folderName}>{folderName}</h3>
                                {folderName !== 'Sem Pasta' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingFolder(folderName); setRenameInput(folderName); }} 
                                        className="opacity-0 group-hover/title:opacity-100 text-gray-500 hover:text-white p-1"
                                    >
                                        <Icon name="edit2" size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-hidden">
                            {items.length === 0 ? (
                                <div className="text-xs text-gray-600 italic mt-2">Vazio</div>
                            ) : (
                                <div className="space-y-1">
                                    {items.slice(0, 3).map(item => (
                                        <div key={item.id} className="text-xs text-gray-500 flex items-center gap-2 truncate">
                                            <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0"></span>
                                            {item.title}
                                        </div>
                                    ))}
                                    {items.length > 3 && (
                                        <div className="text-[10px] text-gray-600 mt-1 italic">
                                            + {items.length - 3} outros itens
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* MODAL DA PASTA ABERTA */}
        {openedFolderId && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-[fadeIn_0.2s_ease]">
                <div className="bg-[#0f1223] w-full max-w-5xl h-full md:h-[85vh] rounded-[32px] border border-white/10 shadow-2xl flex overflow-hidden flex-col md:flex-row relative">
                    
                    <button 
                        onClick={() => setOpenedFolderId(null)}
                        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all"
                    >
                        <Icon name="x" size={20} />
                    </button>

                    <div className="w-full md:w-[300px] bg-[#14182d] border-r border-white/5 p-8 flex flex-col shrink-0">
                        <div className="mb-8">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${openedFolderId === 'Sem Pasta' ? 'bg-gray-700/20 text-gray-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                <Icon name="folderOpen" size={32} />
                            </div>
                            
                            {isRenamingModal && openedFolderId !== 'Sem Pasta' ? (
                                <div className="mb-2">
                                    <input 
                                        ref={modalRenameInputRef}
                                        type="text" 
                                        value={modalRenameInput}
                                        onChange={(e) => setModalRenameInput(e.target.value)}
                                        onBlur={handleModalRenameSubmit}
                                        onKeyDown={(e) => { 
                                            e.stopPropagation();
                                            if (e.key === 'Enter') handleModalRenameSubmit(); 
                                            if (e.key === 'Escape') setIsRenamingModal(false);
                                        }}
                                        className="w-full bg-transparent border-b border-blue-500 text-2xl font-bold text-white outline-none py-1"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/title mb-2">
                                    <h2 className="text-2xl font-bold text-white break-words leading-tight">{openedFolderId}</h2>
                                    {openedFolderId !== 'Sem Pasta' && (
                                        <button 
                                            onClick={() => { setModalRenameInput(openedFolderId); setIsRenamingModal(true); }} 
                                            className="text-gray-500 hover:text-white opacity-0 group-hover/title:opacity-100 transition-opacity p-1"
                                        >
                                            <Icon name="edit2" size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{folderStats?.total || 0} Notas</p>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Icon name="star" size={14} /></div>
                                        <span className="text-xs font-bold text-gray-300">Favoritos</span>
                                    </div>
                                    <span className="text-sm font-mono font-bold text-white">{folderStats?.favorites}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Icon name="clock" size={14} /></div>
                                        <span className="text-xs font-bold text-gray-300">Atualizado</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        {folderStats?.lastUpdate ? new Date(folderStats.lastUpdate).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>

                            {folderStats && folderStats.topTags.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Tags Recorrentes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {folderStats.topTags.map(tag => (
                                            <span key={tag} className="text-[10px] px-2 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                            {openedFolderId !== 'Sem Pasta' && (
                                <button 
                                    onClick={() => { 
                                        setModalRenameInput(openedFolderId);
                                        setIsRenamingModal(true);
                                    }}
                                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon name="edit2" size={14} /> Renomear Pasta
                                </button>
                            )}
                            <button 
                                onClick={handleCreateNoteQuick}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
                                <Icon name="plus" size={14} /> Criar Nota Rápida
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-[#0f1223] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                <input 
                                    type="text" 
                                    value={folderSearch}
                                    onChange={(e) => setFolderSearch(e.target.value)}
                                    placeholder={`Pesquisar em ${openedFolderId}...`}
                                    className="w-full bg-[#1e233c] border border-white/5 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {currentFolderNotes.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <Icon name="note" size={48} className="mb-4" />
                                    <p>Esta pasta está vazia.</p>
                                    <p className="text-xs mt-2">Clique em "Criar Nota Rápida" para começar.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {currentFolderNotes.map(note => (
                                        <div 
                                            key={note.id}
                                            onClick={() => focusBlock(note.id)}
                                            onContextMenu={(e) => onNoteContextMenu(e, note)}
                                            className="group bg-[#1e233c]/40 border border-white/5 hover:bg-[#1e233c] hover:border-blue-500/30 p-5 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:translate-y-[-2px] relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors truncate pr-8">{note.title}</h3>
                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id); }} className={`p-1.5 rounded hover:bg-white/10 ${note.isFavorite ? 'text-yellow-400' : 'text-gray-500'}`}><Icon name="star" size={14} className={note.isFavorite ? "fill-current" : ""} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteBlock(note.id); }} className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"><Icon name="trash" size={14} /></button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8 leading-relaxed">
                                                {note.content.text || "Sem conteúdo..."}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className="flex gap-1">
                                                    {note.tags?.slice(0, 2).map(t => (
                                                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">{t}</span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-mono">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default FoldersView;
