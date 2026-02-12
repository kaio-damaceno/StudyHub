
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDocument } from '../../contexts/DocumentContext';
import { useNotes } from '../../contexts/NotesContext';
import { useFlashcards } from '../../contexts/FlashcardContext';
import DocumentToolbar from './DocumentToolbar';
import PDFSidebar from './PDFSidebar';
import PDFSelectionMenu from './PDFSelectionMenu';
import PDFFlashcardModal from './PDFFlashcardModal';
import BlockEditor from '../notes/BlockEditor';
import { Icon } from '../ui/Icon';

// Imports de CSS para react-pdf v9+ (local)
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configura o worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFReader: React.FC = () => {
  const { activeDoc, closeDocument, updateDocumentProgress } = useDocument();
  const { blocks, addBlock, updateBlock, addInnerBlock } = useNotes();
  const { addDeck } = useFlashcards();
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(activeDoc?.zoom || 1.2); 
  const [rotate, setRotate] = useState(0);
  
  // Layout State
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSplitView, setShowSplitView] = useState(false);
  const [pdfObject, setPdfObject] = useState<any>(null); 
  
  // Note State for Split View
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(null);

  // Selection & Modal State
  const [selectionMenu, setSelectionMenu] = useState<{ top: number, left: number, text: string } | null>(null);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedTextForCard, setSelectedTextForCard] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (activeDoc) {
          setScale(activeDoc.zoom || 1.2);
      }
  }, [activeDoc?.id]);

  // Efeito para criar/encontrar a nota vinculada quando o Split View abre
  useEffect(() => {
      if (showSplitView && activeDoc) {
          const targetId = `doc_note_${activeDoc.id}`;
          const existingNote = blocks.find(b => b.id === targetId);
          
          if (!existingNote) {
              // Cria nota automaticamente
              addBlock('container', { x: 0, y: 0 }, undefined, 'Documentos', targetId);
              // Pequeno delay para garantir que o addBlock processe antes do update
              setTimeout(() => {
                  updateBlock(targetId, { title: `Notas: ${activeDoc.title}` });
              }, 50);
          }
          setLinkedNoteId(targetId);
      }
  }, [showSplitView, activeDoc, blocks, addBlock, updateBlock]);

  const onDocumentLoadSuccess = (pdf: any) => {
    setNumPages(pdf.numPages);
    setPdfObject(pdf);
  };

  const handlePageChange = useCallback((page: number) => {
      if (!activeDoc) return;
      const safePage = Math.max(1, Math.min(numPages || Infinity, page));
      updateDocumentProgress(activeDoc.id, safePage, scale);
  }, [activeDoc, numPages, scale, updateDocumentProgress]);

  const handleZoomChange = (newScale: number) => {
      setScale(newScale);
      if (activeDoc) updateDocumentProgress(activeDoc.id, activeDoc.currentPage, newScale);
  };

  // --- LOGICA DE SELEÇÃO ---
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

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Mostra o menu acima da seleção
      setSelectionMenu({
          top: rect.top,
          left: rect.left + (rect.width / 2),
          text
      });
  }, []);

  const handleCopy = () => {
      if (selectionMenu) {
          navigator.clipboard.writeText(selectionMenu.text);
          setSelectionMenu(null);
      }
  };

  const handleAddToNote = () => {
      if (!selectionMenu || !activeDoc) return;
      
      // Garante que o painel lateral esteja aberto
      if (!showSplitView) setShowSplitView(true);

      const targetId = `doc_note_${activeDoc.id}`;
      const existingNote = blocks.find(b => b.id === targetId);
      
      if (!existingNote) {
          addBlock('container', { x: 0, y: 0 }, undefined, 'Documentos', targetId);
          setTimeout(() => {
              updateBlock(targetId, { title: `Notas: ${activeDoc.title}` });
              setTimeout(() => {
                  addInnerBlock(targetId, 'quote', selectionMenu.text);
              }, 50);
          }, 50);
      } else {
          addInnerBlock(targetId, 'quote', selectionMenu.text);
      }

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

  useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
          if (e.ctrlKey) {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              handleZoomChange(Math.min(Math.max(0.5, scale + delta), 3.0));
          }
      };
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
  }, [scale]);

  if (!activeDoc) return null;

  return (
    <div className="flex flex-col h-full bg-[#1e233c] relative overflow-hidden">
      
      {/* Menu Flutuante de Seleção */}
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
        setScale={handleZoomChange} 
        pageNumber={activeDoc.currentPage} 
        numPages={numPages} 
        setPageNumber={handlePageChange}
        onClose={closeDocument}
        rotate={rotate}
        setRotate={setRotate}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        showSplitView={showSplitView}
        setShowSplitView={setShowSplitView}
      />

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* Sidebar de Navegação */}
          {showSidebar && (
              <PDFSidebar 
                  pdfFile={activeDoc.path}
                  pdfObject={pdfObject}
                  numPages={numPages || 0}
                  currentPage={activeDoc.currentPage}
                  onPageClick={handlePageChange}
              />
          )}

          {/* Área Principal do PDF */}
          <div 
            ref={containerRef} 
            className="flex-1 overflow-auto bg-[#2a2f45] flex justify-center p-8 relative custom-scrollbar"
            onMouseUp={handleTextSelection}
          >
            <Document
              file={activeDoc.path}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="text-white mt-10 animate-pulse">Carregando documento...</div>}
              error={<div className="text-red-400 mt-10 bg-red-500/10 p-4 rounded-xl border border-red-500/20">Erro ao carregar PDF. O arquivo pode ter sido movido ou corrompido.</div>}
              className="flex flex-col items-center"
            >
              <div className="relative border border-white/5 shadow-2xl transition-all duration-200" style={{ filter: 'invert(0.92) hue-rotate(180deg) contrast(0.9)' }}> 
                 <Page 
                    pageNumber={activeDoc.currentPage} 
                    scale={scale} 
                    rotate={rotate}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={<div className="w-[600px] h-[800px] bg-white animate-pulse" />}
                 />
              </div>
              
              {/* Botões Flutuantes de Navegação */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0f1223]/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex gap-4 items-center shadow-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 z-40">
                  <button onClick={() => handlePageChange(activeDoc.currentPage - 1)} disabled={activeDoc.currentPage <= 1} className="text-white hover:text-blue-400 disabled:opacity-30"><Icon name="arrowLeft" size={20} /></button>
                  <span className="text-xs font-bold text-gray-300">Pág {activeDoc.currentPage}</span>
                  <button onClick={() => handlePageChange(activeDoc.currentPage + 1)} disabled={!numPages || activeDoc.currentPage >= numPages} className="text-white hover:text-blue-400 disabled:opacity-30"><Icon name="arrowRight" size={20} /></button>
              </div>
            </Document>
          </div>

          {/* Split View: Editor de Notas */}
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

export default PDFReader;
