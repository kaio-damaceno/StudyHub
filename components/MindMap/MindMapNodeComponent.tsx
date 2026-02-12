
import React, { useState, useRef, useEffect } from 'react';
import { MindMapNode } from '../../types';
import { useMindMap } from '../../contexts/MindMapContext';
import { Icon } from '../ui/Icon';

interface MindMapNodeProps {
  node: MindMapNode;
  isRoot: boolean;
  zoom: number;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
}

const MindMapNodeComponent: React.FC<MindMapNodeProps> = ({ node, isRoot, zoom, onContextMenu }) => {
  // Contextos
  const { 
    addChildNode, 
    addSiblingNode, 
    updateNode, 
    deleteNode, 
    toggleCollapse, 
    selectedNodeId, 
    selectedNodeIds,
    selectNode,
    toggleNodeSelection,
    setDragCreation,
    setViewingReference
  } = useMindMap();
  
  // Estado local
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.text);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);

  const isSelected = selectedNodeIds.has(node.id);
  const isPrimary = selectedNodeId === node.id;
  const style = node.style || {};

  const nodeReferences = node.references || [];

  // Auto-resize do textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
      setEditValue(node.text);
  }, [node.text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
        if (e.key === 'Enter' && !e.shiftKey) { // Enter salva, Shift+Enter quebra linha
            e.preventDefault(); e.stopPropagation();
            updateNode(node.id, { text: editValue });
            setIsEditing(false);
        } else if (e.key === 'Escape') {
            e.preventDefault(); e.stopPropagation();
            setEditValue(node.text);
            setIsEditing(false);
        }
    } else {
        if (e.key === 'Enter') {
            e.preventDefault(); e.stopPropagation();
            if (!isRoot) addSiblingNode(node.id);
        } else if (e.key === 'Tab') {
            e.preventDefault(); e.stopPropagation();
            addChildNode(node.id);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault(); e.stopPropagation();
            deleteNode(node.id);
        } else if (e.key === ' ') { 
            e.preventDefault(); e.stopPropagation();
            toggleCollapse(node.id);
        }
    }
  };

  const startEditing = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, node.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0 || isEditing || (e.target as HTMLElement).closest('.node-action') || (e.target as HTMLElement).closest('.node-ref-link')) return;
      
      e.stopPropagation(); 
      
      if (e.shiftKey) {
          toggleNodeSelection(node.id);
          return;
      } else {
          if (!isSelected) selectNode(node.id);
          else selectNode(node.id);
      }

      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const startOffset = node.offset || { x: 0, y: 0 };

      const move = (ev: MouseEvent) => {
          if (!dragStartRef.current) return;
          
          const dx = (ev.clientX - dragStartRef.current.x) / zoom;
          const dy = (ev.clientY - dragStartRef.current.y) / zoom;
          
          updateNode(node.id, { 
              offset: { 
                  x: startOffset.x + dx, 
                  y: startOffset.y + dy 
              } 
          });
      };

      const up = () => {
          setIsDragging(false);
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
      };

      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
  };

  const handleAddDragStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      const rect = nodeRef.current?.getBoundingClientRect();
      if(!rect) return;

      // Usa dimensões do DOM para garantir centro visual correto, caso min-height tenha expandido
      const domWidth = rect.width / zoom;
      const domHeight = rect.height / zoom;

      const centerX = node.x! + (domWidth / 2);
      const centerY = node.y! + (domHeight / 2);

      setDragCreation({ sourceId: node.id, x: centerX, y: centerY });
  };

  // Styles
  const baseBorderColor = node.color || (isRoot ? '#3b82f6' : '#1e233c');
  const bgColor = style.backgroundColor || (isRoot ? baseBorderColor : '#1e233c');
  const txtColor = style.textColor || (isRoot ? 'white' : '#e5e7eb');
  
  const nodeStyle: React.CSSProperties = {
      fontSize: style.fontSize ? `${style.fontSize}px` : '14px',
      fontWeight: style.fontWeight || (isRoot ? 'bold' : 'normal'),
      fontStyle: style.fontStyle || 'normal',
      color: txtColor,
  };

  return (
    <div
      ref={nodeRef}
      tabIndex={0} 
      className={`absolute flex items-center justify-center outline-none group ${isDragging ? 'cursor-grabbing z-[100]' : 'cursor-pointer'} animate-[fadeIn_0.2s_ease]`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height, // Alterado de height para minHeight
        zIndex: isSelected || isDragging ? 50 : 10,
        transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onDoubleClick={startEditing}
      onContextMenu={handleContextMenu}
    >
      <div 
        className={`
          relative flex flex-col items-center justify-center w-full h-full rounded-xl shadow-lg overflow-hidden transition-all
          ${isPrimary ? 'ring-2 ring-blue-400 border-transparent' : isSelected ? 'ring-2 ring-blue-400/50 border-transparent' : 'border'}
          ${isRoot ? 'shadow-blue-900/20' : 'hover:shadow-blue-500/10'}
        `}
        style={{ 
            backgroundColor: bgColor,
            borderColor: isSelected ? 'transparent' : (node.color || 'rgba(255,255,255,0.1)'),
            borderLeftWidth: (!isRoot && node.color && !isSelected) ? '4px' : '1px'
        }}
      >
        {node.image && (
            <div className="w-full h-24 overflow-hidden border-b border-white/5 bg-black/20 shrink-0 rounded-t-xl">
                <img src={node.image} className="w-full h-full object-cover pointer-events-none" alt="" />
            </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center w-full px-4 py-2 min-h-0">
            {isEditing ? (
            <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => { setEditValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onBlur={() => { updateNode(node.id, { text: editValue }); setIsEditing(false); }}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()} 
                className="w-full bg-transparent border-none outline-none text-center p-0 m-0 resize-none overflow-hidden"
                style={{ ...nodeStyle, minHeight: '1.2em' }}
                rows={1}
            />
            ) : (
            <span className="w-full text-center select-none leading-tight whitespace-pre-wrap break-words" style={nodeStyle}>
                {node.text}
            </span>
            )}
        </div>

        {/* Integrações (Barra Interna Fixa) */}
        {nodeReferences.length > 0 && (
            <div className="w-full mt-auto border-t border-white/5 bg-black/20 flex flex-col max-h-[60px] overflow-y-auto custom-scrollbar">
                {nodeReferences.map((ref, idx) => (
                    <button
                        key={`${ref.type}-${ref.id}-${idx}`}
                        className="node-ref-link flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 transition-colors w-full text-left group/ref border-b border-white/5 last:border-0"
                        onMouseDown={(e) => e.stopPropagation()} 
                        onClick={(e) => {
                            e.stopPropagation();
                            // Agora abre ambos os tipos
                            setViewingReference(ref);
                        }}
                    >
                        <Icon 
                            name={ref.type === 'FLASHCARD' ? 'rotateCw' : 'fileText'} 
                            size={10} 
                            className={ref.type === 'FLASHCARD' ? 'text-green-400' : 'text-blue-400'} 
                        />
                        <span className="text-[9px] text-gray-400 font-medium truncate flex-1 group-hover/ref:text-white transition-colors">
                            {ref.label || (ref.type === 'FLASHCARD' ? 'Flashcard' : 'Nota Vinculada')}
                        </span>
                        <Icon name="arrowUpRight" size={8} className="text-gray-600 opacity-0 group-hover/ref:opacity-100" />
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {node.childrenIds.length > 0 && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}
            className={`
              node-action absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0e27] 
              ${node.isCollapsed ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 hover:bg-gray-100'}
              shadow-sm hover:scale-110 transition-transform z-20 cursor-pointer
            `}
          >
            <Icon name={node.isCollapsed ? "plus" : "minus"} size={8} />
          </button>
      )}

      {/* Drag-to-Add Handle */}
      {(isHovered || isSelected) && !node.isCollapsed && (
          <div 
            className="node-action absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onMouseDown={handleAddDragStart}
            title="Arrastar para criar filho"
          >
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white border-2 border-[#0a0e27] hover:scale-110 transition-all flex items-center justify-center shadow-sm">
                  <Icon name="plus" size={10} />
              </div>
          </div>
      )}
    </div>
  );
};

export default MindMapNodeComponent;
