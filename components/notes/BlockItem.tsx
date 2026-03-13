
import React, { useRef, useState, useEffect } from 'react';
import { NoteBlock } from '../../types';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';

interface BlockItemProps {
  block: NoteBlock;
  zoom: number;
}

const BlockItem: React.FC<BlockItemProps> = ({ block, zoom }) => {
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
  
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const blockRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const resizeStartRef = useRef<{ w: number, h: number, x: number, y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
              setContextMenu(null);
          }
      };
      if (contextMenu) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleContextAction = (action: string) => {
      setContextMenu(null);
      switch(action) {
          case 'duplicate': duplicateBlock(block.id); break;
          case 'delete': deleteBlock(block.id); break;
          case 'connect': setConnectionStartId(block.id); break;
          case 'new': addBlock('container', { x: block.position.x + block.position.width + 50, y: block.position.y }); break;
          case 'edit': focusBlock(block.id); break;
      }
  };

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

  // --- Fix: Adicionada a função handleConnectionStart que estava faltando para permitir a criação de conexões ---
  const handleConnectionStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setConnectionStartId(block.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const base64 = ev.target?.result as string;
              updateBlock(block.id, { 
                  content: { ...block.content, url: base64 },
                  type: 'image'
              });
              setImageError(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const renderImageContent = () => {
      const url = block.content.url;
      if (!url) {
          return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <Icon name="image" size={32} className="text-gray-600 opacity-50" />
                <div className="space-y-2 w-full">
                    <input 
                        type="text" 
                        placeholder="Link da imagem..." 
                        className="w-full bg-[#0a0e27] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none no-drag"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                updateBlock(block.id, { content: { ...block.content, url: e.currentTarget.value } });
                                setImageError(false);
                            }
                        }}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-400/20 transition-all no-drag"
                    >
                        Upload Local
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
            </div>
          );
      }

      return (
          <div className="relative w-full h-full flex flex-col group/img no-drag">
              {imageError ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-red-500/5 text-red-400 gap-2 border border-dashed border-red-500/20 rounded-lg m-2">
                      <Icon name="alert" size={24} />
                      <span className="text-[10px] font-bold text-center px-4">Erro ao carregar imagem</span>
                      <button onClick={() => updateBlock(block.id, { content: { ...block.content, url: '' } })} className="text-[10px] underline hover:text-white">Trocar Link</button>
                  </div>
              ) : (
                  <img 
                    src={url} 
                    alt={block.title} 
                    className="flex-1 object-contain w-full h-full rounded-lg"
                    onError={() => setImageError(true)}
                  />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                  <div className="bg-[#14182d] p-2 rounded-lg border border-white/20 text-white text-[10px] font-bold pointer-events-auto cursor-pointer" onClick={() => updateBlock(block.id, { content: { ...block.content, url: '' } })}>Substituir</div>
              </div>
          </div>
      );
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
        onDoubleClick={(e) => { e.stopPropagation(); focusBlock(block.id); }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowFolderMenu(false); setIsCreatingFolder(false); }}
        className="canvas-note-block absolute flex flex-col rounded-2xl bg-[#1e233c]/95 backdrop-blur-md border shadow-lg transition-all group overflow-visible cursor-grab active:cursor-grabbing hover:shadow-2xl"
        style={{
            left: block.position.x,
            top: block.position.y,
            width: block.position.width,
            height: block.position.height,
            borderColor: isHovered || connectionStartId === block.id ? borderColor : 'rgba(255,255,255,0.05)',
            borderWidth: '1px',
            zIndex: isHovered ? 100 : 10,
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
            
            <div className={`flex gap-1 transition-opacity ${isHovered || showFolderMenu ? 'opacity-100' : 'opacity-0'} no-drag relative`}>
                <button onClick={(e) => { e.stopPropagation(); setShowFolderMenu(!showFolderMenu); }} className={`p-1 rounded transition-colors ${block.folderId ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
                    <Icon name="folderOpen" size={12} />
                </button>
                {showFolderMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#14182d] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-[fadeIn_0.1s_ease] flex flex-col">
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase border-b border-white/5">Mover para...</div>
                        <div className="max-h-[150px] overflow-y-auto">
                            {folders.map(folder => (
                                <button key={folder} onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { folderId: folder }); setShowFolderMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center justify-between ${block.folderId === folder ? 'text-blue-400' : 'text-gray-300'}`}>
                                    <span className="truncate">{folder}</span>
                                    {block.folderId === folder && <Icon name="checkSquare" size={10} />}
                                </button>
                            ))}
                        </div>
                        {isCreatingFolder ? (
                            <div className="p-2 border-t border-white/5">
                                <input autoFocus type="text" className="w-full bg-[#0a0e27] border border-blue-500 rounded px-2 py-1 text-xs text-white outline-none" placeholder="Nome" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if(e.key === 'Enter') { if(newFolderName.trim()) { createFolder(newFolderName.trim()); updateBlock(block.id, { folderId: newFolderName.trim() }); } setIsCreatingFolder(false); setShowFolderMenu(false); } }} onClick={(e) => e.stopPropagation()} />
                            </div>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(true); }} className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/10 border-t border-white/5 font-bold flex items-center gap-1"><Icon name="plus" size={10} /> Nova Pasta</button>
                        )}
                    </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(block.id); }} className={`p-1 rounded transition-colors ${block.isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:bg-white/10'}`}><Icon name="star" size={12} className={block.isFavorite ? 'fill-current' : ''} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleContextAction('delete'); }} className="p-1 text-gray-500 hover:text-red-400 rounded"><Icon name="trash" size={12} /></button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            {block.type === 'image' ? renderImageContent() : (
                <>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap select-none p-4">
                        {block.content.text || <span className="italic opacity-50">Dê dois cliques para escrever...</span>}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1e233c] to-transparent pointer-events-none" />
                </>
            )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-2 pt-1 border-t border-white/5 bg-white/5 rounded-b-2xl flex items-center justify-between no-drag h-[30px]">
            <div className="flex items-center gap-1 overflow-hidden cursor-pointer hover:bg-white/5 rounded px-1 -ml-1 max-w-[80%]" onClick={(e) => { e.stopPropagation(); const tags = prompt("Tags:", (block.tags || []).join(', ')); if (tags !== null) updateBlock(block.id, { tags: tags.split(',').map(t => t.trim()).filter(Boolean) }); }}>
                <Icon name="hash" size={10} className="text-gray-600" />
                <div className="flex gap-1 overflow-hidden">
                    {(block.tags && block.tags.length > 0) ? block.tags.map((tag, i) => <span key={i} className="text-[9px] text-blue-400 bg-blue-500/10 px-1 rounded truncate">{tag}</span>) : <span className="text-[9px] text-gray-600">Sem tags</span>}
                </div>
            </div>
        </div>

        {isHovered && (
            <div className="resize-handle no-drag absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center hover:bg-white/10 rounded-br-2xl transition-colors z-20" onMouseDown={handleResizeStart}>
                <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500" />
            </div>
        )}
        {isHovered && !connectionStartId && (
            <div className="connect-handle no-drag absolute right-[-10px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 border-4 border-[#0a0e27] cursor-crosshair hover:scale-110 transition-transform z-30 shadow-md" onMouseDown={handleConnectionStart} />
        )}
        </div>

        {contextMenu && (
            <div ref={contextMenuRef} className="fixed z-[9999] bg-[#14182d] border border-blue-400/20 rounded-lg shadow-2xl overflow-hidden min-w-[160px] animate-[fadeIn_0.1s_ease]" style={{ top: contextMenu.y, left: contextMenu.x }}>
                <button onClick={() => handleContextAction('edit')} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-500/20 flex items-center gap-2"><Icon name="edit2" size={14} /> Editar</button>
                <button onClick={() => handleContextAction('duplicate')} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-500/20 flex items-center gap-2"><Icon name="copy" size={14} /> Duplicar</button>
                <button onClick={() => handleContextAction('delete')} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 flex items-center gap-2"><Icon name="trash" size={14} /> Excluir</button>
            </div>
        )}
    </>
  );
};

export default BlockItem;
