
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { OcclusionRect } from '../../types';

interface ImageOcclusionEditorProps {
  imageUrl: string;
  onSave: (rects: OcclusionRect[]) => void;
  onCancel: () => void;
}

const ImageOcclusionEditor: React.FC<ImageOcclusionEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const [rects, setRects] = useState<OcclusionRect[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState<OcclusionRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = getRelativeCoords(e);
    setIsDrawing(true);
    setCurrentRect({
      id: 'temp_' + Date.now(),
      x, y, width: 0, height: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentRect) return;
    const { x, y } = getRelativeCoords(e);
    setCurrentRect(prev => prev ? ({
      ...prev,
      width: x - prev.x,
      height: y - prev.y
    }) : null);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    
    // Filtra retângulos muito pequenos (clicks acidentais)
    if (Math.abs(currentRect.width) > 0.5 && Math.abs(currentRect.height) > 0.5) {
      // Normaliza valores negativos (arrastar para trás/cima)
      const normalized = {
        ...currentRect,
        id: 'rect_' + Date.now() + Math.random().toString(36).substr(2, 5),
        x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
        y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
        width: Math.abs(currentRect.width),
        height: Math.abs(currentRect.height)
      };
      setRects(prev => [...prev, normalized]);
    }
    
    setIsDrawing(false);
    setCurrentRect(null);
  };

  const removeRect = (id: string) => {
    setRects(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e27] animate-[fadeIn_0.2s_ease]">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f1223]">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Editor de Oclusão</h3>
          <p className="text-[10px] text-gray-500 mt-1">Clique e arraste para esconder áreas da imagem. Cada área vira um card.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">Cancelar</button>
          <button 
            disabled={rects.length === 0}
            onClick={() => onSave(rects)} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Gerar {rects.length} Cards
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
        <div 
          ref={containerRef}
          className="relative max-w-full max-h-full shadow-2xl cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img 
            src={imageUrl} 
            alt="Base" 
            className="max-w-full max-h-[70vh] block pointer-events-none rounded-lg"
          />
          
          {/* Rects Existentes */}
          {rects.map(rect => (
            <div 
              key={rect.id}
              className="absolute border-2 border-blue-500 bg-blue-500/20 group"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); removeRect(rect.id); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}

          {/* Rect em Desenho */}
          {currentRect && (
            <div 
              className="absolute border-2 border-yellow-400 bg-yellow-400/20 pointer-events-none"
              style={{
                left: `${currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x}%`,
                top: `${currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y}%`,
                width: `${Math.abs(currentRect.width)}%`,
                height: `${Math.abs(currentRect.height)}%`
              }}
            />
          )}
        </div>
      </div>
      
      <div className="p-4 bg-[#0a0e27] border-t border-white/5 flex justify-center gap-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
         <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Áreas de Oclusão: {rects.length}</span>
         <span className="flex items-center gap-2"><Icon name="mousePointer" size={12} /> Desenhe retângulos</span>
      </div>
    </div>
  );
};

export default ImageOcclusionEditor;
