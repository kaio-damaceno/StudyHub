
import React, { useState, useRef, useEffect } from 'react';
import { VisionBlock } from '../../types';
import { useVisionBoard } from '../../contexts/VisionBoardContext';
import { Icon } from '../ui/Icon';
import { useContextMenu } from '../../hooks/useContextMenu';

interface VisionBlockProps {
  block: VisionBlock;
  canvasRect: DOMRect | null;
  onSnap?: (guides: { x: number | null, y: number | null }) => void;
  zoom?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

const VisionBlockComponent: React.FC<VisionBlockProps> = ({ block, canvasRect, onSnap, zoom = 1, isSelected, onSelect }) => {
  const { updateBlock, removeBlock, isEditing, blocks, reorderLayer } = useVisionBoard();
  const { handleContextMenu } = useContextMenu();

  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Estado para controlar edição de texto separada da seleção
  const [isTextEditing, setIsTextEditing] = useState(false);
  
  // Estado para animação de entrada
  const [mounted, setMounted] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const blockStartPos = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ w: 0, h: 0 });

  useEffect(() => {
    // Ativa a animação logo após a montagem
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
      if (!isSelected) {
          setIsTextEditing(false);
      }
  }, [isSelected]);

  const onContextMenu = (e: React.MouseEvent) => {
      if (!isEditing) return;
      handleContextMenu(e, [
          { label: 'Trazer para Frente', icon: 'layers', onClick: () => reorderLayer(block.id, 'front') },
          { label: 'Enviar para Trás', icon: 'layers', onClick: () => reorderLayer(block.id, 'back') },
          { type: 'separator' },
          { label: 'Duplicar', icon: 'copyPlus', onClick: () => {
              // Lógica de duplicação simplificada (idealmente no contexto)
              // Aqui chamamos apenas um callback imaginário ou placeholder se não houver no contexto
              // Mas o App global tem atalhos de teclado para isso (Ctrl+C/V)
          }},
          { type: 'separator' },
          { label: 'Excluir', icon: 'trash', variant: 'danger', onClick: () => removeBlock(block.id) }
      ]);
  };

  // Funções de Arraste de Posição com Snapping Magnético
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || (e.target as HTMLElement).closest('.no-drag')) return;
    
    // Se estiver editando texto, não inicia arraste pelo clique no input
    if (isTextEditing) return;

    if (onSelect) onSelect();

    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    blockStartPos.current = { x: block.x, y: block.y };

    const move = (ev: MouseEvent) => {
      if (!canvasRect) return;

      const dxPct = ((ev.clientX - dragStartPos.current.x) / canvasRect.width) * 100;
      const dyPct = ((ev.clientY - dragStartPos.current.y) / canvasRect.height) * 100;
      
      let newX = blockStartPos.current.x + dxPct;
      let newY = blockStartPos.current.y + dyPct;

      const newXpx = (newX / 100) * canvasRect.width;
      const newYpx = (newY / 100) * canvasRect.height;
      
      const widthPx = block.width * zoom;
      const heightPx = block.height * zoom;

      const SNAP_THRESHOLD = 5; 
      let snapX: number | null = null;
      let snapY: number | null = null;

      const otherBlocks = blocks.filter(b => b.id !== block.id);
      
      for (const other of otherBlocks) {
          const otherXpx = (other.x / 100) * canvasRect.width;
          const otherYpx = (other.y / 100) * canvasRect.height;
          const otherW = other.width * zoom;
          const otherH = other.height * zoom;

          if (snapX === null) {
              if (Math.abs(newXpx - otherXpx) < SNAP_THRESHOLD) { newX = other.x; snapX = otherXpx; }
              else if (Math.abs(newXpx - (otherXpx + otherW)) < SNAP_THRESHOLD) { newX = ((otherXpx + otherW) / canvasRect.width) * 100; snapX = otherXpx + otherW; }
              else if (Math.abs((newXpx + widthPx) - otherXpx) < SNAP_THRESHOLD) { newX = ((otherXpx - widthPx) / canvasRect.width) * 100; snapX = otherXpx; }
              else if (Math.abs((newXpx + widthPx) - (otherXpx + otherW)) < SNAP_THRESHOLD) { newX = ((otherXpx + otherW - widthPx) / canvasRect.width) * 100; snapX = otherXpx + otherW; }
              else if (Math.abs((newXpx + widthPx/2) - (otherXpx + otherW/2)) < SNAP_THRESHOLD) { newX = ((otherXpx + otherW/2 - widthPx/2) / canvasRect.width) * 100; snapX = otherXpx + otherW/2; }
          }

          if (snapY === null) {
              if (Math.abs(newYpx - otherYpx) < SNAP_THRESHOLD) { newY = other.y; snapY = otherYpx; }
              else if (Math.abs(newYpx - (otherYpx + otherH)) < SNAP_THRESHOLD) { newY = ((otherYpx + otherH) / canvasRect.height) * 100; snapY = otherYpx + otherH; }
              else if (Math.abs((newYpx + heightPx) - otherYpx) < SNAP_THRESHOLD) { newY = ((otherYpx - heightPx) / canvasRect.height) * 100; snapY = otherYpx; }
              else if (Math.abs((newYpx + heightPx) - (otherYpx + otherH)) < SNAP_THRESHOLD) { newY = ((otherYpx + otherH - heightPx) / canvasRect.height) * 100; snapY = otherYpx + otherH; }
              else if (Math.abs((newYpx + heightPx/2) - (otherYpx + otherH/2)) < SNAP_THRESHOLD) { newY = ((otherYpx + otherH/2 - heightPx/2) / canvasRect.height) * 100; snapY = otherYpx + otherH/2; }
          }
      }

      if (onSnap) onSnap({ x: snapX, y: snapY });

      updateBlock(block.id, { x: newX, y: newY });
    };

    const up = () => {
      setIsDragging(false);
      if (onSnap) onSnap({ x: null, y: null });
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const blockEl = document.getElementById(`block-${block.id}`);
    if (!blockEl) return;
    
    const rect = blockEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const move = (ev: MouseEvent) => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      const degree = angle * (180 / Math.PI) + 90;
      updateBlock(block.id, { rotation: degree });
    };

    const up = () => {
      setIsRotating(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { w: block.width, h: block.height };

    const move = (ev: MouseEvent) => {
      const dw = (ev.clientX - dragStartPos.current.x) / zoom;
      const dh = (ev.clientY - dragStartPos.current.y) / zoom;
      
      updateBlock(block.id, { 
        width: Math.max(100, sizeStart.current.w + dw), 
        height: Math.max(50, sizeStart.current.h + dh) 
      });
    };

    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    cursive: 'font-serif italic',
    mono: 'font-mono uppercase tracking-widest'
  }[block.content.style?.fontFamily || 'sans'];

  const renderMedia = () => {
    if (block.type === 'image') {
      return <img src={block.content.url} className="w-full h-full object-cover pointer-events-none select-none" />;
    }

    if (block.type === 'video') {
      const url = block.content.url || '';
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      
      if (isYoutube) {
        let videoId = '';
        if (url.includes('shorts/')) videoId = url.split('shorts/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else videoId = url.split('/').pop() || '';
        
        return (
          <div className="w-full h-full relative">
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`}
              className="w-full h-full border-none scale-[1.05]"
              allow="autoplay; encrypted-media"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-transparent z-10 pointer-events-auto" />
            )}
          </div>
        );
      } 
      
      return (
        <video 
          src={url} 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover pointer-events-none"
        />
      );
    }
    return null;
  };

  const showSelectionBorder = isEditing && (isSelected || isHovered);
  const visualBorder = block.content.style?.hasBorder ? `2px solid ${block.content.style.borderColor || block.content.style.color || '#fff'}` : 'none';

  return (
    <div 
      id={`block-${block.id}`}
      className={`absolute group transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isEditing ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-auto'
      } ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{
        left: `${block.x}%`,
        top: `${block.y}%`,
        width: `${block.width}px`,
        height: `${block.height}px`,
        zIndex: block.z,
        transform: `rotate(${block.rotation}deg) scale(${mounted ? 1 : 0.5})`,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()} 
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
          if (block.type === 'text' && isEditing) {
              e.stopPropagation();
              setIsTextEditing(true);
          }
      }}
    >
      <div 
        className={`w-full h-full relative rounded-3xl overflow-hidden transition-all duration-300`}
        style={{
            boxShadow: showSelectionBorder ? '0 0 0 2px rgba(59,130,246,0.5), 0 20px 60px rgba(0,0,0,0.5)' : 'none',
            border: visualBorder,
            backgroundColor: showSelectionBorder ? 'rgba(30, 35, 60, 0.4)' : 'transparent',
            backdropFilter: showSelectionBorder ? 'blur(8px)' : 'none',
            transform: isSelected && isEditing ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        
        {block.type === 'text' && (
          <div 
            className={`w-full h-full p-8 flex items-center justify-center text-center ${fontClass} outline-none overflow-hidden leading-relaxed ${isTextEditing ? 'cursor-text select-text' : 'cursor-grab select-none'}`}
            style={{ 
              fontSize: `${block.content.style?.fontSize}px`, 
              color: block.content.style?.color,
              fontWeight: block.content.style?.bold ? '900' : 'normal',
              fontStyle: block.content.style?.italic ? 'italic' : 'normal',
              textDecoration: block.content.style?.underline ? 'underline' : block.content.style?.strikethrough ? 'line-through' : 'none',
              backgroundColor: block.content.style?.backgroundColor || 'transparent',
              verticalAlign: block.content.style?.subscript ? 'sub' : 'baseline',
              pointerEvents: isTextEditing ? 'auto' : 'none'
            }}
            contentEditable={isEditing && isTextEditing}
            onBlur={(e) => {
              updateBlock(block.id, { content: { ...block.content, text: e.currentTarget.innerText } });
              setIsTextEditing(false);
            }}
            onMouseDown={(e) => { 
                if (isTextEditing) e.stopPropagation();
            }}
            suppressContentEditableWarning
          >
            {block.content.text}
          </div>
        )}

        {(block.type === 'image' || block.type === 'video') && renderMedia()}

        {isEditing && isSelected && !isTextEditing && (
          <>
            {/* Handle de Rotação Manual */}
            <div 
              className={`absolute top-[-45px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity no-drag z-50`}
              onMouseDown={handleRotateMouseDown}
            >
              <div className={`w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-alias shadow-xl border-2 border-white/20 hover:scale-110 transition-transform ${isRotating ? 'bg-blue-400' : ''}`}>
                <Icon name="refresh" size={16} />
              </div>
              <div className="w-[2px] h-4 bg-blue-600/40" />
            </div>

            <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600/90 rounded-full text-[9px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              C {block.z}
            </div>

            {/* Reduzimos para apenas resize, pois o menu contextual cuida das ações */}
            <div 
              className="absolute bottom-0 right-0 w-12 h-12 cursor-nwse-resize opacity-0 group-hover:opacity-100 flex items-end justify-end p-2 no-drag"
              onMouseDown={handleResize}
            >
              <div className="w-6 h-6 border-r-4 border-b-4 border-white/20 rounded-br-2xl" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VisionBlockComponent;
