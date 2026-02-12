
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDocument } from '../../contexts/DocumentContext';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import DocumentToolbar from './DocumentToolbar';
import PDFSelectionMenu from './PDFSelectionMenu';
import PDFFlashcardModal from './PDFFlashcardModal';
import BlockEditor from '../notes/BlockEditor';

const TextReader: React.FC = () => {
  const { activeDoc, closeDocument } = useDocument();
  const { blocks, addBlock, updateBlock, addInnerBlock } = useNotes();
  
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View State
  const [scale, setScale] = useState(1.0); 
  const [showSplitView, setShowSplitView] = useState(false);
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); 
  const [isMarkdown, setIsMarkdown] = useState(false);

  // Selection Logic
  const [selectionMenu, setSelectionMenu] = useState<{ top: number, left: number, text: string } | null>(null);
  
  // Flashcard Logic
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedTextForCard, setSelectedTextForCard] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDoc?.path && window.api) {
        setIsLoading(true);
        setError(null);
        
        setIsMarkdown(activeDoc.path.toLowerCase().endsWith('.md'));

        window.api.readFileBuffer(activeDoc.path).then((buffer) => {
            if (buffer && buffer.length > 0) {
                const text = new TextDecoder('utf-8').decode(buffer);
                setContent(text);
                setIsLoading(false);
            } else {
                setError('Arquivo vazio ou não encontrado.');
                setIsLoading(false);
            }
        }).catch(err => {
            console.error("Erro leitura arquivo:", err);
            setError('Erro de sistema ao ler o arquivo.');
            setIsLoading(false);
        });
    }
  }, [activeDoc?.path]);

  useEffect(() => {
      if (showSplitView && activeDoc) {
          const targetId = `doc_note_${activeDoc.id}`;
          const existingNote = blocks.find(b => b.id === targetId);
          
          if (!existingNote) {
              addBlock('container', { x: 0, y: 0 }, undefined, 'Documentos', targetId);
              setTimeout(() => {
                  updateBlock(targetId, { title: `Notas: ${activeDoc.title}` });
              }, 50);
          }
          setLinkedNoteId(targetId);
      }
  }, [showSplitView, activeDoc, blocks, addBlock, updateBlock]);

  const handleTextSelection = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
          setSelectionMenu(null);
          return;
      }

      const text = selection.toString().trim();
      if (!text) {
          setSelectionMenu(null);
          return;
      }

      if (containerRef.current && !containerRef.current.contains(selection.anchorNode)) {
          setSelectionMenu(null);
          return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionMenu({
          top: rect.top,
          left: rect.left + (rect.width / 2),
          text
      });
  }, []);

  const handleAddToNote = () => {
      if (!selectionMenu || !activeDoc) return;
      if (!showSplitView) setShowSplitView(true);

      const targetId = `doc_note_${activeDoc.id}`;
      addInnerBlock(targetId, 'quote', selectionMenu.text);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
  };

  const handleCreateFlashcard = () => {
      if (!selectionMenu) return;
      setSelectedTextForCard(selectionMenu.text);
      setShowFlashcardModal(true);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
  };

  const handleCopy = () => {
      if (selectionMenu) {
          navigator.clipboard.writeText(selectionMenu.text);
          setSelectionMenu(null);
      }
  };

  const processInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)|(\*.*?\*)|(`.*?`)/g);
      return parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-blue-200">{part.slice(1, -1)}</em>;
          if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-black/30 px-1 rounded text-blue-300 font-mono text-[0.9em] border border-blue-500/20">{part.slice(1, -1)}</code>;
          return part;
      });
  };

  const renderContent = () => {
      if (!isMarkdown) {
          return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">{content}</div>;
      }

      const lines = content.split('\n');
      return (
          <div className="markdown-preview space-y-4 font-sans text-gray-300">
              {lines.map((line, idx) => {
                  // Headers
                  if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold text-blue-400 mt-6 pb-2 border-b border-white/10">{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold text-blue-300 mt-5">{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold text-gray-200 mt-4">{line.replace('### ', '')}</h3>;
                  
                  // Blockquote
                  if (line.startsWith('> ')) return <blockquote key={idx} className="border-l-4 border-blue-500 pl-4 py-1 italic text-gray-400 bg-white/5 rounded-r">{line.replace('> ', '')}</blockquote>;
                  
                  // List
                  if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                      return (
                        <div key={idx} className="flex items-start gap-2 ml-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <span className="leading-relaxed">{processInline(line.replace(/^[-*] /, ''))}</span>
                        </div>
                      );
                  }

                  // Code Block (naive single line placeholder, full parsing needs state)
                  if (line.startsWith('```')) return <div key={idx} className="bg-black/40 border border-white/10 rounded p-2 font-mono text-xs text-gray-400">Bloco de Código</div>;
                  
                  // Empty line
                  if (!line.trim()) return <div key={idx} className="h-4" />;

                  // Paragraph
                  return <p key={idx} className="leading-relaxed">{processInline(line)}</p>;
              })}
          </div>
      );
  };

  if (!activeDoc) return null;

  return (
    <div className="flex flex-col h-full bg-[#1e233c] relative overflow-hidden">
        
        {selectionMenu && (
            <PDFSelectionMenu 
                position={{ top: selectionMenu.top, left: selectionMenu.left }}
                onClose={() => setSelectionMenu(null)}
                onCopy={handleCopy}
                onAddToNote={handleAddToNote}
                onAddFlashcard={handleCreateFlashcard}
            />
        )}

        {/* Modal de Flashcard */}
        {showFlashcardModal && (
            <PDFFlashcardModal 
                initialFront={selectedTextForCard}
                onClose={() => setShowFlashcardModal(false)}
            />
        )}

        <DocumentToolbar 
            scale={scale}
            setScale={setScale}
            pageNumber={1} 
            numPages={null}
            setPageNumber={() => {}}
            onClose={closeDocument}
            rotate={0}
            setRotate={() => {}}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            showSplitView={showSplitView}
            setShowSplitView={setShowSplitView}
        />

        <div className="flex flex-1 overflow-hidden relative">
            <div 
                className="flex-1 overflow-auto bg-[#2a2f45] flex flex-col items-center p-8 custom-scrollbar" 
                onMouseUp={handleTextSelection}
            >
                {isLoading ? (
                    <div className="text-white mt-10 animate-pulse flex flex-col items-center">
                        <Icon name="fileText" size={32} className="animate-spin mb-4 text-blue-400" />
                        <span className="text-sm font-medium">Carregando texto...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 mt-10 bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-center max-w-md">
                        <Icon name="alert" size={32} className="mx-auto mb-2" />
                        <p className="font-bold mb-2">{error}</p>
                    </div>
                ) : (
                    <div 
                        ref={containerRef}
                        className="bg-[#14182d] shadow-2xl transition-all duration-200 border border-white/5 rounded-lg text-gray-300"
                        style={{ 
                            fontSize: `${16 * scale}px`,
                            padding: '60px 80px',
                            minHeight: '800px', 
                            width: '800px', 
                            maxWidth: '95%',
                            marginBottom: '100px'
                        }}
                    >
                        {renderContent()}
                    </div>
                )}
            </div>

            {/* Split View */}
            {showSplitView && (
                <div className="w-[450px] border-l border-white/5 bg-[#0a0e27] flex flex-col shrink-0 animate-[slideInRight_0.2s_ease] relative shadow-2xl z-10">
                    {linkedNoteId ? (
                        <BlockEditor blockId={linkedNoteId} isEmbedded={true} />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <Icon name="refresh" size={24} className="animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default TextReader;
