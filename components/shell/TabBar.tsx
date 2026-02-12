
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { Tab, ViewState } from '../../types';
import WindowControls from './WindowControls';
import { useContextMenu } from '../../hooks/useContextMenu';

interface TabBarProps {
  tabs: Tab[];
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: (url?: string) => void;
  onUpdateTab?: (id: string, url: string) => void;
  onReorderTabs: (tabs: Tab[]) => void;
}

// Helper para obter o caminho correto da logo
const getLogoPath = () => {
  return 'logo.svg';
};

// Componente para logo com fallback
const LogoIcon = ({ size = 14 }: { size?: number }) => {
  const [logoError, setLogoError] = useState(false);
  const logoPath = getLogoPath();
  
  if (logoError) {
    return <Icon name="home" size={size} />;
  }
  
  return (
    <img 
      src={logoPath} 
      alt="Logo" 
      className={`w-${Math.round(size * 0.25)} h-${Math.round(size * 0.25)} object-contain`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onError={() => setLogoError(true)}
    />
  );
};

const TabBar: React.FC<TabBarProps> = ({ tabs, onSwitch, onClose, onNewTab, onUpdateTab, onReorderTabs }) => {
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [isExternalDrag, setIsExternalDrag] = useState(false);

  const { handleContextMenu } = useContextMenu();

  // Detecta arrasto global para destravar a UI no Electron
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      if (draggingTabId) return; 

      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.length > 0) {
        setIsExternalDrag(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      dragCounter--;
      if (dragCounter === 0) {
        setIsExternalDrag(false);
        setIsDragOverContainer(false);
      }
    };

    const handleWindowDrop = () => {
      dragCounter = 0;
      setIsExternalDrag(false);
      setIsDragOverContainer(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [draggingTabId]);


  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    e.stopPropagation();
    setDraggingTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/studyhub-tab-id', tabId);

    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleTabDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation(); 

    if (!draggingTabId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.x + rect.width / 2;

    const newIndex = e.clientX > midpoint ? index + 1 : index;
    setDropIndicatorIndex(newIndex);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverContainer(false);
    setIsExternalDrag(false);

    const droppedTabId = e.dataTransfer.getData('application/studyhub-tab-id');

    if (droppedTabId && dropIndicatorIndex !== null) {
      const oldIndex = tabs.findIndex(t => t.id === droppedTabId);
      if (oldIndex === -1) return resetDragState();

      let newIndex = dropIndicatorIndex;
      if (oldIndex < newIndex) newIndex -= 1;

      if (oldIndex !== newIndex) {
        const newTabs = [...tabs];
        const [movedTab] = newTabs.splice(oldIndex, 1);
        newTabs.splice(newIndex, 0, movedTab);
        onReorderTabs(newTabs);
      }
      resetDragState();
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // @ts-ignore
      const filePath = file.path;
      if (filePath) {
        onNewTab(filePath);
        resetDragState();
        return;
      }
    }

    const text = e.dataTransfer.getData('text/plain');
    const uriList = e.dataTransfer.getData('text/uri-list');
    let url = uriList || text;

    if (url) {
      url = url.split('\n')[0].trim();
      if (url) onNewTab(url);
    }

    resetDragState();
  };

  const resetDragState = () => {
    setDraggingTabId(null);
    setDropIndicatorIndex(null);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingTabId) {
      setDropIndicatorIndex(tabs.length);
      return;
    }
    if (!isDragOverContainer) setIsDragOverContainer(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, tabId: string) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value;
      if (val.trim() && onUpdateTab) {
        onUpdateTab(tabId, val);
        e.currentTarget.blur();
      }
    }
  };

  // --- CONTEXT MENU HANDLER ---
  const onTabContextMenu = (e: React.MouseEvent, tab: Tab) => {
    const webview = document.querySelector('webview') as any;
    
    handleContextMenu(e, [
      { 
        label: 'Recarregar', 
        icon: 'refreshCcw', 
        onClick: () => {
          if (tab.isActive && webview) {
             webview.reload();
          } else {
             // Se não é a ativa, apenas recarrega "logicamente" (no next update)
             if(onUpdateTab) onUpdateTab(tab.id, tab.url);
          }
        }
      },
      { 
        label: 'Duplicar Aba', 
        icon: 'copyPlus', 
        onClick: () => onNewTab(tab.url) 
      },
      { type: 'separator' },
      { 
        label: 'Fechar Aba', 
        icon: 'x', 
        shortcut: 'Ctrl+W',
        onClick: () => onClose(tab.id) 
      },
      { 
        label: 'Fechar Outras Abas', 
        icon: 'minusCircle', 
        onClick: () => {
          tabs.forEach(t => {
            if (t.id !== tab.id) onClose(t.id);
          });
        } 
      },
      { type: 'separator' },
      {
        label: 'Mover para Nova Janela',
        icon: 'appWindow',
        onClick: () => {
           if (window.api) window.api.openNewWindow(tab.url);
           onClose(tab.id);
        }
      }
    ]);
  };

  return (
    <>
      <div
        className="flex items-start h-[44px] bg-[#0f1223] select-none w-full overflow-hidden relative z-50 pt-2"
        style={{
          WebkitAppRegion: (isExternalDrag || draggingTabId) ? 'no-drag' : 'drag'
        } as any}
        onDragOver={handleContainerDragOver}
        onDrop={handleDrop}
      >
        {isExternalDrag && !draggingTabId && (
          <div className="absolute inset-0 bg-blue-500/20 z-[60] flex items-center justify-center border-2 border-blue-400 border-dashed m-1 rounded-lg pointer-events-none animate-pulse backdrop-blur-sm">
            <div className="bg-[#0f1223] px-4 py-2 rounded-full border border-blue-400/50 text-blue-400 text-sm font-bold shadow-xl flex items-center gap-2">
              <Icon name="plus" size={16} /> Solte para abrir
            </div>
          </div>
        )}

        <div
          className="flex-1 flex items-end gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide pl-2 h-full pb-0 relative"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              {dropIndicatorIndex === index && draggingTabId && (
                <div className="w-[2px] h-[24px] bg-blue-400 shadow-[0_0_8px_#60a5fa] rounded-full mx-0.5 animate-pulse shrink-0 transition-all mb-1" />
              )}

              <div
                draggable={true}
                onDragStart={(e) => handleTabDragStart(e, tab.id)}
                onDragOver={(e) => handleTabDragOver(e, index)}
                onClick={() => onSwitch(tab.id)}
                onContextMenu={(e) => onTabContextMenu(e, tab)}
                onAuxClick={(e) => { if (e.button === 1) onClose(tab.id); }}
                className={`
                    group relative h-[36px] min-w-[140px] max-w-[200px] flex-1 rounded-t-lg px-3 flex items-center gap-2 cursor-default transition-all duration-200 border-t border-x overflow-hidden
                    ${tab.isActive
                    ? 'bg-[#1e233c] border-blue-400/20 z-30'
                    : 'bg-transparent border-transparent hover:bg-[#1e233c]/50 hover:border-white/5 text-gray-500 hover:text-gray-300 hover:z-20'
                  }
                    ${draggingTabId === tab.id ? 'opacity-40 grayscale' : ''}
                  `}
                style={{
                  WebkitUserDrag: 'element'
                } as any}
                title={tab.title}
              >
                <span className={`shrink-0 pointer-events-none flex items-center ${tab.isActive ? 'text-blue-400' : 'opacity-70'}`}>
                  {tab.viewState === ViewState.NEW_TAB && <LogoIcon size={14} />}
                  {tab.viewState === ViewState.BROWSER && <Icon name="search" size={14} />}
                  {tab.viewState === ViewState.LIBRARY && <Icon name="library" size={14} />}
                  {tab.viewState === ViewState.TASKS && <Icon name="checkSquare" size={14} />}
                  {tab.viewState === ViewState.SCHEDULE && <Icon name="calendar" size={14} />}
                  {![ViewState.NEW_TAB, ViewState.BROWSER, ViewState.LIBRARY, ViewState.TASKS, ViewState.SCHEDULE].includes(tab.viewState) && <Icon name="search" size={14} />}
                </span>

                <input
                  type="text"
                  defaultValue={tab.url || tab.title}
                  key={tab.url || tab.title}
                  onKeyDown={(e) => handleInputKeyDown(e, tab.id)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.target.select()}
                  onContextMenu={(e) => e.stopPropagation()} 
                  draggable={false}
                  className={`
                        flex-1 min-w-0 bg-transparent border-none outline-none text-xs truncate
                        ${tab.isActive ? 'text-gray-200 placeholder-gray-400' : 'text-gray-500 pointer-events-none'}
                      `}
                  placeholder="Nova Aba"
                  spellCheck={false}
                />

                <button
                  onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                  className={`
                        w-6 h-6 rounded-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0
                        ${tab.isActive
                      ? 'text-gray-400 hover:bg-red-500 hover:text-white bg-[#14182d]'
                      : 'text-gray-500 hover:bg-red-500 hover:text-white bg-white/5'
                    }
                    `}
                >
                  <Icon name="x" size={12} />
                </button>

                {tab.isActive && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-[#1e233c] z-20" />
                )}
              </div>
            </React.Fragment>
          ))}

          {dropIndicatorIndex === tabs.length && draggingTabId && (
            <div className="w-[2px] h-[24px] bg-blue-400 shadow-[0_0_8px_#60a5fa] rounded-full mx-0.5 animate-pulse shrink-0 transition-all mb-1" />
          )}

          <button
            onClick={() => onNewTab()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-white transition-colors ml-1 shrink-0"
            title="Nova Aba (Ctrl+T)"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>

        <WindowControls />
      </div>
    </>
  );
};

export default TabBar;
