
import React, { useRef, useState, useEffect } from 'react';
import { NoteBlock } from '../../types';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import { useContextMenu } from '../../hooks/useContextMenu';

interface NoteBlockProps {
  block: NoteBlock;
  zoom: number;
}

const NoteBlockComponent: React.FC<NoteBlockProps> = ({ block, zoom }) => {
  const { 
      moveBlock, 
      focusBlock, 
      setIsDraggingBlock, 
      deleteBlock, 
      duplicateBlock,
      addBlock,
      resizeBlock,
      connectionStartId,
      setConnectionStartId,
      connectBlocks,
      toggleFavorite,
      updateBlock,
      folders,
      createFolder
  } = useNotes();
  
  const { handleContextMenu } = useContextMenu();

  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  
  // Folder Creation State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const resizeStartRef = useRef<{ w: number, h: number, x: number, y: number } | null>(null);

  // --- Context Menu Logic ---
  const onBlockContextMenu = (e: React.MouseEvent) => {
      handleContextMenu(e, [
          { 
              label: 'Editar', 
              icon: 'edit2', 
              onClick: () => focusBlock(block.id) 
          },
          { 
              label: 'Mover para Pasta...', 
              icon: 'folder', 
              onClick: () => setShowFolderMenu(true) // Abre o menu de pasta já existente
          },
          { 
              label: 'Alterar Cor', 
              icon: 'palette',
              onClick: () => {
                  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#a855f7', '#ec4899'];
                  // Simples rotação de cores para demonstração rápida
                  const currentIdx = colors.indexOf(block.color || '#3b82f6');
                  const nextColor = colors[(currentIdx + 1) % colors.length];
                  updateBlock(block.id, { color: nextColor });
              } 
          },
          { type: 'separator' },
          { 
              label: 'Conectar a...', 
              icon: 'link', 
              onClick: () => setConnectionStartId(block.id) 
          },
          { 
              label: 'Duplicar', 
              icon: 'copyPlus', 
              onClick: () => duplicateBlock(block.id) 
          },
          { type: 'separator' },
          { 
              label: 'Excluir', 
              icon: 'trash', 
              variant: 'danger',
              onClick: () => deleteBlock(block.id) 
          }
      ]);
  };

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; 
    
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    e.stopPropagation();
    
    if (connectionStartId && connectionStartId !== block.id) {
        connectBlocks(connectionStartId, block.id);
        setConnectionStartId(null);
        return;
    }
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDraggingBlock(true);

    const startX = block.position.x;
    const startY = block.position.y;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = (ev.clientX - dragStartRef.current.x) / zoom;
      const deltaY = (ev.clientY - dragStartRef.current.y) / zoom;
      moveBlock(block.id, startX + deltaX, startY + deltaY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDraggingBlock(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // --- Resize Logic ---
  const handleResizeStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      resizeStartRef.current = { w: block.position.width, h: block.position.height, x: e.clientX, y: e.clientY };

      const handleResizeMove = (ev: MouseEvent) => {
          if (!resizeStartRef.current) return;
          const deltaX = (ev.clientX - resizeStartRef.current.x) / zoom;
          const deltaY = (ev.clientY - resizeStartRef.current.y) / zoom;
          
          const newW = Math.max(200, resizeStartRef.current.w + deltaX);
          const newH = Math.max(150, resizeStartRef.current.h + deltaY);
          
          resizeBlock(block.id, newW, newH);
      };

      const handleResizeUp = () => {
          document.removeEventListener('mousemove', handleResizeMove);
          document.removeEventListener('mouseup', handleResizeUp);
          setIsResizing(false);
          resizeStartRef.current = null;
      };

      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
  };

  // --- Connection Start Logic ---
  const handleConnectionStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setConnectionStartId(block.id);
  };

  const handleMouseUpBlock = () => {
      if (connectionStartId && connectionStartId !== block.id) {
          connectBlocks(connectionStartId, block.id);
          setConnectionStartId(null);
      }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    focusBlock(block.id);
  };

  const handleCreateFolderSubmit = () => {
      if (newFolderName.trim()) {
          createFolder(newFolderName.trim());
          updateBlock(block.id, { folderId: newFolderName.trim() });
      }
      setIsCreatingFolder(false);
      setNewFolderName('');
      setShowFolderMenu(false);
  };

  const handleEditTags = () => {
      const tags = prompt("Tags (separadas por vírgula):", (block.tags || []).join(', '));
      if (tags !== null) {
          const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`);
          updateBlock(block.id, { tags: tagArray });
      }
  };

  const getIconForType = (type: string) => {
      switch(type) {
          case 'folder': return 'folderOpen';
          case 'image': return 'image';
          case 'code': return 'code';
          case 'container': return 'note';
          default: return 'fileText';
      }
  };

  const borderColor = block.color || '#3b82f6';

  return (
    <>
        <div
        ref={blockRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUpBlock}
        onDoubleClick={handleDoubleClick}
        onContextMenu={onBlockContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowFolderMenu(false); setIsCreatingFolder(false); }}
        className="note-block absolute flex flex-col rounded-2xl bg-[#1e233c]/95 backdrop-blur-md border shadow-lg transition-all group overflow-visible cursor-grab active:cursor-grabbing hover:shadow-2xl"
        style={{
            left: block.position.x,
            top: block.position.y,
            width: block.position.width,
            height: block.position.height,
            borderColor: isHovered || connectionStartId === block.id ? borderColor : 'rgba(255,255,255,0.05)',
            borderWidth: '1px',
            zIndex: isHovered ? 100 : 10,
            boxShadow: connectionStartId === block.id ? `0 0 20px ${borderColor}` : undefined
        }}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5 select-none h-[44px] shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1 rounded bg-white/10 text-gray-300">
                    <Icon name={getIconForType(block.type)} size={12} />
                </div>
                <span className="text-sm font-bold text-gray-200 truncate">{block.title}</span>
            </div>
            
            {/* Actions (Favoritar / Deletar / Pasta) */}
            <div className={`flex gap-1 transition-opacity ${isHovered || showFolderMenu ? 'opacity-100' : 'opacity-0'} no-drag relative`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowFolderMenu(!showFolderMenu); }}
                    className={`p-1 rounded transition-colors ${block.folderId ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                    title={block.folderId ? `Pasta: ${block.folderId}` : "Mover para Pasta"}
                >
                    <Icon name="folderOpen" size={12} />
                </button>
                
                {/* Folder Menu Dropdown */}
                {showFolderMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#14182d] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-[fadeIn_0.1s_ease] flex flex-col">
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase border-b border-white/5">Mover para...</div>
                        <div className="max-h-[150px] overflow-y-auto">
                            {folders.map(folder => (
                                <button
                                    key={folder}
                                    onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { folderId: folder }); setShowFolderMenu(false); }}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center justify-between ${block.folderId === folder ? 'text-blue-400' : 'text-gray-300'}`}
                                >
                                    <span className="truncate">{folder}</span>
                                    {block.folderId === folder && <Icon name="checkSquare" size={10} />}
                                </button>
                            ))}
                        </div>
                        
                        {isCreatingFolder ? (
                            <div className="p-2 border-t border-white/5">
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-[#0a0e27] border border-blue-500 rounded px-2 py-1 text-xs text-white outline-none"
                                    placeholder="Nome da pasta"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if(e.key === 'Enter') handleCreateFolderSubmit();
                                        if(e.key === 'Escape') setIsCreatingFolder(false);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(true); }}
                                className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/10 border-t border-white/5 font-bold flex items-center gap-1"
                            >
                                <Icon name="plus" size={10} /> Nova Pasta
                            </button>
                        )}

                        {block.folderId && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { folderId: undefined }); setShowFolderMenu(false); }}
                                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 border-t border-white/5"
                            >
                                Remover da Pasta
                            </button>
                        )}
                    </div>
                )}

                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(block.id); }}
                    className={`p-1 rounded transition-colors ${block.isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400 hover:bg-white/10'}`}
                    title="Favoritar"
                >
                    <Icon name="star" size={12} className={block.isFavorite ? 'fill-current' : ''} />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden relative">
            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap select-none">
                {block.content.text || (
                    <span className="italic opacity-50">Bloco vazio. Clique duas vezes para editar.</span>
                )}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1e233c] to-transparent pointer-events-none" />
        </div>

        {/* Footer (Tags Manager) */}
        <div className="px-4 pb-2 pt-1 border-t border-white/5 bg-white/5 rounded-b-2xl flex items-center justify-between no-drag h-[30px]">
            <div 
                className="flex items-center gap-1 overflow-hidden cursor-pointer hover:bg-white/5 rounded px-1 -ml-1 transition-colors max-w-[80%]"
                onClick={(e) => { e.stopPropagation(); handleEditTags(); }}
                title="Gerenciar Tags"
            >
                <Icon name="tag" size={10} className="text-gray-600" />
                <div className="flex gap-1 overflow-hidden">
                    {(block.tags && block.tags.length > 0) ? (
                        block.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] text-blue-400 bg-blue-500/10 px-1 rounded truncate">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="text-[9px] text-gray-600">Sem tags</span>
                    )}
                </div>
            </div>
            
            <div className="text-[9px] text-gray-600 pointer-events-none select-none">
                {block.position.width.toFixed(0)}x{block.position.height.toFixed(0)}
            </div>
        </div>

        {/* Resize Handle (Bottom Right) */}
        {isHovered && (
            <div 
                className="resize-handle no-drag absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center hover:bg-white/10 rounded-br-2xl rounded-tl-lg transition-colors z-20"
                onMouseDown={handleResizeStart}
            >
                <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500" />
            </div>
        )}

        {/* Connection Trigger (Right Side - Center) */}
        {isHovered && !connectionStartId && (
            <div 
                className="connect-handle no-drag absolute right-[-10px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 border-4 border-[#0a0e27] cursor-crosshair hover:scale-110 transition-transform z-30 flex items-center justify-center shadow-md"
                onMouseDown={handleConnectionStart}
                title="Puxar conexão"
            >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
        )}
        </div>
    </>
  );
};

export default NoteBlockComponent;
