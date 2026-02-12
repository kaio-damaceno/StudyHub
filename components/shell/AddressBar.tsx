
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { HistoryEntry, BookmarkItem, DownloadItem } from '../../types';
import type { ExtensionItem } from '../../electron';
import { Lock, AlertTriangle, ShieldCheck, Pin, Trash2, Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { useContextMenu } from '../../hooks/useContextMenu';

// CONFIGURAÇÃO DE NOTIFICAÇÕES
const NOTIFICATIONS_URL = 'https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/notifications.json';

interface AddressBarProps {
  currentUrl: string;
  onSearch: (url: string) => void;
  onGoHome: () => void;
  loading?: boolean;
  history?: HistoryEntry[];
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  bookmarks?: BookmarkItem[];
  onRemoveBookmark?: (id: string) => void;
  onUpdateBookmark?: (id: string, updates: Partial<BookmarkItem>) => void;
  downloads?: DownloadItem[];
  onOpenLibrary?: (section: 'HISTORY' | 'BOOKMARKS' | 'DOWNLOADS' | 'EXTENSIONS') => void;
  onOpenSettings?: () => void; 
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  extensions: ExtensionItem[];
}

export interface AddressBarRef {
    focusInput: () => void;
}

// --- POPUP COMPONENTS ---

const SecurityInfoPopup = ({ url, isSecure, onClose }: { url: string, isSecure: boolean, onClose: () => void }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={popupRef} className="absolute top-[38px] left-0 w-[300px] bg-[#14182d] border border-blue-400/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-[100] animate-[fadeIn_0.1s_ease] overflow-hidden">
            <div className={`p-4 border-b border-white/5 ${isSecure ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="flex items-center gap-3 mb-1">
                     {isSecure ? <div className="text-green-400"><ShieldCheck size={20} /></div> : <div className="text-red-400"><AlertTriangle size={20} /></div>}
                     <div><h3 className={`font-bold text-sm ${isSecure ? 'text-green-400' : 'text-red-400'}`}>{isSecure ? 'Conexão Segura' : 'Não Seguro'}</h3></div>
                </div>
                <p className="text-xs text-gray-400 leading-tight mt-1">
                    {isSecure ? `As informações enviadas para ${domain} são privadas.` : `Não insira informações confidenciais (senhas, cartões) neste site.`}
                </p>
            </div>
        </div>
    );
};

const NotificationsPopup = ({ onClose }: { onClose: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Tenta buscar do servidor
                const response = await fetch(NOTIFICATIONS_URL);
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                } else {
                    throw new Error("Falha ao carregar");
                }
            } catch (error) {
                // Fallback local
                setNotifications([
                    { id: 'demo', title: 'Sistema de Notificações', msg: 'Configure a URL no código para receber avisos reais.', time: 'Info', type: 'info' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    return (
        <div className="absolute top-full right-0 mt-2 w-[320px] bg-[#14182d] border border-blue-400/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[100] flex flex-col overflow-hidden animate-[fadeIn_0.1s_ease]">
            <div className="px-4 py-3 border-b border-white/5 bg-[#0f1223]/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">Avisos e Alertas</span>
                <button onClick={onClose}><Icon name="x" size={14} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {loading ? (
                    <div className="p-4 text-center text-gray-500 text-xs">Carregando...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-xs">Nenhum aviso novo.</div>
                ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    notifications.map((n: any) => (
                        <div key={n.id} className="p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold ${n.type === 'warning' ? 'text-yellow-400' : n.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>{n.title}</span>
                                <span className="text-[9px] text-gray-600">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{n.msg}</p>
                        </div>
                    ))
                )}
            </div>
            <div className="p-2 border-t border-white/5 text-center bg-[#0f1223]">
                <span className="text-[9px] text-gray-600">Study Hub Updates</span>
            </div>
        </div>
    );
};

const CurrentBookmarkPopup = ({ 
    url, title, bookmarks, onClose, onUpdate, onRemove 
}: { 
    url: string, title: string, bookmarks: BookmarkItem[], onClose: () => void, 
    onUpdate: (id: string, updates: Partial<BookmarkItem>) => void,
    onRemove: (id: string) => void
}) => {
    const currentBookmark = bookmarks.find(b => b.url === url);
    const [editTitle, setEditTitle] = useState(currentBookmark?.title || title);
    const [editFolder, setEditFolder] = useState(currentBookmark?.folder || '');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    
    const folders = useMemo(() => {
        const f = new Set<string>();
        bookmarks.forEach(b => { if(b.folder) f.add(b.folder); });
        return Array.from(f).sort();
    }, [bookmarks]);

    const handleSave = () => {
        if (currentBookmark) {
            onUpdate(currentBookmark.id, { title: editTitle, folder: editFolder || undefined });
        }
        onClose();
    };

    const handleRemove = () => {
        if (currentBookmark) onRemove(currentBookmark.id);
        onClose();
    };

    const popupRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={popupRef} className="absolute top-[38px] right-2 w-[320px] bg-[#14182d] border border-blue-400/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100] animate-[fadeIn_0.1s_ease] overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-[#0f1223]/50 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-yellow-400">
                    <Icon name="star" size={16} className="fill-current" />
                    <span className="text-xs font-bold text-gray-200">Editar Favorito</span>
                </div>
                <button onClick={onClose}><Icon name="x" size={14} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="p-4 space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nome</label>
                    <input 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="w-full bg-[#0a0e27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
                        autoFocus
                    />
                </div>
                <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Pasta</label>
                    <div className="relative">
                        <input 
                            value={editFolder} 
                            onChange={e => { setEditFolder(e.target.value); setIsSuggestionsOpen(true); }}
                            onFocus={() => setIsSuggestionsOpen(true)}
                            className="w-full bg-[#0a0e27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
                            placeholder="Barra de Favoritos (Padrão)"
                        />
                        <button 
                            onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>
                    
                    {isSuggestionsOpen && folders.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e233c] border border-white/10 rounded-lg shadow-xl max-h-[150px] overflow-y-auto z-20">
                            {folders.filter(f => f.toLowerCase().includes(editFolder.toLowerCase())).map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => { setEditFolder(f); setIsSuggestionsOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-500/20 hover:text-white flex items-center gap-2"
                                >
                                    <Folder size={12} /> {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2 pt-2">
                    <button onClick={handleRemove} className="px-3 py-2 rounded-lg bg-[#1e233c] hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs font-bold transition-all border border-white/5">
                        Remover
                    </button>
                    <button onClick={handleSave} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/20">
                        Concluir
                    </button>
                </div>
            </div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExtensionsPopup = ({ extensions, onClose, onOpenLibrary }: { extensions: ExtensionItem[], onClose: () => void, onOpenLibrary: any }) => {
    const handleTogglePin = (id: string) => {
        if(window.api) window.api.toggleExtensionPin(id);
    };
    const handleRemove = (id: string) => {
        if(window.api && confirm('Remover extensão?')) window.api.removeExtension(id);
    };
    const handleOpen = (ext: ExtensionItem) => {
        if (window.api && ext.popup) {
            const rect = document.getElementById('extensions-trigger')?.getBoundingClientRect();
            window.api.openExtensionPopup(ext.id, ext.popup, { x: rect?.x || 0, y: (rect?.bottom || 0) + 5 });
            onClose();
        }
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-[320px] bg-[#14182d] border border-blue-400/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[100] flex flex-col overflow-hidden animate-[fadeIn_0.1s_ease]">
            <div className="px-4 py-3 border-b border-white/5 bg-[#0f1223]/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">Minhas Extensões</span>
                <button onClick={onClose}><Icon name="x" size={14} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
                {extensions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">Nenhuma extensão instalada.</div>
                ) : (
                    extensions.map(ext => (
                        <div key={ext.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group transition-colors">
                            <div 
                                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                                onClick={() => handleOpen(ext)}
                            >
                                <div className="w-8 h-8 rounded bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                                    {ext.icon ? (
                                        <img src={`studyhub-ext://${ext.id}/${ext.icon}`} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-black font-bold text-xs">{ext.title[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-200 truncate">{ext.title}</div>
                                    <div className="text-[10px] text-gray-500 truncate">Versão {ext.version || '1.0'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleTogglePin(ext.id)} className={`p-1.5 rounded hover:bg-white/10 ${ext.pinned ? 'text-blue-400' : 'text-gray-500'}`} title={ext.pinned ? "Desafixar" : "Fixar"}>
                                    <Pin size={14} className={ext.pinned ? "fill-current" : ""} />
                                </button>
                                <button onClick={() => handleRemove(ext.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400" title="Remover">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button 
                onClick={() => { onOpenLibrary && onOpenLibrary('EXTENSIONS'); onClose(); }}
                className="w-full py-3 bg-[#0f1223] hover:bg-[#1e233c] text-xs font-bold text-gray-400 hover:text-white border-t border-white/5 transition-colors"
            >
                Gerenciar Extensões
            </button>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BookmarksPopup = ({ bookmarks, onClose, onOpenLibrary, onRemove, onUpdate }: { 
    bookmarks: BookmarkItem[], onClose: () => void, onOpenLibrary: any, onRemove?: (id: string) => void, onUpdate?: (id: string, data: any) => void 
}) => {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

    const grouped = useMemo(() => {
        const g: Record<string, BookmarkItem[]> = {};
        g['Barra de Favoritos'] = [];
        bookmarks.forEach(b => {
            const key = b.folder || 'Barra de Favoritos';
            if(!g[key]) g[key] = [];
            g[key].push(b);
        });
        return Object.keys(g).sort().reduce((obj, key) => { 
            obj[key] = g[key]; 
            return obj;
        }, {} as Record<string, BookmarkItem[]>);
    }, [bookmarks]);

    const toggleFolder = (folder: string) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
    };

    useEffect(() => {
        if (Object.keys(grouped).length <= 3) {
             const allOpen: Record<string, boolean> = {};
             Object.keys(grouped).forEach(k => allOpen[k] = true);
             setOpenFolders(allOpen);
        } else {
             setOpenFolders({ 'Barra de Favoritos': true });
        }
    }, []); 

    return (
        <div className="absolute top-full right-0 mt-2 w-[350px] bg-[#14182d] border border-blue-400/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[100] flex flex-col overflow-hidden animate-[fadeIn_0.1s_ease]">
            <div className="px-4 py-3 border-b border-white/5 bg-[#0f1223]/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">Todos os Favoritos</span>
                <button onClick={onClose}><Icon name="x" size={14} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                {bookmarks.length === 0 ? (
                     <div className="text-center py-8 text-gray-500 text-xs">Nenhum favorito salvo.</div>
                ) : (
                    Object.entries(grouped).map(([folder, items]) => (
                        <div key={folder} className="mb-1">
                            <button 
                                onClick={() => toggleFolder(folder)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                {openFolders[folder] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Folder size={14} className="text-blue-400" />
                                <span className="font-bold truncate">{folder}</span>
                                <span className="ml-auto text-[10px] opacity-50">{(items as BookmarkItem[]).length}</span>
                            </button>
                            
                            {openFolders[folder] && (
                                <div className="ml-6 border-l border-white/10 pl-2 mt-1 space-y-1">
                                    {(items as BookmarkItem[]).map(b => (
                                        <div key={b.id} className="group flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=32`} 
                                                className="w-4 h-4 rounded-sm opacity-80" 
                                                onError={(e) => e.currentTarget.style.display = 'none'} 
                                            />
                                            <a href="#" onClick={(e) => { e.preventDefault(); if(window.api) window.api.navigateToUrl(b.url); onClose(); }} className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-200 truncate">{b.title}</div>
                                            </a>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if(onRemove) onRemove(b.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {(items as BookmarkItem[]).length === 0 && <div className="text-[10px] text-gray-600 pl-2 italic">Vazio</div>}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <button 
                onClick={() => { onOpenLibrary && onOpenLibrary('BOOKMARKS'); onClose(); }}
                className="w-full py-3 bg-[#0f1223] hover:bg-[#1e233c] text-xs font-bold text-gray-400 hover:text-white border-t border-white/5 transition-colors"
            >
                Abrir Gerenciador de Favoritos
            </button>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DownloadsPopup = ({ downloads, onClose, onOpenLibrary }: { downloads: DownloadItem[], onClose: () => void, onOpenLibrary: any }) => {
    const recent = downloads.slice(0, 5);
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-[320px] bg-[#14182d] border border-blue-400/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[100] flex flex-col overflow-hidden animate-[fadeIn_0.1s_ease]">
             <div className="px-4 py-3 border-b border-white/5 bg-[#0f1223]/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">Downloads Recentes</span>
                <button onClick={onClose}><Icon name="x" size={14} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="p-2">
                {recent.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">Nenhum download recente.</div>
                ) : (
                    recent.map(item => (
                        <div key={item.id} className="p-2.5 hover:bg-white/5 rounded-lg flex items-center gap-3 group transition-colors">
                             <div className="w-8 h-8 bg-[#0a0e27] rounded flex items-center justify-center text-gray-400">
                                 <File size={16} />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="text-sm text-gray-200 truncate">{item.filename}</div>
                                 <div className="text-[10px] text-gray-500 flex justify-between">
                                     <span>{formatBytes(item.totalBytes)}</span>
                                     <span className={item.state === 'completed' ? 'text-green-400' : 'text-blue-400'}>{item.state === 'completed' ? 'Concluído' : 'Baixando...'}</span>
                                 </div>
                                 {item.state === 'progressing' && (
                                     <div className="w-full h-1 bg-[#0f1223] rounded-full mt-1">
                                         <div className="h-full bg-blue-400" style={{ width: `${(item.receivedBytes / item.totalBytes) * 100}%` }} />
                                     </div>
                                 )}
                             </div>
                             {item.state === 'completed' && (
                                 <button onClick={() => window.api.openPath(item.path)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-white">
                                     <Folder size={14} />
                                 </button>
                             )}
                        </div>
                    ))
                )}
            </div>
            <button 
                onClick={() => { onOpenLibrary && onOpenLibrary('DOWNLOADS'); onClose(); }}
                className="w-full py-3 bg-[#0f1223] hover:bg-[#1e233c] text-xs font-bold text-gray-400 hover:text-white border-t border-white/5 transition-colors"
            >
                Ver Todos os Downloads
            </button>
        </div>
    );
};

const AddressBar = forwardRef<AddressBarRef, AddressBarProps>(({ 
  currentUrl, onSearch, onGoHome, loading, history = [], isBookmarked = false, onToggleBookmark, 
  bookmarks = [], onRemoveBookmark, onUpdateBookmark,
  downloads = [], onOpenLibrary, onOpenSettings, onBack, onForward, onReload, extensions
}, ref) => {
  const { handleContextMenu } = useContextMenu();
  const [inputVal, setInputVal] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [showBookmarkEditor, setShowBookmarkEditor] = useState(false);
  
  // POPUP STATE
  const [activePopup, setActivePopup] = useState<'none' | 'extensions' | 'bookmarks' | 'downloads' | 'notifications' | 'menu'>('none');

  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null); 

  useImperativeHandle(ref, () => ({
    focusInput: () => { inputRef.current?.focus(); inputRef.current?.select(); }
  }));

  useEffect(() => { 
    if (!isFocused) {
        if (currentUrl.startsWith('studyhub://search/')) {
            try {
                setInputVal(decodeURIComponent(currentUrl.replace('studyhub://search/', '')));
            } catch (e) {
                setInputVal(currentUrl.replace('studyhub://search/', ''));
            }
        } else if (currentUrl === 'studyhub://newtab') {
            setInputVal('');
        } else {
            setInputVal(currentUrl);
        }
    } 
  }, [currentUrl, isFocused]);

  const suggestions = useMemo(() => {
      if (!inputVal || !isFocused) return [];
      const lowerInput = inputVal.toLowerCase();
      const matches = history.filter(h => h.title.toLowerCase().includes(lowerInput) || h.url.toLowerCase().includes(lowerInput));
      const unique = new Map();
      matches.forEach(item => { if (!unique.has(item.url)) unique.set(item.url, item); });
      return Array.from(unique.values()).slice(0, 5);
  }, [inputVal, history, isFocused]);

  useEffect(() => { setShowSuggestions(suggestions.length > 0 && isFocused); }, [suggestions, isFocused]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
            setIsFocused(false);
        }
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('#mobile-menu-btn')) {
            setShowMobileMenu(false);
        }
        if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
            setActivePopup('none');
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        onSearch(suggestions[activeSuggestionIndex].url);
    } else {
        onSearch(inputVal);
    }
    inputRef.current?.blur();
    setShowSuggestions(false);
  };

  const handleExtensionClick = (ext: ExtensionItem, e: React.MouseEvent) => {
      if (window.api && ext.popup) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          window.api.openExtensionPopup(ext.id, ext.popup, { x: rect.right, y: rect.bottom });
      } else if (window.api) {
          window.api.openExtensionOptions(ext.id);
      }
  };

  const togglePopup = (popup: typeof activePopup) => {
      setActivePopup(prev => prev === popup ? 'none' : popup);
  };

  const handleInputContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      handleContextMenu(e, [
          { 
              label: 'Copiar', 
              icon: 'copy', 
              onClick: () => { 
                  if(inputRef.current) {
                      const sel = inputRef.current.value.substring(inputRef.current.selectionStart || 0, inputRef.current.selectionEnd || 0);
                      if(sel) navigator.clipboard.writeText(sel);
                  }
              } 
          },
          { 
              label: 'Colar', 
              icon: 'clipboard', 
              onClick: async () => {
                  try {
                      const text = await navigator.clipboard.readText();
                      if(text && inputRef.current) {
                          const start = inputRef.current.selectionStart || 0;
                          const end = inputRef.current.selectionEnd || 0;
                          const val = inputRef.current.value;
                          const newVal = val.substring(0, start) + text + val.substring(end);
                          setInputVal(newVal);
                          setTimeout(() => {
                              if(inputRef.current) {
                                  inputRef.current.selectionStart = inputRef.current.selectionEnd = start + text.length;
                                  inputRef.current.focus();
                              }
                          }, 0);
                      }
                  } catch (e) { console.error(e); }
              } 
          },
          { type: 'separator' },
          { 
              label: 'Selecionar Tudo', 
              onClick: () => { inputRef.current?.select(); } 
          }
      ]);
  };

  const isSecure = currentUrl.startsWith('https://') || currentUrl.startsWith('studyhub://');
  const isInternal = currentUrl === '' || !currentUrl.includes('.') || currentUrl.startsWith('studyhub://');

  const pinnedExtensions = extensions.filter(e => e.pinned);

  return (
    <div className="h-[50px] md:h-[44px] bg-[#0f1223] flex items-center px-2 gap-2 border-b border-blue-400/10 relative z-40 select-none transition-all">
      
      {/* Navigation Controls - HIDDEN ON MOBILE */}
      <div className="hidden md:flex items-center gap-1">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30"><Icon name="arrowLeft" size={16} /></button>
        <button onClick={onForward} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30"><Icon name="arrowRight" size={16} /></button>
        <button onClick={loading ? undefined : onReload} className={`w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all ${loading ? 'animate-spin' : ''}`}><Icon name="refresh" size={14} /></button>
        <button onClick={onGoHome} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all"><Icon name="home" size={16} /></button>
      </div>

      {/* MOBILE HOME BUTTON */}
      <button onClick={onGoHome} className="md:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white active:scale-95 transition-transform">
          <Icon name="home" size={20} />
      </button>

      {/* URL INPUT CONTAINER */}
      <div ref={containerRef} className="flex-1 max-w-3xl mx-auto relative group">
        <form onSubmit={handleSubmit} className={`relative flex items-center h-[36px] md:h-[32px] bg-[#0a0e27] border rounded-xl transition-all duration-200 ${isFocused ? 'border-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.15)]' : 'border-white/10'}`}>
          
          <div className="pl-3 pr-2 flex items-center justify-center" onClick={() => !isInternal && setShowSecurityInfo(!showSecurityInfo)}>
             {isInternal ? <Icon name="search" size={14} className="text-blue-400" /> : 
                isSecure ? <div className="text-green-400"><Lock size={12} /></div> : 
                <div className="text-red-400"><AlertTriangle size={12} /></div>}
          </div>

          {showSecurityInfo && <SecurityInfoPopup url={currentUrl} isSecure={isSecure} onClose={() => setShowSecurityInfo(false)} />}

          <input
            ref={inputRef} 
            type="text" 
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
            onContextMenu={handleInputContextMenu}
            className="flex-1 bg-transparent border-none outline-none text-sm md:text-xs text-gray-200 placeholder-gray-500 w-full"
            placeholder="Pesquisar..." 
            autoCapitalize="off"
            autoComplete="off"
          />
          
          {/* Bookmark Button inside input */}
          <div className="flex items-center px-2">
             <button type="button" onClick={() => { if(onToggleBookmark) onToggleBookmark(); setShowBookmarkEditor(!showBookmarkEditor); }} className={`p-1 ${isBookmarked ? 'text-yellow-400' : 'text-gray-600'}`}>
                 <Icon name="star" size={14} className={isBookmarked ? "fill-current" : ""} />
             </button>
             {showBookmarkEditor && isBookmarked && (
                 <CurrentBookmarkPopup 
                    url={currentUrl}
                    title={bookmarks.find(b => b.url === currentUrl)?.title || ''}
                    bookmarks={bookmarks}
                    onClose={() => setShowBookmarkEditor(false)}
                    onUpdate={(id, u) => onUpdateBookmark && onUpdateBookmark(id, u)}
                    onRemove={(id) => { if(onRemoveBookmark) onRemoveBookmark(id); setShowBookmarkEditor(false); }}
                 />
             )}
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-[42px] left-0 right-0 bg-[#14182d] border border-blue-400/20 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col py-2 animate-[fadeIn_0.1s_ease]">
                {suggestions.map((s, idx) => (
                    <button 
                        key={idx} 
                        className="flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        onMouseDown={(e) => { e.preventDefault(); onSearch(s.url); }}
                    >
                         <Icon name={s.type === 'search' ? 'search' : 'globe'} size={16} className="text-gray-500" />
                         <div className="flex-1 min-w-0">
                             <div className="text-sm text-gray-200 truncate">{s.title}</div>
                             <div className="text-[10px] text-blue-400 truncate">{s.url}</div>
                         </div>
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Desktop Extensions & Tools - HIDDEN ON MOBILE */}
      <div ref={controlsRef} className="hidden md:flex items-center gap-1 relative pl-2">
          
          {/* Pinned Extensions */}
          {pinnedExtensions.map(ext => (
              <button 
                key={ext.id}
                onClick={(e) => handleExtensionClick(ext, e)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all overflow-hidden"
                title={ext.title}
              >
                  {ext.icon ? (
                      <img src={`studyhub-ext://${ext.id}/${ext.icon}`} className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  ) : (
                      <span className="text-[10px] font-bold">{ext.title.charAt(0)}</span>
                  )}
              </button>
          ))}

          <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

          {/* Extensions Manager (Puzzle) */}
          <div className="relative">
              <button 
                id="extensions-trigger"
                onClick={() => togglePopup('extensions')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activePopup === 'extensions' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Extensões"
              >
                 <Icon name="puzzle" size={16} />
              </button>
              {activePopup === 'extensions' && (
                  <ExtensionsPopup 
                      extensions={extensions} 
                      onClose={() => setActivePopup('none')} 
                      onOpenLibrary={onOpenLibrary}
                  />
              )}
          </div>

          {/* Bookmarks Manager (Star) */}
          <div className="relative">
              <button 
                onClick={() => togglePopup('bookmarks')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activePopup === 'bookmarks' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Favoritos"
              >
                 <Icon name="library" size={16} />
              </button>
              {activePopup === 'bookmarks' && (
                  <BookmarksPopup 
                      bookmarks={bookmarks} 
                      onClose={() => setActivePopup('none')} 
                      onOpenLibrary={onOpenLibrary}
                      onRemove={onRemoveBookmark}
                      onUpdate={onUpdateBookmark}
                  />
              )}
          </div>

          {/* Downloads */}
          <div className="relative">
              <button 
                onClick={() => togglePopup('downloads')} 
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activePopup === 'downloads' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Downloads"
              >
                 <Icon name="download" size={16} />
              </button>
              {activePopup === 'downloads' && (
                  <DownloadsPopup 
                      downloads={downloads} 
                      onClose={() => setActivePopup('none')} 
                      onOpenLibrary={onOpenLibrary}
                  />
              )}
          </div>

          {/* NOTIFICATION BELL (SYSTEM ALERTS) */}
          <div className="relative">
              <button 
                onClick={() => togglePopup('notifications')} 
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all relative ${activePopup === 'notifications' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Avisos do Sistema"
              >
                 <Icon name="bell" size={16} />
                 {/* <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-[#0f1223]"></span> */}
              </button>
              {activePopup === 'notifications' && (
                  <NotificationsPopup onClose={() => setActivePopup('none')} />
              )}
          </div>

          {/* Settings */}
          <button 
            onClick={onOpenSettings} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            title="Configurações"
          >
             <Icon name="settings" size={16} />
          </button>
      </div>

      {/* Mobile Menu Button */}
      <button 
        id="mobile-menu-btn"
        onClick={() => setShowMobileMenu(!showMobileMenu)} 
        className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${showMobileMenu ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
      >
          <Icon name={showMobileMenu ? "x" : "menu"} size={20} />
      </button>

      {/* MOBILE EXPANDABLE MENU */}
      {showMobileMenu && (
          <div 
            ref={mobileMenuRef}
            className="absolute top-[55px] right-2 left-2 bg-[#14182d] border border-blue-400/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[200] overflow-hidden animate-[slideUp_0.2s_ease] flex flex-col md:hidden"
          >
              <div className="p-4 grid grid-cols-4 gap-4 border-b border-white/5 bg-[#0f1223]">
                  <button onClick={onBack} className="flex flex-col items-center gap-1 text-gray-400 active:text-white">
                      <div className="p-2 bg-white/5 rounded-full"><Icon name="arrowLeft" size={20} /></div>
                      <span className="text-[10px]">Voltar</span>
                  </button>
                  <button onClick={onForward} className="flex flex-col items-center gap-1 text-gray-400 active:text-white">
                      <div className="p-2 bg-white/5 rounded-full"><Icon name="arrowRight" size={20} /></div>
                      <span className="text-[10px]">Avançar</span>
                  </button>
                  <button onClick={onReload} className="flex flex-col items-center gap-1 text-gray-400 active:text-white">
                      <div className="p-2 bg-white/5 rounded-full"><Icon name="refresh" size={20} /></div>
                      <span className="text-[10px]">Recarregar</span>
                  </button>
                  <button onClick={() => { if(onToggleBookmark) onToggleBookmark(); setShowMobileMenu(false); }} className={`flex flex-col items-center gap-1 ${isBookmarked ? 'text-yellow-400' : 'text-gray-400'} active:text-white`}>
                      <div className={`p-2 bg-white/5 rounded-full ${isBookmarked ? 'bg-yellow-500/20' : ''}`}><Icon name="star" size={20} className={isBookmarked ? 'fill-current' : ''} /></div>
                      <span className="text-[10px]">Favoritar</span>
                  </button>
              </div>

              <div className="py-2">
                  <MenuLink icon="bell" label="Avisos do Sistema" onClick={() => { togglePopup('notifications'); setShowMobileMenu(false); }} />
                  <MenuLink icon="download" label="Downloads" onClick={() => { onOpenLibrary && onOpenLibrary('DOWNLOADS'); setShowMobileMenu(false); }} />
                  <MenuLink icon="clock" label="Histórico" onClick={() => { onOpenLibrary && onOpenLibrary('HISTORY'); setShowMobileMenu(false); }} />
                  <MenuLink icon="star" label="Favoritos" onClick={() => { onOpenLibrary && onOpenLibrary('BOOKMARKS'); setShowMobileMenu(false); }} />
                  <MenuLink icon="puzzle" label="Extensões" onClick={() => { onOpenLibrary && onOpenLibrary('EXTENSIONS'); setShowMobileMenu(false); }} />
                  <div className="h-[1px] bg-white/5 my-1 mx-4"></div>
                  <MenuLink icon="settings" label="Configurações" onClick={() => { onOpenSettings && onOpenSettings(); setShowMobileMenu(false); }} />
              </div>
          </div>
      )}

    </div>
  );
});

const MenuLink = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-6 py-3 text-gray-200 hover:bg-white/5 active:bg-white/10 text-sm font-medium transition-colors">
        <Icon name={icon} size={18} className="text-gray-400" />
        {label}
    </button>
);

export default AddressBar;
