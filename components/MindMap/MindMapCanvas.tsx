
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useMindMap } from '../../contexts/MindMapContext';
import { calculateMindMapLayout } from './MindMapLayout';
import MindMapNodeComponent from './MindMapNodeComponent';
import MindMapToolbar from './MindMapToolbar';
import MindMapConnection from './MindMapConnection';
import { Icon } from '../ui/Icon';
import html2canvas from 'html2canvas';
import { useContextMenu } from '../../hooks/useContextMenu';

const MindMapCanvas: React.FC = () => {
  const { 
      currentMap, 
      selectedNodeId,
      selectedNodeIds, 
      setMultiSelection,
      clearSelection,
      dragCreation, 
      setDragCreation, 
      addChildNodeAt,
      connectNodes,
      deleteNodes,
      setModal,
      deleteNode,
      importMap
  } = useMindMap();

  const { handleContextMenu } = useContextMenu();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false); 
  const lastSelectedNodeRef = useRef<string | null>(null); 

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null); 
  const exportRef = useRef<HTMLDivElement>(null); 
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); 
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null); 

  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);

  // --- EXPORT STATE ---
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportScope, setExportScope] = useState<'FULL' | 'BRANCH'>('FULL');
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JSON'>('PNG');
  const [isProcessingExport, setIsProcessingExport] = useState(false);

  const layout = useMemo(() => {
    if (!currentMap) return null;
    return calculateMindMapLayout(currentMap.rootId, currentMap.nodes);
  }, [currentMap]);

  useEffect(() => {
    if (layout && containerRef.current && pan.x === 0 && pan.y === 0) {
        const { height: ch, width: cw } = containerRef.current.getBoundingClientRect();
        setPan({ 
            x: (cw / 2) - (layout.width / 2), 
            y: (ch / 2) - (layout.height / 2) 
        });
    }
  }, [layout, currentMap?.id]);

  useEffect(() => {
      if (selectedNodeId) {
          lastSelectedNodeRef.current = selectedNodeId;
      }
  }, [selectedNodeId]);

  useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (selectedNodeIds.size > 0) {
                  deleteNodes(Array.from(selectedNodeIds));
              }
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedNodeIds, deleteNodes]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
  };

  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      handleContextMenu(e, [
          { label: 'Criar Flashcard', icon: 'rotateCw', onClick: () => setModal({ type: 'FLASHCARD', nodeId }) },
          { label: 'Vincular Nota', icon: 'fileText', onClick: () => setModal({ type: 'NOTE', nodeId }) },
          { type: 'separator' },
          { label: 'Excluir Nó', icon: 'trash', variant: 'danger', onClick: () => deleteNode(nodeId) }
      ]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    hasMovedRef.current = false; 
    
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
        if (e.shiftKey || e.button === 0) {
            const rect = containerRef.current!.getBoundingClientRect();
            const rawX = e.clientX - rect.left;
            const rawY = e.clientY - rect.top;
            
            setSelectionBox({ startX: rawX, startY: rawY, currentX: rawX, currentY: rawY });
        } else {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    hasMovedRef.current = true;

    if (dragCreation && layout) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setMousePos(coords);
        const target = layout.nodes.find(node => 
            coords.x >= node.x! && 
            coords.x <= node.x! + node.width! &&
            coords.y >= node.y! &&
            coords.y <= node.y! + node.height!
        );
        if (target && target.id !== dragCreation.sourceId) setHoveredNodeId(target.id);
        else setHoveredNodeId(null);
    }

    if (selectionBox && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        setSelectionBox(prev => prev ? ({ ...prev, currentX: rawX, currentY: rawY }) : null);
        return;
    }

    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    
    if (!hasMovedRef.current && !selectionBox && !dragCreation && (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg')) {
        if (!e.shiftKey) clearSelection();
    }

    if (selectionBox && layout) {
        const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
        const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
        const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
        const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

        if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
            const selectedIds: string[] = [];
            layout.nodes.forEach(node => {
                const nodeScreenX = (node.x! * zoom) + pan.x;
                const nodeScreenY = (node.y! * zoom) + pan.y;
                const nodeW = (node.width || 100) * zoom;
                const nodeH = (node.height || 40) * zoom;

                if (nodeScreenX < x2 && nodeScreenX + nodeW > x1 && nodeScreenY < y2 && nodeScreenY + nodeH > y1) {
                    selectedIds.push(node.id);
                }
            });

            if (e.shiftKey) {
                const newSelection = new Set([...selectedNodeIds, ...selectedIds]);
                setMultiSelection(Array.from(newSelection));
            } else {
                setMultiSelection(selectedIds);
            }
        }
        setSelectionBox(null);
    }
    
    if (dragCreation && dragCreation.sourceId && layout) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const targetNode = layout.nodes.find(node => 
            coords.x >= node.x! && coords.x <= node.x! + node.width! &&
            coords.y >= node.y! && coords.y <= node.y! + node.height!
        );

        if (targetNode && targetNode.id !== dragCreation.sourceId) {
            connectNodes(dragCreation.sourceId, targetNode.id);
        } else {
            const parentNode = layout.nodes.find(n => n.id === dragCreation.sourceId);
            if (parentNode) {
                const defaultX = parentNode.x! + (parentNode.width || 150) + 100;
                const defaultY = parentNode.y!;
                const targetX = coords.x;
                const targetY = coords.y - 20;
                addChildNodeAt(dragCreation.sourceId, { x: targetX - defaultX, y: targetY - defaultY });
            }
        }
        setDragCreation(null);
        setHoveredNodeId(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      if (!currentMap || !layout) return;
      if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
          const coords = getCanvasCoords(e.clientX, e.clientY);
          let parentId = selectedNodeId || lastSelectedNodeRef.current || currentMap.rootId;
          if (!layout.nodes.find(n => n.id === parentId)) parentId = currentMap.rootId;

          const parentNode = layout.nodes.find(n => n.id === parentId);
          if (parentNode) {
              const defaultX = parentNode.x! + (parentNode.width || 150) + 100;
              const defaultY = parentNode.y!;
              addChildNodeAt(parentId, { x: (coords.x - 75) - defaultX, y: (coords.y - 20) - defaultY });
          }
      }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom(prev => Math.min(Math.max(0.2, prev + delta), 3));
    }
  };

  // --- EXPORT & IMPORT LOGIC ---

  const getDescendantIds = (rootId: string, allNodes: any[]): Set<string> => {
      const descendants = new Set<string>();
      const stack = [rootId];
      while (stack.length > 0) {
          const currId = stack.pop()!;
          descendants.add(currId);
          const node = allNodes.find(n => n.id === currId);
          if (node && node.childrenIds) {
              node.childrenIds.forEach((childId: string) => stack.push(childId));
          }
      }
      return descendants;
  };

  const handleExecuteExport = async () => {
      if (!currentMap || !layout) return;

      if (exportFormat === 'JSON') {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentMap, null, 2));
          const link = document.createElement('a');
          link.href = dataStr;
          link.download = `${currentMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setShowExportDialog(false);
          return;
      }

      if (exportFormat === 'PNG') {
          setIsProcessingExport(true);
          await new Promise(r => setTimeout(r, 200));

          if (exportRef.current) {
              try {
                  const canvas = await html2canvas(exportRef.current, {
                      backgroundColor: '#0a0e27',
                      scale: 2, 
                      logging: false,
                      useCORS: true,
                      width: exportRef.current.scrollWidth,
                      height: exportRef.current.scrollHeight,
                      windowWidth: exportRef.current.scrollWidth,
                      windowHeight: exportRef.current.scrollHeight,
                      x: 0,
                      y: 0
                  });

                  const link = document.createElement('a');
                  link.download = `${currentMap.title || 'mindmap'}.png`;
                  link.href = canvas.toDataURL('image/png');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              } catch (err) {
                  console.error("Export Error:", err);
                  alert("Erro ao gerar imagem.");
              }
          }
          setIsProcessingExport(false);
          setShowExportDialog(false);
      }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const json = JSON.parse(ev.target?.result as string);
              importMap(json);
              setShowExportDialog(false);
          } catch (err) {
              alert("Erro ao ler o arquivo JSON. Certifique-se de que é um arquivo válido.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  const exportLayout = useMemo(() => {
      if (!layout || !isProcessingExport) return null;

      let nodesToExport = layout.nodes;
      
      if (exportScope === 'BRANCH' && selectedNodeId) {
          const ids = getDescendantIds(selectedNodeId, layout.nodes);
          nodesToExport = layout.nodes.filter(n => ids.has(n.id));
      }

      if (nodesToExport.length === 0) return null;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodesToExport.forEach(n => {
          if (n.x! < minX) minX = n.x!;
          if (n.y! < minY) minY = n.y!;
          if (n.x! + n.width! > maxX) maxX = n.x! + n.width!;
          if (n.y! + n.height! > maxY) maxY = n.y! + n.height!;
      });

      const padding = 60; 
      const width = maxX - minX + (padding * 2);
      const height = maxY - minY + (padding * 2);

      const shiftX = -minX + padding;
      const shiftY = -minY + padding;

      return {
          width,
          height,
          nodes: nodesToExport,
          shiftX,
          shiftY
      };
  }, [layout, isProcessingExport, exportScope, selectedNodeId]);


  if (!currentMap || !layout) return <div className="flex-1 bg-[#0a0e27] flex items-center justify-center text-gray-500">Carregando...</div>;

  const selectedNodeLayout = selectedNodeId ? layout.nodes.find(n => n.id === selectedNodeId) : null;
  const toolbarPosition = selectedNodeLayout ? { x: selectedNodeLayout.x! + (selectedNodeLayout.width! / 2), y: selectedNodeLayout.y! } : undefined;

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-[#0a0e27] relative overflow-hidden cursor-default select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => handleContextMenu(e, [
          { label: 'Centralizar Mapa', icon: 'target', onClick: () => { setZoom(1); setPan({x: 50, y: 50}); } },
          { label: 'Exportar Imagem', icon: 'image', onClick: () => { setExportFormat('PNG'); handleExecuteExport(); } }
      ])}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {!isProcessingExport && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
            <button 
                onClick={() => setShowExportDialog(true)}
                className={`w-8 h-8 rounded flex items-center justify-center border transition-all shadow-lg ${showExportDialog ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e233c] border-white/10 text-gray-400 hover:text-white'}`}
                title="Portabilidade"
            >
                <Icon name="download" size={16} />
            </button>

            <div className="h-[1px] bg-white/10 my-1"></div>

            <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="w-8 h-8 bg-[#1e233c] hover:bg-white/10 rounded flex items-center justify-center text-white border border-white/10 shadow-lg"><Icon name="plus" size={16} /></button>
            <div className="w-8 h-8 bg-[#1e233c] flex items-center justify-center text-[10px] text-gray-400 font-bold border border-white/10 rounded">{Math.round(zoom * 100)}%</div>
            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))} className="w-8 h-8 bg-[#1e233c] hover:bg-white/10 rounded flex items-center justify-center text-white border border-white/10 shadow-lg"><Icon name="minus" size={16} /></button>
            <button onClick={() => { setZoom(1); setPan({x: 50, y: 50}); }} className="w-8 h-8 bg-[#1e233c] hover:bg-white/10 rounded flex items-center justify-center text-white border border-white/10 shadow-lg mt-2"><Icon name="maximize" size={16} /></button>
          </div>
      )}

      {/* Portability Dialog */}
      {showExportDialog && !isProcessingExport && (
          <div className="absolute top-16 right-4 w-64 bg-[#14182d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.1s_ease] z-[100]">
              <div className="p-4 bg-[#0f1223] border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Portabilidade</h3>
                  <button onClick={() => setShowExportDialog(false)}><Icon name="x" size={14} className="text-gray-500 hover:text-white" /></button>
              </div>
              <div className="p-4 space-y-4">
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-400">
                          <Icon name="download" size={14} />
                          <span className="text-[10px] font-bold uppercase">Exportar</span>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Alcance</label>
                          <div className="flex bg-[#0a0e27] rounded-lg p-1 border border-white/5">
                              <button onClick={() => setExportScope('FULL')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${exportScope === 'FULL' ? 'bg-[#1e233c] text-blue-400 shadow-sm' : 'text-gray-500 hover:text-white'}`}>Tudo</button>
                              <button 
                                onClick={() => setExportScope('BRANCH')} 
                                disabled={!selectedNodeId}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${exportScope === 'BRANCH' ? 'bg-[#1e233c] text-blue-400 shadow-sm' : 'text-gray-500 hover:text-white disabled:opacity-30'}`}
                              >
                                  Ramo
                              </button>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Formato</label>
                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => setExportFormat('PNG')} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${exportFormat === 'PNG' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-[#0a0e27] border-white/5 text-gray-400 hover:border-white/10'}`}>
                                  <Icon name="image" size={12} /> <span className="text-[10px] font-bold">PNG</span>
                              </button>
                              <button onClick={() => setExportFormat('JSON')} className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${exportFormat === 'JSON' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-[#0a0e27] border-white/5 text-gray-400 hover:border-white/10'}`}>
                                  <Icon name="code" size={12} /> <span className="text-[10px] font-bold">JSON</span>
                              </button>
                          </div>
                      </div>

                      <button 
                        onClick={handleExecuteExport}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95"
                      >
                          Baixar Arquivo
                      </button>
                  </div>

                  <div className="h-[1px] bg-white/5"></div>

                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-400">
                          <Icon name="rotateCw" size={14} />
                          <span className="text-[10px] font-bold uppercase">Importar</span>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-relaxed">
                          Carregue um arquivo JSON de backup para restaurar ou visualizar um mapa.
                      </p>
                      <button 
                        onClick={() => importInputRef.current?.click()}
                        className="w-full py-2 bg-[#1e233c] hover:bg-[#252b48] text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                          <Icon name="folderOpen" size={12} /> Selecionar Arquivo
                      </button>
                      <input 
                        type="file" 
                        accept=".json" 
                        ref={importInputRef} 
                        onChange={handleImportJSON} 
                        className="hidden" 
                      />
                  </div>
              </div>
          </div>
      )}

      {isProcessingExport && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0a0e27] flex-col gap-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white font-bold animate-pulse text-sm tracking-widest uppercase">Renderizando Mapa...</p>
        </div>
      )}

      {isProcessingExport && exportLayout && (
          <div 
            ref={exportRef}
            className="absolute top-0 left-0 bg-[#0a0e27] z-[-1]" 
            style={{
                width: exportLayout.width,
                height: exportLayout.height,
                pointerEvents: 'none',
            }}
          >
              <svg 
                width={exportLayout.width} 
                height={exportLayout.height} 
                className="absolute top-0 left-0 overflow-visible"
              >
                  {exportLayout.nodes.map(node => {
                      return node.childrenIds.map(childId => {
                          const child = exportLayout.nodes.find(n => n.id === childId);
                          if (!child || node.isCollapsed) return null;
                          
                          const startX = node.x! + node.width! + exportLayout.shiftX;
                          const startY = node.y! + (node.height! / 2) + exportLayout.shiftY;
                          const endX = child.x! + exportLayout.shiftX;
                          const endY = child.y! + (child.height! / 2) + exportLayout.shiftY;
                          
                          const c1x = startX + (endX - startX) / 2;
                          const c1y = startY;
                          const c2x = startX + (endX - startX) / 2;
                          const c2y = endY;
                          
                          const d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

                          return (
                            <path 
                                key={`export-conn-${node.id}-${child.id}`}
                                d={d}
                                stroke={node.color || '#3b82f6'}
                                strokeWidth="2"
                                fill="none"
                            />
                          );
                      });
                  })}
              </svg>

              {exportLayout.nodes.map(node => (
                  <div
                    key={`export-node-${node.id}`}
                    style={{
                        position: 'absolute',
                        left: node.x! + exportLayout.shiftX,
                        top: node.y! + exportLayout.shiftY,
                        width: node.width,
                        minHeight: node.height,
                    }}
                  >
                      <MindMapNodeComponent 
                          node={node} 
                          isRoot={node.id === currentMap.rootId} 
                          zoom={1} 
                          onContextMenu={() => {}} 
                      />
                  </div>
              ))}
          </div>
      )}

      <div 
        ref={contentRef}
        className={`absolute transition-transform duration-75 origin-top-left ${isProcessingExport ? 'invisible' : 'visible'}`}
        style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '100%', height: '100%'
        }}
      >
        <MindMapToolbar position={toolbarPosition} />

        <svg width={layout.width} height={layout.height} className="absolute top-0 left-0 pointer-events-none overflow-visible">
            {dragCreation && (
                <line x1={dragCreation.x} y1={dragCreation.y} x2={mousePos.x} y2={mousePos.y} stroke={hoveredNodeId ? "#22c55e" : "#3b82f6"} strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
            )}
            {layout.nodes.map(node => {
                return node.childrenIds.map(childId => {
                    const child = layout.nodes.find(n => n.id === childId);
                    if (!child || node.isCollapsed) return null;
                    const startX = node.x! + node.width!;
                    const startY = node.y! + (node.height! / 2);
                    const endX = child.x!;
                    const endY = child.y! + (child.height! / 2);
                    return <MindMapConnection key={`${node.id}-${child.id}`} startX={startX} startY={startY} endX={endX} endY={endY} color={node.color || '#3b82f6'} childId={child.id} />;
                });
            })}
        </svg>

        {layout.nodes.map(node => (
            <div 
                key={`ghost-${node.id}`}
                className={hoveredNodeId === node.id ? "ring-2 ring-green-400 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all" : ""}
                style={{ position: 'absolute', left: node.x, top: node.y, width: node.width, height: node.height, pointerEvents: 'none' }}
            />
        ))}

        {layout.nodes.map(node => (
            <MindMapNodeComponent 
                key={node.id} 
                node={node} 
                isRoot={node.id === currentMap.rootId}
                zoom={zoom}
                onContextMenu={handleNodeContextMenu}
            />
        ))}
      </div>

      {selectionBox && (
          <div 
            className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50"
            style={{
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                height: Math.abs(selectionBox.currentY - selectionBox.startY)
            }}
          />
      )}
    </div>
  );
};

export default MindMapCanvas;
