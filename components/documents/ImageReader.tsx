
import React, { useEffect, useState } from 'react';
import { useDocument } from '../../contexts/DocumentContext';
import { useNotes } from '../../contexts/NotesContext';
import { Icon } from '../ui/Icon';
import DocumentToolbar from './DocumentToolbar';
import BlockEditor from '../notes/BlockEditor';

const ImageReader: React.FC = () => {
  const { activeDoc, closeDocument } = useDocument();
  const { blocks, addBlock, updateBlock } = useNotes();
  
  const [scale, setScale] = useState(activeDoc?.zoom || 1.0); 
  const [rotate, setRotate] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Layout State
  const [showSplitView, setShowSplitView] = useState(false);
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); // Não usado para imagens, mas necessário para Toolbar

  useEffect(() => {
    let objectUrl: string | null = null;

    if (activeDoc?.path && window.api) {
        setIsLoading(true);
        setError(null);
        
        window.api.readFileBuffer(activeDoc.path).then((buffer) => {
            if (buffer && buffer.length > 0) {
                try {
                    // Determinar MimeType baseado na extensão
                    const ext = activeDoc.path.split('.').pop()?.toLowerCase();
                    let mimeType = 'image/png'; // Default
                    if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                    else if (ext === 'gif') mimeType = 'image/gif';
                    else if (ext === 'webp') mimeType = 'image/webp';
                    else if (ext === 'svg') mimeType = 'image/svg+xml';
                    else if (ext === 'bmp') mimeType = 'image/bmp';

                    // Converter Uint8Array para Base64
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64 = window.btoa(binary);
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    
                    setImageSrc(dataUrl);
                    setIsLoading(false);
                } catch (e) {
                    console.error("Erro na conversão da imagem:", e);
                    setError('Falha ao processar dados da imagem.');
                    setIsLoading(false);
                }
            } else {
                setError('Arquivo de imagem vazio ou não encontrado.');
                setIsLoading(false);
            }
        }).catch(err => {
            console.error("Erro leitura imagem:", err);
            setError('Erro de sistema ao ler a imagem.');
            setIsLoading(false);
        });
    }

    return () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [activeDoc?.path]);

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

  useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
          if (e.ctrlKey) {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setScale(prev => Math.min(Math.max(0.1, prev + delta), 5.0));
          }
      };
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
  }, [scale]);

  if (!activeDoc) return null;

  return (
    <div className="flex flex-col h-full bg-[#1e233c] relative overflow-hidden">
      
      <DocumentToolbar 
        scale={scale} 
        setScale={setScale} 
        pageNumber={1} 
        numPages={null} 
        setPageNumber={() => {}}
        onClose={closeDocument}
        rotate={rotate}
        setRotate={setRotate}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        showSplitView={showSplitView}
        setShowSplitView={setShowSplitView}
      />

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* Área Principal da Imagem */}
          <div className="flex-1 overflow-auto bg-[#0f1223] flex items-center justify-center p-8 relative custom-scrollbar">
            {isLoading ? (
                <div className="text-white mt-10 animate-pulse flex flex-col items-center">
                    <Icon name="image" size={32} className="animate-spin mb-4 text-blue-400" />
                    <span className="text-sm font-medium">Carregando imagem...</span>
                </div>
            ) : error ? (
                <div className="text-red-400 mt-10 bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-center max-w-md">
                    <Icon name="alert" size={32} className="mx-auto mb-2" />
                    <p className="font-bold mb-2">{error}</p>
                </div>
            ) : (
                <div 
                    className="transition-transform duration-200 ease-out origin-center"
                    style={{ 
                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                    }}
                >
                    <img 
                        src={imageSrc || ''} 
                        alt={activeDoc.title}
                        className="max-w-none block rounded-sm pointer-events-none select-none"
                    />
                </div>
            )}
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

export default ImageReader;
