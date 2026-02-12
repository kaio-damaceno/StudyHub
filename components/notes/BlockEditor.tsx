
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import { EditorBlockData, BlockType } from '../../types';
import SlashMenu from './SlashMenu';
import EditorBlockItem from './EditorBlockItem';
import FloatingToolbar from './FloatingToolbar';

interface BlockEditorProps {
  blockId: string;
  isEmbedded?: boolean; // Nova prop
}

const BlockEditor: React.FC<BlockEditorProps> = ({ blockId, isEmbedded = false }) => {
  const { blocks, updateBlock, focusBlock, folders, createFolder } = useNotes();
  const noteBlock = blocks.find(b => b.id === blockId);
  
  const [title, setTitle] = useState('');
  const [editorBlocks, setEditorBlocks] = useState<EditorBlockData[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isEmbedded && window.innerWidth > 1024); // Fecha sidebar por padrão se embedded
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);
  const [slashMenu, setSlashMenu] = useState<{ show: boolean, top: number, left: number, blockIndex: number } | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  
  // Folder Management State
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (noteBlock) {
          setTitle(noteBlock.title);
          setCoverImage(noteBlock.content.coverImage || '');
          if (noteBlock.content.blocks && noteBlock.content.blocks.length > 0) {
              setEditorBlocks(noteBlock.content.blocks);
          } else if (noteBlock.content.text) {
              setEditorBlocks([{ id: `block-${Date.now()}`, type: 'text', content: noteBlock.content.text, level: 0 }]);
          } else {
              setEditorBlocks([{ id: `block-${Date.now()}`, type: 'text', content: '', level: 0 }]);
          }
      }
  }, [blockId]);

  const saveContent = useCallback(() => {
      if (!noteBlock) return;
      const plainText = editorBlocks.map(b => b.content || '').join('\n').slice(0, 200);
      updateBlock(blockId, { 
          title, content: { ...noteBlock.content, text: plainText, blocks: editorBlocks, coverImage }, updatedAt: Date.now()
      });
  }, [title, editorBlocks, coverImage, blockId, updateBlock, noteBlock]);

  useEffect(() => {
      const handler = setTimeout(saveContent, 1500); 
      return () => clearTimeout(handler);
  }, [saveContent]);

  const handleUpdateBlock = (index: number, content: string, properties?: any) => {
      const newBlocks = [...editorBlocks];
      newBlocks[index] = { 
          ...newBlocks[index], 
          content, 
          properties: properties ? { ...newBlocks[index].properties, ...properties } : newBlocks[index].properties 
      };
      setEditorBlocks(newBlocks);

      // Slash Menu Logic
      if (content === '/' && !slashMenu) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
              const rect = sel.getRangeAt(0).getBoundingClientRect();
              
              // Ajuste para container relativo se embedded
              let top = rect.bottom + window.scrollY;
              let left = rect.left;

              // Se estiver embedded, precisamos compensar o scroll do container pai se necessário
              // Mas como o SlashMenu usa fixed positioning, a coordenada da tela (getBoundingClientRect) deve funcionar.
              
              setSlashMenu({ 
                  show: true, 
                  top, 
                  left, 
                  blockIndex: index 
              });
          }
      } else if (slashMenu && content !== '/') {
          setSlashMenu(null);
      }
  };

  const handleAddBlock = (index: number, type: BlockType = 'text') => {
      const newBlock: EditorBlockData = {
          id: `eb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type,
          content: '',
          level: editorBlocks[index]?.level || 0,
          properties: type === 'todo-list' ? { checked: false } : undefined
      };
      const newBlocks = [...editorBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setEditorBlocks(newBlocks);
      setFocusedBlockIndex(index + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter' && !e.shiftKey && !slashMenu) {
          e.preventDefault();
          handleAddBlock(index, editorBlocks[index].type === 'todo-list' ? 'todo-list' : 'text');
      }
      if (e.key === 'Backspace' && editorBlocks[index].content === '' && editorBlocks.length > 1) {
          e.preventDefault();
          const nb = [...editorBlocks];
          nb.splice(index, 1);
          setEditorBlocks(nb);
          setFocusedBlockIndex(index > 0 ? index - 1 : 0);
      }
      if (e.key === 'Tab') {
          e.preventDefault();
          const nb = [...editorBlocks];
          const currLevel = nb[index].level || 0;
          nb[index].level = e.shiftKey ? Math.max(0, currLevel - 1) : Math.min(5, currLevel + 1);
          setEditorBlocks(nb);
      }
  };

  const handleSelectCommand = (type: BlockType) => {
      const newBlocks = [...editorBlocks];
      const idx = slashMenu!.blockIndex;
      newBlocks[idx] = { 
          ...newBlocks[idx], 
          type, 
          content: '', 
          properties: type === 'todo-list' ? { checked: false } : undefined 
      };
      setEditorBlocks(newBlocks);
      setSlashMenu(null);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setCoverImage(ev.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  const handleCreateFolder = () => {
      if (newFolderName.trim()) {
          createFolder(newFolderName.trim());
          updateBlock(blockId, { folderId: newFolderName.trim() });
          setNewFolderName('');
          setIsCreatingFolder(false);
      }
  };

  if (!noteBlock) return <div className="text-gray-500 p-8 text-center">Nota não encontrada.</div>;

  return (
    <div className={`absolute inset-0 z-50 bg-[#0a0e27] flex flex-col animate-[fadeIn_0.2s_ease] ${isEmbedded ? 'rounded-tl-2xl' : ''}`}>
        <FloatingToolbar />
        <div className="h-12 border-b border-white/5 bg-[#0f1223]/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-30">
            <div className="flex items-center gap-3 flex-1">
                {!isEmbedded && (
                    <button onClick={() => { saveContent(); focusBlock(null); }} className="text-gray-400 hover:text-white p-2 rounded-full transition-colors">
                        <Icon name="arrowLeft" size={20} />
                    </button>
                )}
                <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Título da Nota" 
                    className="bg-transparent border-none outline-none text-sm font-bold text-gray-200 flex-1 truncate" 
                />
            </div>
            <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`p-2 rounded-lg transition-colors ${rightSidebarOpen ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500'}`} title="Opções"><Icon name="palette" size={18} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0e27]" id="block-editor-content">
                <div className={`mx-auto py-8 min-h-full pb-[40vh] ${isEmbedded ? 'px-6 max-w-full' : 'px-12 max-w-3xl'}`}>
                    {coverImage && (
                        <div className="w-full h-32 md:h-48 rounded-2xl overflow-hidden mb-8 relative group">
                            <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                            <button onClick={() => setCoverImage('')} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" size={16} /></button>
                        </div>
                    )}

                    <div className="space-y-1">
                        {editorBlocks.map((block, index) => (
                            <EditorBlockItem 
                                key={block.id}
                                block={block}
                                index={index}
                                isSelected={focusedBlockIndex === index}
                                onUpdate={(c, p) => handleUpdateBlock(index, c, p)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onFocus={() => setFocusedBlockIndex(index)}
                                onDragStart={() => setDraggedBlockIndex(index)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggedBlockIndex === null) return;
                                    const nb = [...editorBlocks];
                                    const [moved] = nb.splice(draggedBlockIndex, 1);
                                    nb.splice(index, 0, moved);
                                    setEditorBlocks(nb);
                                    setDraggedBlockIndex(null);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {rightSidebarOpen && (
                <div className={`${isEmbedded ? 'w-[250px] absolute right-0 top-0 bottom-0 z-40 shadow-2xl' : 'w-[300px] relative'} border-l border-white/10 bg-[#0f1223] flex flex-col overflow-y-auto custom-scrollbar animate-[slideInRight_0.2s_ease] shrink-0`}>
                    <div className="p-6 space-y-8">
                        
                        {/* Seção de Organização (Pastas) */}
                        <section className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Icon name="folder" size={12} /> Organização
                            </h4>
                            
                            <div className="bg-[#14182d] rounded-xl border border-white/5 overflow-hidden">
                                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Pasta:</span>
                                    <span className="text-xs font-bold text-blue-400 truncate max-w-[120px]">
                                        {noteBlock.folderId || 'Sem Pasta'}
                                    </span>
                                </div>
                                
                                <div className="max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                                    <button 
                                        onClick={() => updateBlock(blockId, { folderId: undefined })}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2 ${!noteBlock.folderId ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Icon name="x" size={12} /> Sem Pasta
                                    </button>
                                    
                                    {folders.map(folder => (
                                        <button
                                            key={folder}
                                            onClick={() => updateBlock(blockId, { folderId: folder })}
                                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${noteBlock.folderId === folder ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="truncate flex-1 flex items-center gap-2">
                                                <Icon name="folder" size={12} className="opacity-50" /> {folder}
                                            </span>
                                            {noteBlock.folderId === folder && <Icon name="checkSquare" size={12} />}
                                        </button>
                                    ))}
                                </div>

                                {isCreatingFolder ? (
                                    <div className="p-3 border-t border-white/5 bg-[#0a0e27]/50 animate-[fadeIn_0.2s_ease]">
                                        <div className="flex flex-col gap-2">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    e.stopPropagation(); 
                                                    if (e.key === 'Enter') handleCreateFolder();
                                                    if (e.key === 'Escape') setIsCreatingFolder(false);
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()} 
                                                placeholder="Nome..."
                                                className="w-full bg-[#0a0e27] border border-blue-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => setIsCreatingFolder(false)}
                                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={handleCreateFolder} 
                                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold text-white transition-colors flex items-center gap-1"
                                                >
                                                    <Icon name="checkSquare" size={10} /> Criar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsCreatingFolder(true)}
                                        className="w-full py-2 text-center text-[10px] font-bold text-gray-500 hover:text-blue-400 border-t border-white/5 hover:bg-white/5 transition-all"
                                    >
                                        + Nova Pasta
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Seção de Personalização (Capa) */}
                        <section className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Icon name="image" size={12} /> Personalização
                            </h4>
                            
                            <label className="text-[11px] text-gray-400 font-bold block">Imagem de Capa</label>
                            
                            <button 
                                onClick={() => coverInputRef.current?.click()}
                                className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all mb-2"
                            >
                                <Icon name="plus" size={14} /> Upload Personalizado
                            </button>
                            <input 
                                type="file" 
                                ref={coverInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleCoverUpload} 
                            />

                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
                                    'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd',
                                    'https://images.unsplash.com/photo-1501785888041-af3ef285b470'
                                ].map(url => (
                                    <button key={url} onClick={() => setCoverImage(`${url}?auto=format&fit=crop&w=800&q=80`)} className="h-16 rounded-lg overflow-hidden border border-white/5 hover:border-blue-500 transition-all"><img src={url} className="w-full h-full object-cover" /></button>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>

        {slashMenu && slashMenu.show && (
            <SlashMenu 
                position={{ top: slashMenu.top, left: slashMenu.left }} 
                onSelect={handleSelectCommand}
                onClose={() => setSlashMenu(null)}
            />
        )}
    </div>
  );
};

export default BlockEditor;
