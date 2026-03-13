
import React, { useRef, useEffect, useState } from 'react';
import { useVisionBoard } from '../../contexts/VisionBoardContext';
import VisionBlockComponent from './VisionBlock';
import { Icon } from '../ui/Icon';
import { VisionBlock } from '../../types';
import html2canvas from 'html2canvas';

const VisionBoardCanvas: React.FC = () => {
  const { blocks, isEditing, isEnabled, setIsEnabled, setIsEditing, addBlock, updateBlock, removeBlock, reorderLayer, clearBoard, importBoard } = useVisionBoard();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [guides, setGuides] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
  const [zoom, setZoom] = useState(1);

  // --- CLIPBOARD STATE ---
  const [internalClipboard, setInternalClipboard] = useState<VisionBlock | null>(null);

  // --- EXPORT STATE ---
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- SELECTION & PANELS STATE ---
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'LAYERS' | 'EDITOR'>('LAYERS');
  const [sidebarPos, setSidebarPos] = useState({ x: window.innerWidth - 320, y: 80 });
  const isDraggingSidebar = useRef(false);
  const sidebarOffset = useRef({ x: 0, y: 0 });

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Auto-switch panels based on selection
  useEffect(() => {
      if (selectedBlockId && selectedBlock?.type === 'text') {
          setActivePanel('EDITOR');
      } else if (!selectedBlockId) {
          setActivePanel('LAYERS');
      }
  }, [selectedBlockId, selectedBlock?.type]);

  // --- KEYBOARD SHORTCUTS (COPY/PASTE/DELETE) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isEditing) return;

        // Ignora se estiver digitando em um input ou área editável
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        // DELETE / BACKSPACE
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedBlockId) {
                removeBlock(selectedBlockId);
                setSelectedBlockId(null);
            }
        }

        // COPY (Ctrl+C / Cmd+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            if (selectedBlock) {
                e.preventDefault();
                // DEEP CLONE para evitar copiar referências
                setInternalClipboard(JSON.parse(JSON.stringify(selectedBlock)));
            }
        }

        // PASTE (Ctrl+V / Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            if (internalClipboard) {
                e.preventDefault();
                // DEEP CLONE da clipboard para criar nova instância
                const clipboardData = JSON.parse(JSON.stringify(internalClipboard));
                const offset = 2; // % de deslocamento
                
                // Removemos o ID para que o addBlock gere um novo
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, ...blockData } = clipboardData;
                
                addBlock(clipboardData.type, {
                    ...blockData,
                    x: Math.min(clipboardData.x + offset, 90), // Garante que não saia muito da tela
                    y: Math.min(clipboardData.y + offset, 90),
                });
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, selectedBlockId, selectedBlock, internalClipboard, removeBlock, addBlock]);

  useEffect(() => {
    const update = () => {
      if (canvasRef.current) setRect(canvasRef.current.getBoundingClientRect());
    };
    update();
    const timer = setTimeout(update, 50);
    window.addEventListener('resize', update);
    return () => {
        window.removeEventListener('resize', update);
        clearTimeout(timer);
    };
  }, [zoom]);

  useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
          if (isEditing && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              const delta = -e.deltaY * 0.001;
              setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2));
          }
      };
      
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
  }, [isEditing]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (!isEditing) return;
      if ((e.target as HTMLElement).closest('.no-deselect')) return;
      setSelectedBlockId(null);
      setShowExportMenu(false);
  };

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-panel-drag')) return;
    isDraggingSidebar.current = true;
    sidebarOffset.current = {
      x: e.clientX - sidebarPos.x,
      y: e.clientY - sidebarPos.y
    };

    const move = (ev: MouseEvent) => {
      if (!isDraggingSidebar.current) return;
      setSidebarPos({
        x: ev.clientX - sidebarOffset.current.x,
        y: ev.clientY - sidebarOffset.current.y
      });
    };

    const up = () => {
      isDraggingSidebar.current = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // --- EXPORT FUNCTIONALITY ---
  
  const handleExportImage = async (format: 'png' | 'jpeg') => {
      if (!containerRef.current) return;
      setIsExporting(true);
      setShowExportMenu(false);
      setSelectedBlockId(null); 

      await new Promise(resolve => setTimeout(resolve, 100));

      try {
          const canvas = await html2canvas(containerRef.current, {
              useCORS: true, 
              backgroundColor: '#0a0e27', 
              scale: 2, 
              ignoreElements: (element) => {
                  return element.classList.contains('no-export');
              }
          });

          const link = document.createElement('a');
          link.download = `vision_board_${Date.now()}.${format}`;
          link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : 1.0);
          link.click();
      } catch (error) {
          console.error("Export failed:", error);
          alert("Erro ao exportar. Tente novamente.");
      } finally {
          setIsExporting(false);
      }
  };

  const handleExportJSON = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks, null, 2));
      const link = document.createElement('a');
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `vision_board_backup_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportMenu(false);
  };

  // --- IMPORT FUNCTIONALITY ---
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const json = JSON.parse(ev.target?.result as string);
              importBoard(json);
              setShowExportMenu(false);
          } catch (err) {
              alert("Erro ao ler o arquivo. Certifique-se de que é um JSON válido.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  // --- SUBCOMPONENTS ---

  const TextEditorPanel = ({ block }: { block: VisionBlock }) => {
      const updateStyle = (updates: Partial<NonNullable<VisionBlock['content']['style']>>) => {
        updateBlock(block.id, {
          content: {
            ...block.content,
            style: { ...(block.content.style || {}), ...updates }
          }
        });
      };

      const style = block.content.style || {};

      return (
          <div className="flex flex-col h-full min-h-0 animate-[fadeIn_0.2s_ease]">
              <div 
                className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5 cursor-move active:cursor-grabbing select-none shrink-0"
                onMouseDown={handleSidebarMouseDown}
              >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400"><Icon name="type" size={16} /></div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Editor de Texto</span>
                </div>
                <button onClick={() => setActivePanel('LAYERS')} className="text-gray-500 hover:text-white transition-colors no-panel-drag"><Icon name="minus" size={16} /></button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar no-panel-drag min-h-0">
                  
                  {/* Font Family */}
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tipografia</label>
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => updateStyle({fontFamily: 'sans'})} className={`py-2 px-3 rounded-xl border text-xs transition-all ${style.fontFamily === 'sans' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#1e233c] border-white/5 text-gray-400 hover:text-white'}`}>Moderna</button>
                          <button onClick={() => updateStyle({fontFamily: 'serif'})} className={`py-2 px-3 rounded-xl border text-xs font-serif transition-all ${style.fontFamily === 'serif' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#1e233c] border-white/5 text-gray-400 hover:text-white'}`}>Clássica</button>
                          <button onClick={() => updateStyle({fontFamily: 'cursive'})} className={`py-2 px-3 rounded-xl border text-xs italic font-serif transition-all ${style.fontFamily === 'cursive' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#1e233c] border-white/5 text-gray-400 hover:text-white'}`}>Manuscrita</button>
                          <button onClick={() => updateStyle({fontFamily: 'mono'})} className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all ${style.fontFamily === 'mono' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#1e233c] border-white/5 text-gray-400 hover:text-white'}`}>Máquina</button>
                      </div>
                  </div>

                  {/* Estilo */}
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Estilo</label>
                      <div className="flex gap-2">
                          <StyleToggle active={style.bold} icon="bold" onClick={() => updateStyle({bold: !style.bold})} />
                          <StyleToggle active={style.italic} icon="italic" onClick={() => updateStyle({italic: !style.italic})} />
                          <StyleToggle active={style.underline} icon="underline" onClick={() => updateStyle({underline: !style.underline})} />
                          <StyleToggle active={style.strikethrough} icon="strikethrough" onClick={() => updateStyle({strikethrough: !style.strikethrough})} />
                      </div>
                  </div>

                  {/* Tamanho */}
                  <div className="space-y-2">
                      <div className="flex justify-between">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tamanho</label>
                          <span className="text-[9px] font-mono text-purple-400">{style.fontSize}px</span>
                      </div>
                      <input 
                        type="range" min="12" max="120" 
                        value={style.fontSize || 28} 
                        onChange={(e) => updateStyle({fontSize: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-[#1e233c] rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                  </div>

                  {/* Cores */}
                  <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Cores</label>
                      <div className="flex gap-4 items-center">
                          <div className="flex-1 flex flex-col gap-1">
                              <span className="text-[9px] text-gray-500">Texto</span>
                              <div className="h-10 rounded-xl bg-[#1e233c] border border-white/10 flex items-center px-2 relative overflow-hidden">
                                  <input type="color" value={style.color || '#ffffff'} onChange={(e) => updateStyle({color: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                  <div className="w-6 h-6 rounded-lg border border-white/20" style={{ backgroundColor: style.color || '#ffffff' }} />
                                  <span className="ml-2 text-[10px] font-mono text-gray-400">{style.color}</span>
                              </div>
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                              <span className="text-[9px] text-gray-500">Realce</span>
                              <button 
                                onClick={() => updateStyle({backgroundColor: style.backgroundColor === '#facc1550' ? 'transparent' : '#facc1550'})}
                                className={`h-10 rounded-xl border flex items-center justify-center gap-2 transition-all ${style.backgroundColor === '#facc1550' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-[#1e233c] border-white/10 text-gray-500 hover:text-white'}`}
                              >
                                  <Icon name="highlighter" size={16} />
                                  <span className="text-[10px] font-bold">{style.backgroundColor === '#facc1550' ? 'ON' : 'OFF'}</span>
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Borda */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Borda (Moldura)</label>
                          <button 
                            onClick={() => updateStyle({hasBorder: !style.hasBorder})}
                            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${style.hasBorder ? 'bg-purple-600 text-white' : 'bg-[#1e233c] text-gray-500'}`}
                          >
                              {style.hasBorder ? 'LIGADO' : 'DESLIGADO'}
                          </button>
                      </div>
                      {style.hasBorder && (
                          <div className="h-10 rounded-xl bg-[#1e233c] border border-white/10 flex items-center px-2 relative overflow-hidden">
                              <input type="color" value={style.borderColor || style.color || '#ffffff'} onChange={(e) => updateStyle({borderColor: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <div className="w-6 h-6 rounded-lg border border-white/20" style={{ backgroundColor: style.borderColor || style.color || '#ffffff' }} />
                              <span className="ml-2 text-[10px] font-mono text-gray-400">{style.borderColor || 'Auto'}</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const StyleToggle = ({ active, icon, onClick }: any) => (
      <button 
        onClick={onClick}
        className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all border ${active ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-[#1e233c] border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
      >
          <Icon name={icon} size={16} />
      </button>
  );

  const LayersPanel = () => {
      const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);

      const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingLayerId(id);
        e.dataTransfer.effectAllowed = 'move';
      };

      const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggingLayerId || draggingLayerId === targetId) return;
        const sorted = [...blocks].sort((a, b) => a.z - b.z);
        const targetIdx = sorted.findIndex(b => b.id === targetId);
        reorderLayer(draggingLayerId, targetIdx);
        setDraggingLayerId(null);
      };

      return (
          <div className="flex flex-col h-full min-h-0 animate-[fadeIn_0.2s_ease]">
              <div 
                className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5 cursor-move active:cursor-grabbing select-none shrink-0"
                onMouseDown={handleSidebarMouseDown}
              >
                <div className="flex flex-col pointer-events-none">
                  <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.25em]">Camadas</h3>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">{blocks.length} elementos</span>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 pointer-events-none"><Icon name="layers" size={16} /></div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 no-panel-drag min-h-0">
                {[...blocks].sort((a, b) => b.z - a.z).map((block) => (
                    <div 
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, block.id)}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`
                        group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${block.id === selectedBlockId ? 'bg-blue-600/20 border-blue-500/50 shadow-lg' : 'bg-[#1e233c]/40 border-white/5 hover:bg-[#1e233c] hover:border-white/10'}
                        ${draggingLayerId === block.id ? 'opacity-30 scale-95' : 'opacity-100'}
                      `}
                    >
                      <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                        {block.type === 'image' ? <img src={block.content.url} className="w-full h-full object-cover" /> : 
                         block.type === 'video' ? <Icon name="play" size={12} className="text-blue-400" /> : 
                         <Icon name="type" size={12} className="text-gray-400" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`text-[10px] font-bold truncate uppercase ${block.id === selectedBlockId ? 'text-white' : 'text-gray-400'}`}>
                          {block.type === 'text' ? (block.content.text || 'Texto') : block.type}
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} 
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5 bg-black/20 text-center no-panel-drag shrink-0">
                 <button onClick={clearBoard} className="w-full py-3 rounded-xl text-[10px] font-black text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/20">
                    <Icon name="trash" size={12} /> Limpar
                 </button>
              </div>
          </div>
      );
  };

  if (!isEnabled && !isEditing) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden bg-[#0a0e27] select-none transition-all duration-700" onClick={handleCanvasClick}>
      
      {/* Background Decorativo */}
      {isEditing && !isExporting && (
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-[1] no-export" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }} 
        />
      )}

      {/* Linhas de Guia (No Export) */}
      {isEditing && !isExporting && guides.x !== null && <div className="absolute top-0 bottom-0 border-l border-cyan-400 border-dashed z-[3000] pointer-events-none opacity-80 no-export" style={{ left: guides.x, borderWidth: '1px' }} />}
      {isEditing && !isExporting && guides.y !== null && <div className="absolute left-0 right-0 border-t border-cyan-400 border-dashed z-[3000] pointer-events-none opacity-80 no-export" style={{ top: guides.y, borderWidth: '1px' }} />}

      {/* Canvas */}
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <div 
            ref={canvasRef} 
            className="relative w-full h-full max-w-[2560px] mx-auto z-[2] transition-transform duration-200 ease-out"
            style={{ transform: `scale(${isExporting ? 1 : zoom})`, transformOrigin: 'center center' }}
          >
            {[...blocks].sort((a, b) => a.z - b.z).map(block => (
            <VisionBlockComponent 
                key={block.id} 
                block={block} 
                canvasRect={rect} 
                onSnap={setGuides}
                zoom={zoom}
                isSelected={block.id === selectedBlockId && !isExporting}
                onSelect={() => setSelectedBlockId(block.id)}
            />
            ))}
          </div>
      </div>

      {/* --- PANEL SYSTEM (NO EXPORT) --- */}
      {isEditing && !isExporting && (
        <>
            {/* Main Active Panel */}
            <div 
              className="fixed w-[300px] max-h-[calc(100vh-160px)] bg-[#0f1223]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[2000] flex flex-col overflow-hidden animate-[popIn_0.3s_ease] cursor-default no-deselect no-export"
              style={{ left: sidebarPos.x, top: sidebarPos.y }}
            >
               {activePanel === 'LAYERS' ? <LayersPanel /> : 
                (selectedBlock?.type === 'text' ? <TextEditorPanel block={selectedBlock} /> : 
                <div className="p-8 text-center text-gray-500 text-xs italic">Selecione um bloco de texto para editar.</div>)
               }
            </div>

            {/* Minimized Panel Button */}
            <button
                onClick={() => setActivePanel(activePanel === 'LAYERS' ? 'EDITOR' : 'LAYERS')}
                className="fixed w-12 h-12 rounded-[20px] bg-[#0f1223]/90 backdrop-blur-md border border-white/10 shadow-2xl z-[2000] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e233c] transition-all active:scale-95 no-deselect no-export"
                style={{ 
                    left: sidebarPos.x - 60, 
                    top: sidebarPos.y + 70 
                }}
                title={activePanel === 'LAYERS' ? "Abrir Editor" : "Abrir Camadas"}
            >
                <Icon name={activePanel === 'LAYERS' ? "type" : "layers"} size={20} />
            </button>
        </>
      )}

      {/* ZOOM CONTROLS (Bottom Right) - NO EXPORT */}
      {isEditing && !isExporting && (
          <div className="fixed bottom-28 right-8 flex flex-col gap-2 z-[2000] animate-[fadeIn_0.3s_ease] no-deselect no-export">
              <button onClick={handleZoomIn} className="w-10 h-10 rounded-xl bg-[#0f1223]/90 border border-white/10 hover:bg-blue-600 hover:text-white text-gray-400 flex items-center justify-center transition-all shadow-lg active:scale-95">
                  <Icon name="plus" size={16} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#0f1223]/90 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-300 shadow-lg cursor-default select-none">
                  {Math.round(zoom * 100)}%
              </div>
              <button onClick={handleZoomOut} className="w-10 h-10 rounded-xl bg-[#0f1223]/90 border border-white/10 hover:bg-blue-600 hover:text-white text-gray-400 flex items-center justify-center transition-all shadow-lg active:scale-95">
                  <Icon name="minus" size={16} />
              </button>
              <button onClick={handleZoomReset} title="Reset Zoom" className="w-10 h-10 rounded-xl bg-[#0f1223]/90 border border-white/10 hover:bg-white/10 text-gray-500 flex items-center justify-center transition-all shadow-lg active:scale-95 mt-2">
                  <Icon name="maximize" size={14} />
              </button>
          </div>
      )}

      {/* Ferramentas Inferior - NO EXPORT */}
      {isEditing && !isExporting && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-3 p-3 bg-[#0f1223]/95 backdrop-blur-3xl border border-white/15 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-[slideUp_0.4s_ease] no-deselect no-export">
            <div className="flex gap-2 pr-3 border-r border-white/10">
              <ToolBtn icon="type" onClick={() => { addBlock('text'); setActivePanel('EDITOR'); }} label="Novo Mantra" />
              <ToolBtn icon="image" onClick={() => { 
                  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                  input.onchange = (e) => { const f = (e.target as any).files?.[0]; if(f) { const r = new FileReader(); r.onload = (ev) => addBlock('image', { content: { url: ev.target?.result as string } }); r.readAsDataURL(f); } };
                  input.click();
              }} label="Enviar Imagem" />
              
              <div className="relative group/vidmenu">
                <ToolBtn icon="video" onClick={() => {}} label="Adicionar Vídeo" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover/vidmenu:flex flex-col bg-[#14182d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-w-[160px] animate-[popIn_0.2s_ease]">
                    <button onClick={() => {
                        const input = document.createElement('input'); input.type = 'file'; input.accept = 'video/*';
                        input.onchange = (e) => { const f = (e.target as any).files?.[0]; if(f) { const r = new FileReader(); r.onload = (ev) => addBlock('video', { content: { url: ev.target?.result as string } }); r.readAsDataURL(f); } };
                        input.click();
                    }} className="px-5 py-3 text-[11px] font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-all text-left flex items-center gap-3"><Icon name="download" size={14} /> Arquivo Local</button>
                    <button onClick={() => {
                        const url = prompt('URL do Vídeo:'); if(url) addBlock('video', { content: { url: url.trim() } });
                    }} className="px-5 py-3 text-[11px] font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-all text-left flex items-center gap-3 border-t border-white/5"><Icon name="link" size={14} /> Link Direto/YT</button>
                </div>
              </div>
            </div>
            
            {/* EXPORT/IMPORT BUTTON */}
            <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all group hover:bg-white/5 ${showExportMenu ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                    title="Exportar / Importar"
                >
                    <Icon name="download" size={24} />
                </button>
                
                {showExportMenu && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#14182d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-w-[200px] animate-[popIn_0.2s_ease] z-[2100]">
                        <div className="px-4 py-2 bg-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">Exportar Como</div>
                        <button onClick={() => handleExportImage('png')} className="w-full px-5 py-3 text-[11px] font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-all text-left flex items-center gap-3 border-b border-white/5">
                            <Icon name="image" size={14} /> Imagem PNG <span className="text-[9px] opacity-60 ml-auto">Alta Qualidade</span>
                        </button>
                        <button onClick={() => handleExportImage('jpeg')} className="w-full px-5 py-3 text-[11px] font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-all text-left flex items-center gap-3 border-b border-white/5">
                            <Icon name="image" size={14} /> Imagem JPG <span className="text-[9px] opacity-60 ml-auto">Compacto</span>
                        </button>
                        <button onClick={handleExportJSON} className="w-full px-5 py-3 text-[11px] font-bold text-gray-300 hover:bg-blue-600 hover:text-white transition-all text-left flex items-center gap-3 border-b border-white/5">
                            <Icon name="code" size={14} /> Arquivo JSON <span className="text-[9px] opacity-60 ml-auto">Backup</span>
                        </button>
                        
                        <div className="px-4 py-2 bg-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">Importar</div>
                        <button onClick={() => importInputRef.current?.click()} className="w-full px-5 py-3 text-[11px] font-bold text-gray-300 hover:bg-green-600 hover:text-white transition-all text-left flex items-center gap-3">
                            <Icon name="rotateCw" size={14} /> Importar JSON <span className="text-[9px] opacity-60 ml-auto">Restaurar</span>
                        </button>
                    </div>
                )}
                {/* Input Invisível para Importação */}
                <input 
                    type="file" 
                    accept=".json" 
                    ref={importInputRef} 
                    onChange={handleImportJSON} 
                    className="hidden" 
                />
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <button onClick={() => setIsEnabled(!isEnabled)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEnabled ? 'text-green-400 bg-green-400/10' : 'text-gray-500 hover:bg-white/5'}`} title={isEnabled ? "Visível" : "Oculto"}><Icon name={isEnabled ? "eye" : "eyeOff"} size={22} /></button>
              <button onClick={() => setIsEditing(false)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-900/50 active:scale-95">Salvar</button>
            </div>
        </div>
      )}
    </div>
  );
};

const ToolBtn = ({ icon, onClick, label }: { icon: string, onClick: () => void, label: string }) => (
  <button onClick={onClick} className="w-14 h-14 flex flex-col items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all group relative" title={label}>
    <Icon name={icon} size={24} />
  </button>
);

export default VisionBoardCanvas;
