
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Sidebar from './components/shell/Sidebar';
import AddressBar, { AddressBarRef } from './components/shell/AddressBar';
import TabBar from './components/shell/TabBar';
import MobileNavBar from './components/shell/MobileNavBar'; 
import NewTab from './components/views/NewTab';
import BrowserView from './components/views/BrowserView';
import FloatingToDo from './components/tools/FloatingToDo';
import LibraryView from './components/views/LibraryView';
import TaskView from './components/views/TaskView';
import WeeklySchedule from './components/views/WeeklySchedule';
import SettingsView from './components/views/SettingsView';
import NotesView from './components/views/NotesView'; 
import SearchView from './components/views/SearchView';
import FlashcardView from './components/Flashcards/FlashcardView'; 
import MindMapView from './components/views/MindMapView';
import DocumentsView from './components/views/DocumentsView';
import { ViewState, Tab, HistoryEntry, DownloadItem, BookmarkItem, ClosedTab, UserSettings, HistoryInterval } from './types';
import type { PermissionRequest, ExtensionItem, UpdateInfo } from './electron';
import { Icon } from './components/ui/Icon';
import { TaskProvider, useTasks } from './contexts/TaskContext';
import { RoutineProvider } from './contexts/RoutineContext';
import { NotesProvider } from './contexts/NotesContext';
import { FlashcardProvider } from './contexts/FlashcardContext'; 
import { VisionBoardProvider, useVisionBoard } from './contexts/VisionBoardContext';
import { MindMapProvider } from './contexts/MindMapContext';
import { DocumentProvider, useDocument } from './contexts/DocumentContext';

// OVERLAY IMPORTS
import { OverlayProvider, useOverlay } from './contexts/OverlayContext';
import UniversalOverlay from './components/overlay/UniversalOverlay';
import OverlayTrigger from './components/overlay/OverlayTrigger';

// CONTEXT MENU
import { ContextMenuProvider } from './contexts/ContextMenuContext';
import UiContextMenu from './components/ui/UiContextMenu';

// FEEDBACK
import ErrorBoundary from './components/feedback/ErrorBoundary';

function useAsyncStorage<T>(key: string, value: T, setValue: React.Dispatch<React.SetStateAction<T>>, delay: number = 1000) {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        async function load() {
            if (window.api) {
                const fromDisk = await window.api.storage.get<T>(key);
                if (fromDisk) setValue(fromDisk);
                else {
                    const local = localStorage.getItem(`study-hub-${key}`);
                    if (local) {
                        try {
                            const parsed = JSON.parse(local);
                            setValue(parsed);
                            window.api.storage.set(key, parsed);
                            localStorage.removeItem(`study-hub-${key}`);
                        } catch (e) { console.error(e); }
                    }
                }
                setIsLoaded(true);
            }
        }
        load();
    }, [key, setValue]);

    useEffect(() => {
        if (isLoaded && window.api) {
            const handler = setTimeout(() => {
                window.api.storage.set(key, value);
            }, delay);
            return () => clearTimeout(handler);
        }
    }, [value, key, delay, isLoaded]);

    useEffect(() => {
        if (window.api && window.api.onStorageUpdated) {
             const remove = window.api.onStorageUpdated((updatedKey: string, updatedValue: any) => {
                 if (updatedKey === key) setValue(updatedValue);
             });
             return () => remove();
        }
    }, [key, setValue]);
    return isLoaded;
}

interface CursorGlowProps {
    color: string;
    size: number;
    opacity: number;
    enabled: boolean;
}

const CursorGlow: React.FC<CursorGlowProps> = ({ color, size, opacity, enabled }) => {
  const glowRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || window.innerWidth < 768) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (requestRef.current) return;
      requestRef.current = requestAnimationFrame(() => {
        if (glowRef.current) glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        requestRef.current = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div 
      ref={glowRef}
      className="fixed pointer-events-none z-[9999] transition-opacity duration-300 mix-blend-screen hidden md:block"
      style={{
        top: 0, left: 0,
        transform: 'translate(-200px, -200px)', 
        width: `${size}px`, height: `${size}px`, 
        borderRadius: '50%',
        marginTop: `-${size/2}px`, marginLeft: `-${size/2}px`,
        background: `radial-gradient(circle, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
        willChange: 'transform' 
      }}
    />
  );
};

const PermissionDialog = ({ req, onRespond }: { req: PermissionRequest, onRespond: (allow: boolean) => void }) => {
    const getLabel = (p: string) => {
        if (p === 'media') return 'usar sua Câmera e Microfone';
        if (p === 'geolocation') return 'saber sua Localização';
        if (p === 'notifications') return 'enviar Notificações';
        return `acessar: ${p}`;
    };
    const domain = (() => { try { return new URL(req.url).hostname; } catch { return req.url; } })();
    return (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.2s_ease] p-4">
            <div className="bg-[#14182d] border border-blue-400/30 rounded-2xl p-6 w-full max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4 animate-pulse">
                     {req.permission === 'media' ? <Icon name="video" size={32} /> : 
                      req.permission === 'geolocation' ? <Icon name="mapPin" size={32} /> : 
                      <Icon name="shield" size={32} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Permissão Solicitada</h3>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                    O site <span className="text-blue-400 font-semibold">{domain}</span> deseja {getLabel(req.permission)}.
                </p>
                <div className="flex gap-3 w-full">
                    <button onClick={() => onRespond(false)} className="flex-1 py-3 bg-[#1e233c] hover:bg-[#252b48] border border-white/10 text-gray-300 rounded-xl font-bold transition-all">Bloquear</button>
                    <button onClick={() => onRespond(true)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">Permitir</button>
                </div>
            </div>
        </div>
    );
};

// --- UPDATE TOAST ---
const UpdateToast = ({ version, onRestart, onDismiss }: { version: string, onRestart: () => void, onDismiss: () => void }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[10000] w-[350px] bg-[#14182d] border border-blue-500/50 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-[slideInRight_0.3s_ease] backdrop-blur-xl">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 animate-pulse">
                    <Icon name="zap" size={24} />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">Nova Versão Disponível 🚀</h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                        A versão <span className="text-blue-400 font-mono font-bold">{version}</span> foi baixada. Reinicie para aplicar as melhorias.
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={onRestart}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
                        >
                            Reiniciar Agora
                        </button>
                        <button 
                            onClick={onDismiss}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-lg transition-all"
                        >
                            Depois
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WidgetLayer = ({ onOpenTasks }: { onOpenTasks: () => void }) => {
    const { showToDoWidget, setShowToDoWidget } = useTasks();
    if (!showToDoWidget) return null;
    return <FloatingToDo onOpenFullView={onOpenTasks} onClose={() => setShowToDoWidget(false)} />;
};

const getSearchUrl = (query: string, engine: string) => {
    const q = encodeURIComponent(query);
    switch (engine) {
        case 'bing': return `https://www.bing.com/search?q=${q}`;
        case 'yahoo': return `https://search.yahoo.com/search?p=${q}`;
        case 'duckduckgo': return `https://duckduckgo.com/?q=${q}`;
        case 'google': default: return `https://www.google.com/search?q=${q}`;
    }
};

const DEFAULT_SETTINGS: UserSettings = { 
    theme: 'default', 
    searchEngine: 'google', 
    historyClearInterval: 'NEVER',
    fontFamily: 'Inter',
    textSize: 'medium',
    animations: { enabled: true, speed: 'normal' },
    cursorGlow: { enabled: true, color: '#3b82f6', size: 180, opacity: 0.15 }
};

// Componente Wrapper para detectar contexto e passar para o Overlay
const AppContent: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', title: 'Nova Aba', url: 'studyhub://newtab', isActive: true, viewState: ViewState.NEW_TAB }]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [closedTabs, setClosedTabs] = useState<ClosedTab[]>([]);
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [permissionReq, setPermissionReq] = useState<PermissionRequest | null>(null);

  // UPDATE STATE
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateReady, setUpdateReady] = useState<UpdateInfo | null>(null);

  const { setIsEditing: setVisionBoardEditing } = useVisionBoard();
  const { setContextKey } = useOverlay(); 
  
  // Hook do DocumentContext 
  const { activeDoc } = useDocument();

  useAsyncStorage('history', history, setHistory, 2000);
  useAsyncStorage('bookmarks', bookmarks, setBookmarks);
  useAsyncStorage('settings', userSettings, setUserSettings);

  // --- UPDATER LOGIC ---
  useEffect(() => {
      if (window.api) {
          const rm1 = window.api.onUpdateAvailable(() => setIsDownloadingUpdate(true));
          const rm2 = window.api.onUpdateDownloaded((info) => {
              setIsDownloadingUpdate(false);
              setUpdateReady(info);
          });
          
          return () => { rm1(); rm2(); };
      }
  }, []);

  // --- APLICAÇÃO DE ESTILOS GLOBAIS ---
  useEffect(() => {
      const root = document.documentElement;
      
      // Fonte
      root.style.setProperty('--font-primary', userSettings.fontFamily || 'Inter');
      
      // Tamanho do Texto (base para rem)
      let baseSize = '16px';
      if (userSettings.textSize === 'small') baseSize = '14px';
      if (userSettings.textSize === 'large') baseSize = '18px';
      if (userSettings.textSize === 'xlarge') baseSize = '20px';
      root.style.fontSize = baseSize;

      if (!userSettings.animations?.enabled) {
          root.style.setProperty('--transition-duration-multiplier', '0');
          const style = document.createElement('style');
          style.id = 'disable-animations';
          style.innerHTML = `*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }`;
          if (!document.getElementById('disable-animations')) document.head.appendChild(style);
      } else {
          root.style.setProperty('--transition-duration-multiplier', '1');
          const style = document.getElementById('disable-animations');
          if (style) style.remove();
      }

  }, [userSettings]);

  const activeTabId = tabs.find(t => t.isActive)?.id || tabs[0].id;
  const activeTab = tabs.find(t => t.id === activeTabId);
  const addressBarRef = useRef<AddressBarRef>(null);

  useEffect(() => {
      if (!activeTab) return;

      let key = '';
      if (activeTab.viewState === ViewState.BROWSER) {
          key = `web_${btoa(activeTab.url)}`;
      } else if (activeTab.viewState === ViewState.DOCUMENTS) {
          if (activeDoc) {
              key = `doc_${activeDoc.id}_pg${activeDoc.currentPage}`;
          } else {
              key = `view_DOCUMENTS_LIBRARY`;
          }
      } else {
          key = `view_${activeTab.viewState}`;
      }
      
      setContextKey(key);
      setVisionBoardEditing(false);

  }, [activeTab, activeDoc?.id, activeDoc?.currentPage, setContextKey, setVisionBoardEditing]);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
      const fetchExts = async () => {
          if (window.api) {
              const exts = await window.api.getInstalledExtensions();
              setExtensions(exts);
          }
      };
      fetchExts();
      
      if (window.api) {
          const remove = window.api.onExtensionStatus(() => fetchExts());
          return () => remove();
      }
  }, []);

  useEffect(() => {
      if (window.api) {
          const remove = window.api.onPermissionRequest((req) => setPermissionReq(req));
          return () => remove();
      }
  }, []);

  const respondToPermission = (allow: boolean) => {
      if (permissionReq && window.api) {
          window.api.respondToPermission(permissionReq.id, allow);
          setPermissionReq(null);
      }
  };

  useEffect(() => {
      if (window.api) {
          const handleDownload = (item: Partial<DownloadItem>) => {
              setDownloads(prev => {
                  const exists = prev.find(d => d.id === item.id);
                  if (exists) return prev.map(d => d.id === item.id ? { ...d, ...item } : d);
                  return [...prev, item as DownloadItem];
              });
          };

          const rm1 = window.api.onDownloadStarted((item) => handleDownload(item));
          const rm2 = window.api.onDownloadUpdated((item) => handleDownload(item));
          const rm3 = window.api.onDownloadComplete((item) => handleDownload(item));

          return () => { rm1(); rm2(); rm3(); };
      }
  }, []);

  const handleSwitchTab = (id: string) => {
      setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
  };

  const handleNewTab = (url?: string, inBackground: boolean = false) => {
      const newTab: Tab = {
          id: Date.now().toString(),
          title: 'Nova Aba',
          url: url || 'studyhub://newtab',
          isActive: !inBackground,
          viewState: url ? ViewState.BROWSER : ViewState.NEW_TAB
      };
      
      setTabs(prev => {
          const updated = prev.map(t => inBackground ? t : ({ ...t, isActive: false }));
          return [...updated, newTab];
      });
  };

  const handleCloseTab = (id: string) => {
      const tabToClose = tabs.find(t => t.id === id);
      if (tabToClose) {
          setClosedTabs(prev => [...prev, { 
              id: tabToClose.id, 
              title: tabToClose.title, 
              url: tabToClose.url, 
              viewState: tabToClose.viewState, 
              closedAt: Date.now() 
          }]);
      }

      setTabs(prev => {
          if (prev.length === 1) return prev;
          const newTabs = prev.filter(t => t.id !== id);
          if (tabToClose?.isActive) {
             const index = prev.findIndex(t => t.id === id);
             const nextActive = newTabs[index - 1] || newTabs[index] || newTabs[0];
             if (nextActive) nextActive.isActive = true;
          }
          return newTabs;
      });
  };

  const handleUpdateTab = (id: string, updates: Partial<Tab>) => {
      setTabs(prev => prev.map(t => {
          if (t.id !== id) return t;
          
          let newViewState = t.viewState;
          if (updates.url) {
              if (updates.url.startsWith('studyhub://newtab')) newViewState = ViewState.NEW_TAB;
              else if (updates.url.startsWith('studyhub://tasks')) newViewState = ViewState.TASKS;
              else if (updates.url.startsWith('studyhub://schedule')) newViewState = ViewState.SCHEDULE;
              else if (updates.url.startsWith('studyhub://library')) newViewState = ViewState.LIBRARY;
              else if (updates.url.startsWith('studyhub://notes')) newViewState = ViewState.NOTES;
              else if (updates.url.startsWith('studyhub://flashcards')) newViewState = ViewState.FLASHCARDS; 
              else if (updates.url.startsWith('studyhub://mindmap')) newViewState = ViewState.MINDMAP;
              else if (updates.url.startsWith('studyhub://documents')) newViewState = ViewState.DOCUMENTS;
              else if (updates.url.startsWith('studyhub://settings')) newViewState = ViewState.SETTINGS;
              else if (updates.url.startsWith('studyhub://search')) newViewState = ViewState.SEARCH;
              else newViewState = ViewState.BROWSER;
          }

          return { ...t, ...updates, viewState: newViewState };
      }));
  };
  
  const handleReorderTabs = (newTabs: Tab[]) => {
      setTabs(newTabs);
  };

  const navigateActiveTab = (input: string) => {
      let url = input;
      
      if (input.startsWith('studyhub://')) {
          if (input.startsWith('studyhub://search/')) {
              try {
                  const query = decodeURIComponent(input.replace('studyhub://search/', ''));
                  url = getSearchUrl(query, userSettings.searchEngine);
              } catch (e) {
                  url = getSearchUrl(input, userSettings.searchEngine);
              }
          } else {
              handleUpdateTab(activeTabId, { url: input });
              return;
          }
      }
      else if (/^(https?:\/\/)/i.test(input) || input.startsWith('file://') || input.startsWith('chrome://')) {
          handleUpdateTab(activeTabId, { url: input });
          return;
      }
      else if (input.includes('.') && !input.includes(' ')) {
           handleUpdateTab(activeTabId, { url: `https://${input}` });
           return;
      }
      else {
          url = getSearchUrl(input, userSettings.searchEngine);
      }

      handleUpdateTab(activeTabId, { url });
  };

  const switchView = (view: ViewState) => {
      let url = 'studyhub://newtab';
      switch(view) {
          case ViewState.TASKS: url = 'studyhub://tasks'; break;
          case ViewState.SCHEDULE: url = 'studyhub://schedule'; break;
          case ViewState.LIBRARY: url = 'studyhub://library'; break;
          case ViewState.NOTES: url = 'studyhub://notes'; break;
          case ViewState.FLASHCARDS: url = 'studyhub://flashcards'; break;
          case ViewState.MINDMAP: url = 'studyhub://mindmap'; break;
          case ViewState.DOCUMENTS: url = 'studyhub://documents'; break;
          case ViewState.SETTINGS: url = 'studyhub://settings'; break;
          case ViewState.SEARCH: url = 'studyhub://search'; break;
          case ViewState.BROWSER: url = activeTab?.url && !activeTab.url.startsWith('studyhub://') ? activeTab.url : 'https://google.com'; break;
      }
      handleUpdateTab(activeTabId, { url });
  };

  const handleAddToHistory = (url: string, title: string) => {
      if (url.startsWith('studyhub://')) return;
      
      const isSearch = url.includes('search') || url.includes('q=');
      const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
      
      const type: 'image' | 'search' | 'link' = isImage ? 'image' : isSearch ? 'search' : 'link';

      setHistory(prev => [
          { 
            url, title, timestamp: Date.now(), 
            type
          }, 
          ...prev.filter(h => h.url !== url)
      ].slice(0, 5000));
  };

  const toggleBookmark = () => {
      if (!activeTab) return;
      const url = activeTab.url;
      const exists = bookmarks.find(b => b.url === url);
      
      if (exists) {
          setBookmarks(prev => prev.filter(b => b.url !== url));
      } else {
          setBookmarks(prev => [...prev, { id: Date.now().toString(), url, title: activeTab.title, createdAt: Date.now() }]);
      }
  };

  return (
    <div 
        className={`flex h-screen w-screen overflow-hidden text-sm transition-colors duration-300 ${userSettings.theme === 'ocean' ? 'bg-slate-900' : userSettings.theme === 'midnight' ? 'bg-black' : userSettings.theme === 'forest' ? 'bg-green-950' : userSettings.theme === 'sunset' ? 'bg-rose-950' : 'bg-[#0a0e27]'}`}
        style={{ fontFamily: userSettings.fontFamily || 'Inter' }}
    >
      <CursorGlow 
        color={userSettings.cursorGlow?.color || '#3b82f6'} 
        size={userSettings.cursorGlow?.size || 180} 
        opacity={userSettings.cursorGlow?.opacity || 0.15} 
        enabled={userSettings.cursorGlow?.enabled !== false} 
      />
      <UiContextMenu />
      
      {permissionReq && <PermissionDialog req={permissionReq} onRespond={respondToPermission} />}
      
      {updateReady && (
          <UpdateToast 
              version={updateReady.version} 
              onRestart={() => window.api.restartAndInstall()} 
              onDismiss={() => setUpdateReady(null)} 
          />
      )}

      <div className="hidden md:flex">
        <Sidebar 
            activeView={activeTab?.viewState || ViewState.NEW_TAB}
            onHome={() => switchView(ViewState.NEW_TAB)}
            onTasks={() => switchView(ViewState.TASKS)}
            onSchedule={() => switchView(ViewState.SCHEDULE)}
            onLibrary={() => switchView(ViewState.LIBRARY)}
            onNotes={() => switchView(ViewState.NOTES)}
            onFlashcards={() => switchView(ViewState.FLASHCARDS)}
            onMindMap={() => switchView(ViewState.MINDMAP)}
            onDocuments={() => switchView(ViewState.DOCUMENTS)}
            onSettings={() => switchView(ViewState.SETTINGS)}
            isDownloadingUpdate={isDownloadingUpdate}
        />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 relative ${userSettings.theme === 'ocean' ? 'bg-slate-900' : userSettings.theme === 'midnight' ? 'bg-black' : userSettings.theme === 'forest' ? 'bg-green-950' : userSettings.theme === 'sunset' ? 'bg-rose-950' : 'bg-[#0a0e27]'}`}>
        
        <div className="hidden md:flex">
            <TabBar 
            tabs={tabs} 
            onSwitch={handleSwitchTab} 
            onClose={handleCloseTab} 
            onNewTab={(url) => handleNewTab(url)} 
            onUpdateTab={(id, url) => handleUpdateTab(id, { url })}
            onReorderTabs={handleReorderTabs}
            />
        </div>
        
        <AddressBar 
          ref={addressBarRef}
          currentUrl={activeTab?.url || ''} 
          onSearch={navigateActiveTab}
          onGoHome={() => handleUpdateTab(activeTabId, { url: 'studyhub://newtab' })}
          loading={false}
          history={history}
          isBookmarked={bookmarks.some(b => b.url === activeTab?.url)}
          onToggleBookmark={toggleBookmark}
          bookmarks={bookmarks}
          onRemoveBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
          onUpdateBookmark={(id, updates) => setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))}
          downloads={downloads}
          extensions={extensions}
          onOpenLibrary={(section) => {
              handleUpdateTab(activeTabId, { url: 'studyhub://library' });
          }}
          onOpenSettings={() => switchView(ViewState.SETTINGS)}
          onBack={() => {
              const wv = document.querySelector('webview') as any;
              if (wv && wv.canGoBack()) wv.goBack();
          }}
          onForward={() => {
              const wv = document.querySelector('webview') as any;
              if (wv && wv.canGoForward()) wv.goForward();
          }}
          onReload={() => {
              const wv = document.querySelector('webview') as any;
              if (wv) wv.reload();
          }}
        />

        <div className={`flex-1 relative overflow-hidden flex flex-col mb-[65px] md:mb-0 ${userSettings.theme === 'ocean' ? 'bg-slate-900' : userSettings.theme === 'midnight' ? 'bg-black' : userSettings.theme === 'forest' ? 'bg-green-950' : userSettings.theme === 'sunset' ? 'bg-rose-950' : 'bg-[#0a0e27]'}`}>
          
          {/* CAMADA DE OVERLAY GLOBAL */}
          <UniversalOverlay />
          
          <ErrorBoundary>
            {activeTab?.viewState === ViewState.NEW_TAB && (
               <NewTab 
                  onSearch={navigateActiveTab} 
                  onOpenTaskView={() => switchView(ViewState.TASKS)}
                  bookmarks={bookmarks}
                  onNavigate={navigateActiveTab}
                  onAddBookmark={(url, title) => setBookmarks(prev => [...prev, { id: Date.now().toString(), url, title, createdAt: Date.now() }])}
                  onRemoveBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
                  onUpdateBookmark={(id, updates) => setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))}
               />
            )}
            
            {activeTab?.viewState === ViewState.BROWSER && (
               <BrowserView 
                  url={activeTab.url} 
                  tabId={activeTab.id}
                  preloadPath={window.api ? '' : ''} 
                  initialScrollY={activeTab.scrollPosition}
                  onUpdateTab={handleUpdateTab}
                  onOpenNewTab={handleNewTab}
                  onAddToHistory={handleAddToHistory}
                  onToggleBookmark={toggleBookmark}
               />
            )}

            {activeTab?.viewState === ViewState.TASKS && (
               <TaskView onOpenSchedule={() => switchView(ViewState.SCHEDULE)} />
            )}
            
            {activeTab?.viewState === ViewState.SCHEDULE && (
               <WeeklySchedule />
            )}

            {activeTab?.viewState === ViewState.LIBRARY && (
               <LibraryView 
                  history={history} 
                  bookmarks={bookmarks}
                  downloads={downloads}
                  extensions={extensions}
                  onClearHistory={() => setHistory([])}
                  onRemoveBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
                  onUpdateBookmark={(id, updates) => setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))}
                  onNavigate={navigateActiveTab}
                  onRemoveHistoryItem={(ts) => setHistory(prev => prev.filter(h => h.timestamp !== ts))}
               />
            )}

            {activeTab?.viewState === ViewState.NOTES && (
               <NotesView />
            )}

            {activeTab?.viewState === ViewState.FLASHCARDS && (
               <FlashcardView />
            )}

            {activeTab?.viewState === ViewState.MINDMAP && (
               <MindMapView />
            )}

            {activeTab?.viewState === ViewState.DOCUMENTS && (
               <DocumentsView />
            )}

            {activeTab?.viewState === ViewState.SETTINGS && (
               <SettingsView 
                  settings={userSettings} 
                  onUpdateSettings={(newS) => setUserSettings(prev => ({ ...prev, ...newS }))}
               />
            )}
            
            {activeTab?.viewState === ViewState.SEARCH && (
                <SearchView 
                    query={decodeURIComponent(activeTab.url.replace('studyhub://search/', ''))} 
                    onNavigate={navigateActiveTab}
                    searchEngine={userSettings.searchEngine}
                />
            )}
          </ErrorBoundary>
        </div>
      </div>
      
      {/* Overlay Trigger Button (Floating) */}
      <OverlayTrigger />

      {/* Floating Widget (Optional) */}
      <WidgetLayer onOpenTasks={() => switchView(ViewState.TASKS)} />
      
      {/* Mobile Nav */}
      <MobileNavBar 
        activeView={activeTab?.viewState || ViewState.NEW_TAB} 
        onNavigate={switchView}
        onToggleMenu={() => {}}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <OverlayProvider>
      <ContextMenuProvider>
        <VisionBoardProvider>
          <TaskProvider>
            <RoutineProvider>
              <NotesProvider>
                <FlashcardProvider>
                  <MindMapProvider>
                    <DocumentProvider>
                      <AppContent />
                    </DocumentProvider>
                  </MindMapProvider>
                </FlashcardProvider>
              </NotesProvider>
            </RoutineProvider>
          </TaskProvider>
        </VisionBoardProvider>
      </ContextMenuProvider>
    </OverlayProvider>
  );
};

export default App;
