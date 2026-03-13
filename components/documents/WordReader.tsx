
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDocument } from '../../contexts/DocumentContext';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import DocumentToolbar from './DocumentToolbar';
import PDFSelectionMenu from './PDFSelectionMenu';
import PDFFlashcardModal from './PDFFlashcardModal';
import BlockEditor from '../notes/BlockEditor';

const WordReader: React.FC = () => {
  const { activeDoc, closeDocument, updateDocumentProgress } = useDocument();
  const { blocks, addBlock, updateBlock, addInnerBlock } = useNotes();
  
  const [scale, setScale] = useState(activeDoc?.zoom || 1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSplitView, setShowSplitView] = useState(false);
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Selection Logic
  const [selectionMenu, setSelectionMenu] = useState<{ top: number, left: number, text: string } | null>(null);
  
  // Flashcard Logic
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedTextForCard, setSelectedTextForCard] = useState('');

  const convertDocxToHtml = useCallback((buffer: Uint8Array) => {
      // @ts-ignore
      const mammoth = window.mammoth;
      
      if (!mammoth) {
          setTimeout(() => convertDocxToHtml(buffer), 500);
          return;
      }

      // Mammoth aceita ArrayBuffer. O Uint8Array possui a propriedade .buffer que é o ArrayBuffer
      mammoth.convertToHtml({ arrayBuffer: buffer.buffer })
          .then((result: any) => {
              setHtmlContent(result.value);
              setIsLoading(false);
              if (result.messages && result.messages.length > 0) {
                  console.warn("Mammoth messages:", result.messages);
              }
          })
          .catch((err: any) => {
              console.error("Mammoth error:", err);
              setError('Falha ao converter o documento Word. O arquivo pode estar corrompido.');
              setIsLoading(false);
          });
  }, []);

  useEffect(() => {
    if (activeDoc?.path && window.api) {
        setIsLoading(true);
        setError(null);
        setHtmlContent('');
        
        console.log("Lendo arquivo DOCX via Mammoth:", activeDoc.path);
        
        window.api.readFileBuffer(activeDoc.path).then((buffer) => {
            if (buffer && buffer.length > 0) {
                convertDocxToHtml(buffer);
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
  }, [activeDoc?.path, convertDocxToHtml]);

  // Efeito para criar/encontrar a nota vinculada quando o Split View abre
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

  const handleZoom = (newScale: number) => {
      setScale(newScale);
      if (activeDoc) updateDocumentProgress(activeDoc.id, activeDoc.currentPage, newScale);
  };

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

      // Verifica se a seleção está dentro do container do DOCX
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

  if (!activeDoc) return null;

  return (
    <div className="flex flex-col h-full bg-[#1e233c] relative overflow-hidden">
        
        {/* Menu de Seleção */}
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
            setScale={handleZoom}
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
                        <Icon name="rotateCw" size={32} className="animate-spin mb-4 text-blue-400" />
                        <span className="text-sm font-medium">Processando documento Word...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 mt-10 bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-center max-w-md">
                        <Icon name="alert" size={32} className="mx-auto mb-2" />
                        <p className="font-bold mb-2">{error}</p>
                        <p className="text-xs opacity-70 break-all">{activeDoc.path}</p>
                    </div>
                ) : (
                    <div 
                        ref={containerRef}
                        className="docx-content bg-white shadow-2xl transition-transform duration-200 origin-top text-black"
                        style={{ 
                            transform: `scale(${scale})`,
                            // Adicionamos margem baseada no scale para evitar cortes
                            marginBottom: scale > 1 ? `${(scale - 1) * 500}px` : '100px',
                            
                            padding: '60px 80px',
                            minHeight: '1123px', // Altura A4 aprox
                            width: '794px', // Largura A4 em px (96dpi)
                            maxWidth: 'none', // Permite que o width fixo funcione
                            backgroundColor: 'white',
                            display: 'flow-root', // CRÍTICO: Garante que o container envolva floats e margens internas
                            boxSizing: 'border-box'
                        }}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                )}
                
                {/* Estilos específicos para o conteúdo gerado pelo Mammoth para parecer um documento */}
                <style>{`
                    .docx-content { 
                        font-family: 'Times New Roman', serif; 
                        line-height: 1.6; 
                        font-size: 12pt;
                    }
                    .docx-content p { margin-bottom: 1em; text-align: justify; }
                    .docx-content h1, .docx-content h2, .docx-content h3 { 
                        color: #2c3e50; 
                        margin-top: 1.5em; 
                        margin-bottom: 0.5em; 
                        font-family: 'Arial', sans-serif; 
                        line-height: 1.2;
                    }
                    .docx-content h1 { font-size: 24pt; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                    .docx-content h2 { font-size: 18pt; }
                    .docx-content h3 { font-size: 14pt; }
                    .docx-content table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 1em 0; 
                        font-size: 10pt;
                    }
                    .docx-content td, .docx-content th { 
                        border: 1px solid #ccc; 
                        padding: 8px; 
                        text-align: left; 
                        vertical-align: top;
                    }
                    .docx-content img { 
                        max-width: 100%; 
                        height: auto; 
                        display: block; 
                        margin: 1em auto; 
                    }
                    .docx-content ul, .docx-content ol { padding-left: 40px; margin-bottom: 1em; }
                    .docx-content li { margin-bottom: 0.5em; }
                    .docx-content a { color: #3b82f6; text-decoration: underline; }
                `}</style>
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

export default WordReader;
