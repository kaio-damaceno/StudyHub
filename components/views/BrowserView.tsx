
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Icon } from '../ui/Icon';
import { Tab } from '../../types';
import { useContextMenu } from '../../hooks/useContextMenu';
import ErrorState from '../feedback/ErrorState';
// LoadingScreen removido para não bloquear a visão durante a navegação

interface BrowserViewProps {
  url: string;
  tabId?: string;
  preloadPath: string; 
  initialScrollY?: number;
  onUpdateTab?: (id: string, data: Partial<Tab>) => void;
  onOpenNewTab?: (url: string, inBackground?: boolean) => void;
  onAddToHistory?: (url: string, title: string) => void;
  onToggleBookmark?: () => void;
}

const DARK_MODE_INJECT = `
  (function() {
     const hostname = window.location.hostname;
     if (hostname.includes('google.com') || hostname.includes('bing.com') || hostname.includes('duckduckgo.com') || hostname.includes('yahoo.com')) {
        const style = document.createElement('style');
        style.id = 'studyhub-dark-mode';
        style.textContent = \`
           body, html, #main { background-color: #202124 !important; color: #e8eaed !important; }
           .s, .st, .aCOpRe { color: #9aa0a6 !important; }
           a { color: #8ab4f8 !important; }
           .fbar { background: #171717 !important; border-top: 1px solid #303134 !important; }
           input, textarea, select { background-color: #303134 !important; color: white !important; border-color: #5f6368 !important; }
           .kp-blk, .Ww4FFb, .MjjYud { background-color: #202124 !important; border: 1px solid #303134 !important; border-radius: 8px !important; }
           header, .sfbg, .sfbgg { background: #202124 !important; }
           ::-webkit-scrollbar { width: 10px; height: 10px; background: #202124; }
           ::-webkit-scrollbar-thumb { background: #5f6368; border-radius: 5px; }
           ::-webkit-scrollbar-thumb:hover { background: #80868b; }
           ::-webkit-scrollbar-corner { background: #202124; }
        \`;
        document.head.appendChild(style);
     }
  })();
`;

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

// Helper para selecionar imagem baseada no erro
const getErrorImage = (code: string | number) => {
    const c = String(code);
    if (c === '404') return 'error-404.png';
    if (c === '403') return 'error-403.png';
    if (c === '401' || c === '402') return 'error-401.png';
    if (c === '-106' || c === '-105') return 'offline.png';
    return 'offline.png'; // Padrão genérico
};

const BrowserView: React.FC<BrowserViewProps> = ({ 
  url, tabId, preloadPath, initialScrollY, onUpdateTab, onOpenNewTab, onAddToHistory, onToggleBookmark
}) => {
  const webviewRef = useRef<any>(null);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findText, setFindText] = useState('');
  const [findMatches, setFindMatches] = useState({ active: 0, total: 0 });
  const findInputRef = useRef<HTMLInputElement>(null);
  
  // Mantemos isLoading para controle interno, mas não exibiremos Overlay
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<{ code: string; desc: string; url: string; image: string } | null>(null);
  
  const { handleContextMenu } = useContextMenu();

  const callbacksRef = useRef({ onUpdateTab, onOpenNewTab, onAddToHistory, onToggleBookmark });
  useEffect(() => {
    callbacksRef.current = { onUpdateTab, onOpenNewTab, onAddToHistory, onToggleBookmark };
  }, [onUpdateTab, onOpenNewTab, onAddToHistory, onToggleBookmark]);

  const zoomFactorRef = useRef(zoomFactor);
  useEffect(() => { zoomFactorRef.current = zoomFactor; }, [zoomFactor]);

  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    const wv = webviewRef.current;
    if (!wv) return;
    const currentZoom = zoomFactorRef.current;
    let newZoom = currentZoom;
    if (direction === 'in') newZoom = Math.min(currentZoom + 0.1, 3.0);
    else if (direction === 'out') newZoom = Math.max(currentZoom - 0.1, 0.3);
    else newZoom = 1.0;
    
    newZoom = Math.round(newZoom * 10) / 10;
    setZoomFactor(newZoom);
    try {
      wv.setZoomFactor(newZoom);
      setShowZoomControls(true);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => setShowZoomControls(false), 2000);
    } catch (e) { console.error("Zoom error", e); }
  }, []);

  const executeFind = (forward: boolean = true) => {
     const wv = webviewRef.current;
     if (!wv || !findText) return;
     wv.findInPage(findText, { forward, findNext: true });
  };

  const stopFind = (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => {
      const wv = webviewRef.current;
      if (!wv) return;
      wv.stopFindInPage(action);
      setShowFindBar(false);
      setFindMatches({ active: 0, total: 0 });
  };

  // Recarregar página (Action para ErrorState)
  const handleReload = () => {
      if (webviewRef.current) {
          setErrorState(null);
          setIsLoading(true);
          webviewRef.current.reload();
      }
  };

  // Voltar para Home (Action para ErrorState)
  const handleGoHome = () => {
      if (onUpdateTab && tabId) {
          onUpdateTab(tabId, { url: 'studyhub://newtab' });
      }
  };

  useEffect(() => {
    const handleBrowserAction = (e: CustomEvent) => {
        if (e.detail.tabId !== tabId) return;
        const wv = webviewRef.current;
        if (!wv) return;
        switch (e.detail.action) {
            case 'back': if (wv.canGoBack()) wv.goBack(); break;
            case 'forward': if (wv.canGoForward()) wv.goForward(); break;
            case 'reload': handleReload(); break;
            case 'stop': wv.stop(); break;
            case 'print': wv.print(); break;
            case 'save': if (window.api && window.api.savePage) window.api.savePage(); break;
            case 'find': setShowFindBar(true); setTimeout(() => findInputRef.current?.focus(), 100); break;
            case 'find-next': executeFind(true); break;
            case 'find-prev': executeFind(false); break;
            case 'zoom-in': handleZoom('in'); break;
            case 'zoom-out': handleZoom('out'); break;
            case 'zoom-reset': handleZoom('reset'); break;
            case 'bookmark': if (callbacksRef.current.onToggleBookmark) callbacksRef.current.onToggleBookmark(); break;
        }
    };
    window.addEventListener('browser-action' as any, handleBrowserAction);
    return () => window.removeEventListener('browser-action' as any, handleBrowserAction);
  }, [tabId, handleZoom]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (wv && tabId) {
      const handleDomReady = () => {
          try { wv.executeJavaScript(DARK_MODE_INJECT); } catch (e) { }
      };

      const handleInputEvent = (e: any) => {
          if (e.type === 'mouseWheel' && (e.control || e.meta)) {
              if (e.deltaY > 0) handleZoom('out');
              else if (e.deltaY < 0) handleZoom('in');
              return;
          }
          if (e.type !== 'keyDown') return;
          if (((e.control || e.meta) && e.key === 'f') || e.key === 'F3') {
              setShowFindBar(true);
              setTimeout(() => findInputRef.current?.focus(), 100);
              return;
          }
          if (e.key === 'F5' || ((e.control || e.meta) && e.key === 'r')) { handleReload(); return; }
          if ((e.control || e.meta) && e.key === 'p') { wv.print(); return; }
          if ((e.control || e.meta) && e.key === 'd') { if(callbacksRef.current.onToggleBookmark) callbacksRef.current.onToggleBookmark(); return; }
          if (e.control || e.meta) {
              if (e.key === '=' || e.key === '+') handleZoom('in');
              else if (e.key === '-') handleZoom('out');
              else if (e.key === '0') handleZoom('reset');
          }
          if (e.alt && e.key === 'ArrowLeft') { if (wv.canGoBack()) wv.goBack(); }
          if (e.alt && e.key === 'ArrowRight') { if (wv.canGoForward()) wv.goForward(); }
      };

      const handleFoundInPage = (e: any) => {
          setFindMatches({ active: e.result.activeMatchOrdinal, total: e.result.matches });
      };

      const handleNavigate = (e: any) => {
        setErrorState(null);
        if (e.url !== url && callbacksRef.current.onUpdateTab) {
           const currentTitle = wv.getTitle();
           const finalTitle = (currentTitle && currentTitle !== e.url) ? currentTitle : e.url;
           callbacksRef.current.onUpdateTab(tabId, { url: e.url, title: finalTitle });
           setShowFindBar(false); 
           if (callbacksRef.current.onAddToHistory) {
               callbacksRef.current.onAddToHistory(e.url, finalTitle); 
           }
        }
      };

      const handleTitleUpdate = (e: any) => {
         if (callbacksRef.current.onUpdateTab) {
             const currentUrl = wv.getURL();
             if (callbacksRef.current.onAddToHistory) {
                 callbacksRef.current.onAddToHistory(currentUrl, e.title);
             }
             callbacksRef.current.onUpdateTab(tabId, { title: e.title, url: currentUrl });
         }
      };
      
      const handleStartLoading = () => {
          setIsLoading(true);
          setErrorState(null);
      };

      const handleStopLoading = () => {
          setIsLoading(false);
      };

      const handleFailLoad = (e: any) => {
          if (e.errorCode !== -3) {
              setIsLoading(false);
              let message = "Não foi possível carregar esta página.";
              if (e.errorCode === -106) message = "Verifique sua conexão com a internet."; 
              if (e.errorCode === -105) message = "Não foi possível encontrar este site (DNS).";
              if (e.errorCode === -102) message = "O servidor recusou a conexão."; 
              if (e.errorCode === -118) message = "A conexão expirou (Timeout)."; 
              
              setErrorState({
                  code: String(e.errorCode),
                  desc: e.errorDescription || message,
                  url: e.validatedURL || url,
                  image: getErrorImage(e.errorCode)
              });
          }
      };
      
      const handleFinishLoad = () => {
         setIsLoading(false);
         if (initialScrollY && initialScrollY > 0) {
             try { wv.executeJavaScript(`window.scrollTo(0, ${initialScrollY})`); } catch(e) { }
         }
      };

      const handleIpcMessage = (e: any) => {
         if (e.channel === 'scroll-position') {
             const y = e.args[0];
             if (typeof y === 'number' && callbacksRef.current.onUpdateTab) callbacksRef.current.onUpdateTab(tabId, { scrollPosition: y });
         }
         if (e.channel === 'download-request') {
             const url = e.args[0];
             if (url) wv.downloadURL(url); 
         }
      };

      const handleNewWindow = (e: any) => {
        e.preventDefault();
        if (e.disposition === 'new-window' && window.api) {
            window.api.openNewWindow(e.url);
        } else if (e.disposition === 'background-tab' && callbacksRef.current.onOpenNewTab) {
            callbacksRef.current.onOpenNewTab(e.url, true);
        } else if (callbacksRef.current.onOpenNewTab) {
            callbacksRef.current.onOpenNewTab(e.url, false);
        }
      };

      const handleContextMenuEvent = (e: any) => {
          const params = e.params;
          const items: any[] = [];
          if (params.linkURL) {
              items.push({ 
                  label: 'Abrir em Nova Aba', 
                  icon: 'externalLink', 
                  onClick: () => callbacksRef.current.onOpenNewTab && callbacksRef.current.onOpenNewTab(params.linkURL, false) 
              });
              items.push({ type: 'separator' });
              items.push({ 
                  label: 'Copiar Endereço', 
                  icon: 'copy', 
                  onClick: () => { if (params.linkURL) navigator.clipboard.writeText(params.linkURL); } 
              });
              items.push({ type: 'separator' });
          }
          if (params.mediaType === 'image' && params.srcURL) {
              items.push({
                  label: 'Abrir Imagem', icon: 'image',
                  onClick: () => callbacksRef.current.onOpenNewTab && callbacksRef.current.onOpenNewTab(params.srcURL, false)
              });
              items.push({ label: 'Salvar Imagem', icon: 'download', onClick: () => wv.downloadURL(params.srcURL) });
              items.push({ type: 'separator' });
          }
          if (params.selectionText) {
              items.push({ label: 'Copiar', icon: 'copy', onClick: () => wv.copy() });
              items.push({
                  label: `Pesquisar "${params.selectionText.slice(0, 15)}..."`,
                  icon: 'search',
                  onClick: () => {
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`;
                      if(callbacksRef.current.onOpenNewTab) callbacksRef.current.onOpenNewTab(searchUrl, false);
                  }
              });
              items.push({ type: 'separator' });
          }
          items.push({ label: 'Recarregar', icon: 'refresh', onClick: () => wv.reload() });
          items.push({ label: 'Imprimir...', icon: 'printer', onClick: () => wv.print() });

          const rect = wv.getBoundingClientRect();
          const fakeEvent = {
              preventDefault: () => {}, stopPropagation: () => {},
              clientX: rect.left + params.x, clientY: rect.top + params.y
          } as unknown as React.MouseEvent;
          handleContextMenu(fakeEvent, items);
      };

      wv.addEventListener('dom-ready', handleDomReady);
      wv.addEventListener('ipc-message', handleIpcMessage);
      wv.addEventListener('new-window', handleNewWindow);
      wv.addEventListener('did-navigate', handleNavigate);
      wv.addEventListener('did-navigate-in-page', handleNavigate);
      wv.addEventListener('page-title-updated', handleTitleUpdate);
      wv.addEventListener('found-in-page', handleFoundInPage);
      wv.addEventListener('did-start-loading', handleStartLoading);
      wv.addEventListener('did-stop-loading', handleStopLoading);
      wv.addEventListener('did-fail-load', handleFailLoad);
      wv.addEventListener('did-finish-load', handleFinishLoad);
      wv.addEventListener('context-menu', handleContextMenuEvent);

      return () => {
          try {
              wv.removeEventListener('dom-ready', handleDomReady);
              wv.removeEventListener('ipc-message', handleIpcMessage);
              wv.removeEventListener('new-window', handleNewWindow);
              wv.removeEventListener('did-navigate', handleNavigate);
              wv.removeEventListener('did-navigate-in-page', handleNavigate);
              wv.removeEventListener('page-title-updated', handleTitleUpdate);
              wv.removeEventListener('found-in-page', handleFoundInPage);
              wv.removeEventListener('did-start-loading', handleStartLoading);
              wv.removeEventListener('did-stop-loading', handleStopLoading);
              wv.removeEventListener('did-fail-load', handleFailLoad);
              wv.removeEventListener('did-finish-load', handleFinishLoad);
              wv.removeEventListener('context-menu', handleContextMenuEvent);
          } catch (e) { }
      };
    }
  }, [tabId, url, initialScrollY, handleZoom]);

  return (
    <div className="w-full h-full relative group flex flex-col bg-[#0a0e27]">
        <webview
            ref={webviewRef}
            src={url}
            preload={preloadPath}
            className="w-full h-full bg-[#0a0e27]"
            useragent={CHROME_USER_AGENT}
            partition="persist:studyhub"
            // @ts-ignore
            allowpopups="true"
        />

        {/* ERRO STATE OVERLAY (Apenas em caso de erro real) */}
        {errorState && (
            <div className="absolute inset-0 z-50 bg-[#0a0e27] flex flex-col">
                <ErrorState 
                    title="Não foi possível conectar"
                    message={errorState.desc}
                    code={errorState.code}
                    icon="wifiOff"
                    imageSrc={errorState.image}
                    onRetry={handleReload}
                    onHome={handleGoHome}
                />
            </div>
        )}

        {/* Find Bar Overlay */}
        {showFindBar && (
            <div className="absolute top-4 right-8 bg-[#14182d] border border-blue-400/30 p-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center gap-2 z-50 animate-[fadeIn_0.2s_ease]">
                <input 
                    ref={findInputRef}
                    type="text" 
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') executeFind(true);
                        if (e.key === 'Escape') stopFind('keepSelection');
                    }}
                    placeholder="Localizar..."
                    className="bg-[#0a0e27] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 w-[220px]"
                    autoFocus
                />
                <span className="text-[10px] text-gray-400 min-w-[40px] text-center font-mono">
                    {findMatches.active}/{findMatches.total}
                </span>
                <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                <button onClick={() => executeFind(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors" title="Anterior"><Icon name="chevronUp" size={14} /></button>
                <button onClick={() => executeFind(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors" title="Próximo"><Icon name="chevronDown" size={14} /></button>
                <button onClick={() => stopFind('clearSelection')} className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors ml-1"><Icon name="x" size={14} /></button>
            </div>
        )}

        {/* Zoom Controls Overlay */}
        {showZoomControls && (
             <div className="absolute bottom-6 right-6 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold pointer-events-none transition-all animate-[fadeIn_0.2s_ease] border border-white/10 shadow-lg z-50">
                 {Math.round(zoomFactor * 100)}%
             </div>
        )}
    </div>
  );
};

export default memo(BrowserView);
