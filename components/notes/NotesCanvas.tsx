
import React, { useRef, useState, useEffect } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import BlockItem from './BlockItem';
import CanvasConnection from './CanvasConnection';
import { Icon } from '../ui/Icon';

const NotesCanvas: React.FC = () => {
  const { 
      blocks, 
      connections, 
      camera, 
      setCamera, 
      addBlock,
      addTemplate,
      focusedBlockId, 
      connectionStartId,
      setConnectionStartId
  } = useNotes();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Linha temporária para conexão manual
  const [tempLineEnd, setTempLineEnd] = useState<{ x: number, y: number } | null>(null);

  // Background pattern
  const gridSize = 40 * camera.zoom;
  const backgroundSize = `${gridSize}px ${gridSize}px`;

  // Filtrar blocos que não estão na lixeira
  const visibleBlocks = blocks.filter(b => !b.isTrash);

  // --- Helpers de Coordenadas ---
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      
      const x = (relX - camera.x) / camera.zoom;
      const y = (relY - camera.y) / camera.zoom;
      
      return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (focusedBlockId) return;

    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const newZoom = Math.min(Math.max(0.1, camera.zoom - e.deltaY * zoomSensitivity), 3);
        setCamera({ zoom: newZoom });
    } else {
        if (!e.shiftKey) { 
             setCamera({ x: camera.x - e.deltaX, y: camera.y - e.deltaY });
        }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (focusedBlockId) return;
    
    if (connectionStartId && !((e.target as HTMLElement).closest('.canvas-note-block'))) {
        setConnectionStartId(null);
        setTempLineEnd(null);
        return;
    }

    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'canvas-bg') {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectionStartId) {
        const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
        setTempLineEnd({ x, y });
    }

    if (isPanning) {
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        setCamera({ x: camera.x + deltaX, y: camera.y + deltaY });
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      if (focusedBlockId) return;
      
      const target = e.target as HTMLElement;
      if (target === canvasRef.current || target.id === 'canvas-bg' || target.tagName === 'svg') {
          const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
          addBlock('text', { x: x - 150, y: y - 100 });
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const templateId = e.dataTransfer.getData('application/studyhub-template-id');
      if (templateId) {
          addTemplate(templateId, { x: x - 250, y: y - 200 });
          return;
      }
      const type = e.dataTransfer.getData('application/studyhub-block-type');
      if (type) {
          addBlock(type as any, { x: x - 150, y: y - 100 });
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (focusedBlockId) return;
          if (e.key === '0' && (e.ctrlKey || e.metaKey)) setCamera({ x: 0, y: 0, zoom: 1 });
          if (e.key === 'Escape' && connectionStartId) {
              setConnectionStartId(null);
              setTempLineEnd(null);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedBlockId, setCamera, connectionStartId]);

  return (
    <div 
        className="w-full h-full relative overflow-hidden bg-[#0a0e27] cursor-default select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
        <div className="absolute top-6 left-6 z-50 flex gap-2 bg-[#1e233c]/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-xl pointer-events-none">
            <div className="flex items-center gap-2 px-2 text-xs font-mono text-gray-500">
                Zoom: {Math.round(camera.zoom * 100)}%
            </div>
            {connectionStartId && (
                <div className="flex items-center px-2 text-xs text-blue-400 font-bold animate-pulse">
                    Selecione o destino...
                </div>
            )}
        </div>

        <div 
            ref={canvasRef}
            id="canvas-bg"
            className="w-full h-full origin-top-left transition-transform duration-75 ease-out"
            style={{
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: backgroundSize,
                backgroundPosition: '0 0'
            }}
        >
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
                {connections.map(conn => {
                    const fromBlock = visibleBlocks.find(b => b.id === conn.fromBlockId);
                    const toBlock = visibleBlocks.find(b => b.id === conn.toBlockId);
                    if (!fromBlock || !toBlock) return null;
                    return <CanvasConnection key={conn.id} connection={conn} fromPos={fromBlock.position} toPos={toBlock.position} />;
                })}

                {connectionStartId && tempLineEnd && (() => {
                    const startBlock = visibleBlocks.find(b => b.id === connectionStartId);
                    if (!startBlock) return null;
                    const startX = startBlock.position.x + startBlock.position.width / 2;
                    const startY = startBlock.position.y + startBlock.position.height / 2;
                    return (
                        <line 
                            x1={startX} y1={startY} 
                            x2={tempLineEnd.x} y2={tempLineEnd.y} 
                            stroke="#3b82f6" 
                            strokeWidth="2" 
                            strokeDasharray="5,5" 
                            className="animate-pulse"
                        />
                    );
                })()}
            </svg>

            {visibleBlocks.map(block => (
                <BlockItem 
                    key={block.id} 
                    block={block} 
                    zoom={camera.zoom} 
                />
            ))}
        </div>
    </div>
  );
};

export default NotesCanvas;
