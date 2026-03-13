
import React, { useState, useMemo, useEffect } from 'react';
import { HistoryEntry, BookmarkItem, DownloadItem } from '../../types';
import { ExtensionItem } from '../../electron';
import { Icon } from '../ui/Icon';
import ExtensionManager from './ExtensionManager'; 
import { Folder, Trash2, Edit2, Plus, ChevronRight } from 'lucide-react';
import { useContextMenu } from '../../hooks/useContextMenu';

interface LibraryViewProps {
  history: HistoryEntry[];
  bookmarks: BookmarkItem[];
  downloads: DownloadItem[];
  onClearHistory: () => void;
  onRemoveBookmark: (id: string) => void;
  onNavigate: (url: string) => void;
  onRemoveHistoryItem: (timestamp: number) => void;
  initialTab?: 'HISTORY' | 'BOOKMARKS' | 'DOWNLOADS' | 'EXTENSIONS';
  extensions: ExtensionItem[];
  onUpdateBookmark?: (id: string, updates: Partial<BookmarkItem>) => void;
}

type TabType = 'HISTORY' | 'BOOKMARKS' | 'DOWNLOADS' | 'EXTENSIONS';
type HistoryFilter = 'ALL' | 'LINK' | 'SEARCH' | 'IMAGES';

const LibraryView: React.FC<LibraryViewProps> = ({ 
  history, 
  bookmarks,
  downloads, 
  onClearHistory, 
  onRemoveBookmark,
  onNavigate,
  onRemoveHistoryItem,
  initialTab = 'HISTORY',
  extensions,
  onUpdateBookmark
}) => {
  const { handleContextMenu } = useContextMenu();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Extensions State
  const [extStatus, setExtStatus] = useState<Record<string, string>>({});

  // Bookmarks State
  const [selectedFolder, setSelectedFolder] = useState<string>('Barra de Favoritos');
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
      if (window.api) {
          const removeListener = window.api.onExtensionStatus((status) => {
              setExtStatus(prev => ({ ...prev, [status.id]: status.message }));
              
              if (status.status === 'completed' || status.status === 'removed') {
                  setTimeout(() => {
                      setExtStatus(prev => {
                          const copy = { ...prev };
                          delete copy[status.id];
                          return copy;
                      });
                  }, 3000);
              }
          });
          return () => removeListener();
      }
  }, []);

  const handleRemoveExtension = (id: string) => {
      if (window.api && confirm('Deseja remover esta extensão?')) {
          window.api.removeExtension(id);
      }
  };

  // --- Context Menus Handlers ---

  const onHistoryContextMenu = (e: React.MouseEvent, item: HistoryEntry) => {
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'externalLink', onClick: () => onNavigate(item.url) },
          { label: 'Copiar Link', icon: 'copy', onClick: () => navigator.clipboard.writeText(item.url) },
          { type: 'separator' },
          { label: 'Excluir do Histórico', icon: 'trash', variant: 'danger', onClick: () => onRemoveHistoryItem(item.timestamp) }
      ]);
  };

  const onBookmarkContextMenu = (e: React.MouseEvent, item: BookmarkItem) => {
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'externalLink', onClick: () => onNavigate(item.url) },
          { label: 'Copiar Link', icon: 'copy', onClick: () => navigator.clipboard.writeText(item.url) },
          { type: 'separator' },
          { label: 'Editar', icon: 'edit2', onClick: () => {
              const newTitle = prompt('Nome:', item.title);
              if (newTitle && onUpdateBookmark) onUpdateBookmark(item.id, { title: newTitle });
          }},
          { label: 'Excluir', icon: 'trash', variant: 'danger', onClick: () => onRemoveBookmark(item.id) }
      ]);
  };

  const onDownloadContextMenu = (e: React.MouseEvent, item: DownloadItem) => {
      handleContextMenu(e, [
          { label: 'Abrir Arquivo', icon: 'fileText', onClick: () => handleOpenFolderFile(item.path) },
          { label: 'Mostrar na Pasta', icon: 'folderOpen', onClick: () => window.api.openPath(item.path) },
          { type: 'separator' },
          { label: 'Copiar Caminho', icon: 'copy', onClick: () => navigator.clipboard.writeText(item.path) }
      ]);
  };

  // --- LOGICA DE FAVORITOS E PASTAS ---
  const folders = useMemo(() => {
      const f = new Set<string>();
      f.add('Barra de Favoritos');
      bookmarks.forEach(b => {
          if (b.folder) f.add(b.folder);
      });
      return Array.from(f).sort();
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
      if (searchTerm) {
          return bookmarks.filter(b => 
            b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.folder && b.folder.toLowerCase().includes(searchTerm.toLowerCase()))
          );
      }
      return bookmarks.filter(b => {
          const f = b.folder || 'Barra de Favoritos';
          return f === selectedFolder;
      });
  }, [bookmarks, selectedFolder, searchTerm]);

  const handleCreateFolder = () => {
      if (newFolderMode && folderNameInput.trim()) {
          setSelectedFolder(folderNameInput.trim());
          setNewFolderMode(false);
          setFolderNameInput('');
      } else {
          setNewFolderMode(true);
          setFolderNameInput('');
      }
  };

  const handleRenameFolder = () => {
      if (!onUpdateBookmark || selectedFolder === 'Barra de Favoritos') return;
      
      const newName = prompt("Novo nome da pasta:", selectedFolder);
      if (newName && newName !== selectedFolder) {
          bookmarks.forEach(b => {
              if (b.folder === selectedFolder) {
                  onUpdateBookmark(b.id, { folder: newName });
              }
          });
          setSelectedFolder(newName);
      }
  };

  const handleDeleteFolder = () => {
      if (!onRemoveBookmark || selectedFolder === 'Barra de Favoritos') return;
      
      if (confirm(`Tem certeza que deseja excluir a pasta "${selectedFolder}" e todos os seus itens?`)) {
          bookmarks.forEach(b => {
              if (b.folder === selectedFolder) {
                  onRemoveBookmark(b.id);
              }
          });
          setSelectedFolder('Barra de Favoritos');
      }
  };

  // --- FILTROS HISTÓRICO ---
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');

  const filteredHistory = useMemo(() => {
      return history.filter(h => {
          const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                h.url.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (!matchesSearch) return false;

          if (historyFilter === 'ALL') return true;
          if (historyFilter === 'LINK') return h.type === 'link' || !h.type; 
          if (historyFilter === 'SEARCH') return h.type === 'search';
          if (historyFilter === 'IMAGES') return h.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || h.type === 'image';
          
          return true;
      });
  }, [history, searchTerm, historyFilter]);

  // --- FILTROS DOWNLOAD ---
  const [downloadFilter, setDownloadFilter] = useState<string>('ALL');

  const downloadExtensions = useMemo(() => {
      const exts = new Set<string>();
      downloads.forEach(d => {
          const parts = d.filename.split('.');
          if (parts.length > 1) {
              exts.add(parts.pop()!.toUpperCase());
          } else {
              exts.add('FILE');
          }
      });
      return Array.from(exts).sort();
  }, [downloads]);

  const filteredDownloads = useMemo(() => {
      return downloads.filter(d => {
          const matchesSearch = d.filename.toLowerCase().includes(searchTerm.toLowerCase());
          if (!matchesSearch) return false;

          if (downloadFilter === 'ALL') return true;
          
          const ext = d.filename.split('.').pop()?.toUpperCase() || 'FILE';
          return ext === downloadFilter;
      });
  }, [downloads, searchTerm, downloadFilter]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', { 
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleOpenFolderFile = (path: string) => {
      if (window.api && path) {
          window.api.openPath(path);
      }
  };

  const renderSidebarButton = (id: TabType, icon: string, label: string) => (
    <button 
        onClick={() => {
            setActiveTab(id);
            setSearchTerm('');
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === id
            ? 'bg-blue-400/15 text-blue-400' 
            : 'text-gray-400 hover:bg-[#1e233c] hover:text-gray-200'
        }`}
    >
        <Icon name={icon} size={16} /> {label}
    </button>
  );

  const getTitlePlaceholder = () => {
      switch(activeTab) {
          case 'HISTORY': return 'histórico';
          case 'BOOKMARKS': return 'favoritos';
          case 'DOWNLOADS': return 'downloads';
          case 'EXTENSIONS': return 'extensões';
          default: return 'biblioteca';
      }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0a0e27] overflow-hidden animate-[fadeIn_0.3s_ease]">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-blue-400/10 bg-[#0f1223]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-400/10 rounded-xl text-blue-400">
                <Icon name="library" size={24} className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-100">Minha Biblioteca</h1>
        </div>
        
        {activeTab !== 'EXTENSIONS' && (
            <div className="relative w-full md:w-[300px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Icon name="search" size={14} />
                </div>
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Pesquisar em ${getTitlePlaceholder()}...`}
                    className="w-full bg-[#1e233c] border border-blue-400/20 rounded-full py-2 pl-9 pr-4 text-sm text-gray-200 focus:outline-none focus:border-blue-400/50"
                />
            </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[200px] border-r border-blue-400/10 p-4 space-y-2 shrink-0">
            {renderSidebarButton('HISTORY', 'clock', 'Histórico')}
            {renderSidebarButton('BOOKMARKS', 'star', 'Favoritos')}
            {renderSidebarButton('DOWNLOADS', 'download', 'Downloads')}
            {renderSidebarButton('EXTENSIONS', 'puzzle', 'Extensões')}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-0 bg-[#0a0e27]">
            
            {activeTab === 'HISTORY' && (
                <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                             {[
                                { id: 'ALL', label: 'Tudo' },
                                { id: 'LINK', label: 'Links' },
                                { id: 'SEARCH', label: 'Pesquisa' },
                                { id: 'IMAGES', label: 'Imagens' }
                             ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setHistoryFilter(f.id as HistoryFilter)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                                        historyFilter === f.id 
                                        ? 'bg-blue-400/20 text-blue-400 border-blue-400/40' 
                                        : 'bg-[#1e233c]/50 text-gray-400 border-transparent hover:bg-[#1e233c]'
                                    }`}
                                >
                                    {f.label}
                                </button>
                             ))}
                        </div>
                        <button 
                            onClick={onClearHistory}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-400/20 px-3 py-1.5 rounded hover:bg-red-400/10 transition-colors w-fit"
                        >
                            <Trash2 size={12} /> Limpar Tudo
                        </button>
                    </div>

                    {filteredHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-20">Nenhum item encontrado.</div>
                    ) : (
                        <div className="space-y-2 pb-20 md:pb-0">
                            {filteredHistory.map((item, idx) => (
                                <div 
                                    key={item.timestamp + idx} 
                                    onContextMenu={(e) => onHistoryContextMenu(e, item)}
                                    className="flex items-center gap-3 md:gap-4 p-3 bg-[#1e233c]/30 border border-blue-400/5 rounded-lg hover:bg-[#1e233c]/60 transition-all group"
                                >
                                    <div className="hidden md:block text-gray-500 text-xs w-[120px] shrink-0">{formatDate(item.timestamp)}</div>
                                    <div className="w-8 h-8 rounded-full bg-[#0a0e27] flex items-center justify-center text-gray-400 shrink-0">
                                        {item.type === 'search' ? <Icon name="search" size={14} /> : <Icon name="globe" size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate(item.url)}>
                                        <div className="text-sm font-medium text-gray-200 truncate">{item.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{item.url}</div>
                                    </div>
                                    <button 
                                        onClick={() => onRemoveHistoryItem(item.timestamp)}
                                        className="md:opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all"
                                    >
                                        <Icon name="x" size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'BOOKMARKS' && (
                <div className="flex flex-col md:flex-row h-full">
                    {/* Folder Sidebar */}
                    <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-white/5 bg-[#14182d]/30 p-4 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-2 md:gap-0 items-center md:items-stretch scrollbar-hide md:custom-scrollbar">
                        <div className="hidden md:flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Pastas</h3>
                            <button onClick={handleCreateFolder} className="text-blue-400 hover:text-white"><Plus size={16} /></button>
                        </div>
                        
                        <div className="flex md:flex-col gap-2 w-full md:w-auto">
                            {folders.map(folder => (
                                <button
                                    key={folder}
                                    onClick={() => setSelectedFolder(folder)}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap md:whitespace-normal
                                        ${selectedFolder === folder 
                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                            : 'text-gray-400 hover:bg-white/5 border border-transparent bg-[#1e233c]/50 md:bg-transparent'
                                        }
                                    `}
                                >
                                    <Folder size={14} className={selectedFolder === folder ? 'fill-current' : ''} />
                                    <span className="truncate max-w-[120px] md:max-w-none">{folder}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bookmark List */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2 truncate">
                                <Folder className="text-blue-400" />
                                <span className="truncate">{selectedFolder}</span>
                            </h2>
                            <div className="flex gap-2 shrink-0">
                                {selectedFolder !== 'Barra de Favoritos' && !searchTerm && (
                                    <>
                                        <button onClick={handleRenameFolder} className="p-2 text-gray-500 hover:text-white rounded hover:bg-white/5" title="Renomear Pasta">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={handleDeleteFolder} className="p-2 text-gray-500 hover:text-red-400 rounded hover:bg-white/5" title="Excluir Pasta">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-0">
                            {filteredBookmarks.map((item) => (
                                <div 
                                    key={item.id} 
                                    onContextMenu={(e) => onBookmarkContextMenu(e, item)}
                                    className="flex items-center gap-4 p-4 bg-[#1e233c]/50 border border-blue-400/10 rounded-xl transition-all group relative overflow-hidden hover:bg-[#1e233c]"
                                >
                                    <div className="absolute top-0 left-0 w-[2px] h-full bg-blue-400 opacity-50" />
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate(item.url)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`} 
                                                className="w-4 h-4 rounded-sm" 
                                                onError={(e) => e.currentTarget.style.display = 'none'} 
                                            />
                                            <span className="text-sm font-semibold text-gray-200 truncate">{item.title}</span>
                                        </div>
                                        <div className="text-xs text-blue-400/60 truncate">{item.url}</div>
                                    </div>
                                    <button onClick={() => onRemoveBookmark(item.id)} className="md:opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all bg-[#0a0e27]/50 rounded-full">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'DOWNLOADS' && (
                <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-blue-400/10 overflow-x-auto scrollbar-hide">
                        <span className="text-xs font-semibold text-gray-400 mr-2 shrink-0">FILTRAR:</span>
                        {['ALL', ...downloadExtensions].map(ext => (
                            <button
                                key={ext}
                                onClick={() => setDownloadFilter(ext)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                                    downloadFilter === ext 
                                    ? 'bg-blue-400/20 text-blue-400 border-blue-400/40' 
                                    : 'bg-[#1e233c]/50 text-gray-400 border-transparent hover:bg-[#1e233c]'
                                }`}
                            >
                                {ext === 'ALL' ? 'TODOS' : ext}
                            </button>
                        ))}
                    </div>
                    
                    <div className="space-y-3 pb-20 md:pb-0">
                        {filteredDownloads.map((item) => {
                            const percent = item.totalBytes > 0 ? (item.receivedBytes / item.totalBytes) * 100 : 0;
                            const isCompleted = item.state === 'completed';
                            const ext = item.filename.split('.').pop()?.toLowerCase();
                            
                            return (
                                <div 
                                    key={item.id} 
                                    onContextMenu={(e) => onDownloadContextMenu(e, item)}
                                    className="flex items-center gap-4 p-4 bg-[#1e233c]/30 border border-blue-400/5 rounded-lg hover:bg-[#1e233c]/60 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#0a0e27] border border-blue-400/10 flex items-center justify-center text-blue-400 uppercase font-bold text-[10px] shrink-0">
                                        {ext || 'FILE'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-sm font-medium text-gray-200 truncate pr-4">{item.filename}</div>
                                            <div className="text-xs text-gray-500 hidden md:block">{formatDate(item.startTime)}</div>
                                        </div>
                                        {item.state === 'progressing' && (
                                            <div className="w-full h-1 bg-[#0f1223] rounded-full mb-2 overflow-hidden">
                                                <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${percent}%` }} />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>{formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)}</span>
                                            {isCompleted && <span className="text-green-400">● Concluído</span>}
                                            {item.state === 'cancelled' && <span className="text-red-400">● Cancelado</span>}
                                        </div>
                                    </div>
                                    {isCompleted && (
                                        <button 
                                            onClick={() => handleOpenFolderFile(item.path)}
                                            className="p-2 text-gray-500 hover:text-white transition-colors shrink-0"
                                            title="Mostrar na pasta"
                                        >
                                            <Icon name="folderOpen" size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'EXTENSIONS' && (
                <div className="p-4 md:p-8 pb-20 md:pb-8">
                    <ExtensionManager 
                        extensions={extensions}
                        extStatus={extStatus}
                        onRemoveExtension={handleRemoveExtension}
                        onNavigate={onNavigate}
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LibraryView;
