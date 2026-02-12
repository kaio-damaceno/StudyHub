
import React, { useRef, useEffect, useState } from 'react';
import { useMindMap } from '../../contexts/MindMapContext';
import { Icon } from '../ui/Icon';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#a855f7', '#ec4899', '#ffffff', '#1e233c'];

interface MindMapToolbarProps {
    position?: { x: number, y: number };
}

const MindMapToolbar: React.FC<MindMapToolbarProps> = ({ position }) => {
  const { selectedNodeId, currentMap, updateNode, deleteNode } = useMindMap();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!selectedNodeId || !currentMap || !position) return null;
  const node = currentMap.nodes[selectedNodeId];
  if (!node) return null;

  const style = node.style || {};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateNode(node.id, { image: ev.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const updateStyle = (newStyle: Partial<typeof style>) => {
    updateNode(node.id, { style: { ...style, ...newStyle } });
  };

  const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (node.text) {
          navigator.clipboard.writeText(node.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
      }
  };

  // Previne que cliques na toolbar propaguem para o canvas (evita deseleção)
  const stopProp = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault(); // Importante para não tirar foco
  };

  return (
    <div 
        ref={toolbarRef}
        className="absolute z-[100] flex items-center gap-2 p-1.5 bg-[#1e233c]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl animate-[fadeIn_0.1s_ease]"
        style={{ 
            top: position.y - 50, 
            left: position.x,
            transform: 'translateX(-50%)' 
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
    >
      
      {/* Font Controls */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-2">
        <button 
          onClick={(e) => { stopProp(e); updateStyle({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' }); }}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${style.fontWeight === 'bold' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400'}`}
          title="Negrito"
        >
          <Icon name="bold" size={14} />
        </button>
        <button 
          onClick={(e) => { stopProp(e); updateStyle({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' }); }}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${style.fontStyle === 'italic' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400'}`}
          title="Itálico"
        >
          <Icon name="italic" size={14} />
        </button>
        <div className="flex flex-col gap-0.5">
            <button onMouseDown={stopProp} onClick={() => updateStyle({ fontSize: Math.min(36, (style.fontSize || 14) + 2) })} className="p-0.5 px-1 hover:bg-white/10 rounded text-[8px] text-gray-400"><Icon name="chevronUp" size={8} /></button>
            <button onMouseDown={stopProp} onClick={() => updateStyle({ fontSize: Math.max(10, (style.fontSize || 14) - 2) })} className="p-0.5 px-1 hover:bg-white/10 rounded text-[8px] text-gray-400"><Icon name="chevronDown" size={8} /></button>
        </div>
        <span className="text-[10px] font-mono text-gray-500 w-4 text-center">{style.fontSize || 14}</span>
      </div>

      {/* Color Pickers */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-2 pl-1">
         <div className="relative group">
            <button className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center" style={{ backgroundColor: node.color || '#3b82f6' }}>
               <div className="w-2 h-2 bg-white rounded-full opacity-50" />
            </button>
            {/* Popover */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#0f1223] border border-white/10 p-2 rounded-lg shadow-xl grid grid-cols-4 gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto w-32 z-50">
                {COLORS.map(c => (
                    <button key={c} onClick={(e) => { stopProp(e); updateNode(node.id, { color: c }); }} className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                ))}
            </div>
         </div>

         <div className="relative group">
            <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10">
                <Icon name="palette" size={14} />
            </button>
            {/* Popover */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#0f1223] border border-white/10 p-2 rounded-lg shadow-xl flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto min-w-[140px] z-50">
                <div className="text-[9px] text-gray-500 uppercase font-bold px-1">Fundo</div>
                <div className="grid grid-cols-5 gap-1">
                    <button onClick={(e) => { stopProp(e); updateStyle({ backgroundColor: undefined }); }} className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-red-500 text-[8px]"><Icon name="x" size={10}/></button>
                    {COLORS.map(c => (
                        <button key={c} onClick={(e) => { stopProp(e); updateStyle({ backgroundColor: c }); }} className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                    ))}
                </div>
                <div className="text-[9px] text-gray-500 uppercase font-bold px-1 mt-1">Texto</div>
                <div className="grid grid-cols-5 gap-1">
                    {COLORS.map(c => (
                        <button key={c} onClick={(e) => { stopProp(e); updateStyle({ textColor: c }); }} className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform flex items-center justify-center font-bold text-[10px]" style={{ color: c }}>A</button>
                    ))}
                </div>
            </div>
         </div>
      </div>

      {/* Image, Copy & Delete */}
      <div className="flex items-center gap-1 pl-1">
        
        {/* COPY BUTTON ADDED */}
        <button 
            onClick={handleCopy} 
            className={`p-1.5 rounded transition-colors ${copied ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Copiar texto"
        >
            <Icon name={copied ? "checkSquare" : "copy"} size={14} />
        </button>

        <button onClick={(e) => { stopProp(e); fileInputRef.current?.click(); }} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors" title="Adicionar Imagem">
            <Icon name="image" size={14} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        
        {node.image && (
            <button onClick={(e) => { stopProp(e); updateNode(node.id, { image: undefined }); }} className="p-1.5 rounded hover:bg-white/10 text-red-400 transition-colors" title="Remover Imagem">
                <Icon name="x" size={14} />
            </button>
        )}

        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

        <button onClick={(e) => { stopProp(e); if(node.id !== currentMap.rootId) deleteNode(node.id); }} disabled={node.id === currentMap.rootId} className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30">
            <Icon name="trash" size={14} />
        </button>
      </div>

    </div>
  );
};

export default MindMapToolbar;
