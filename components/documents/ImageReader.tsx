
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

                    // OTIMIZAÇÃO: Usar Blob e URL.createObjectURL em vez de Base64
                    // Isso evita travamentos com imagens grandes e loops de string lentos
                    // Fix: Cast para 'any' para evitar erro de tipagem ArrayBufferLike/SharedArrayBuffer no build
                    const blob = new Blob([buffer as any], { type: mimeType });
                    objectUrl = URL.createObjectURL(blob);
                    
                    setImageSrc(objectUrl);
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

  if (!activeDoc) return null;

  return (
    <div className="flex flex-col h-full bg-[#1e233c] relative overflow-hidden">
        <DocumentToolbar 
            scale={scale}
            setScale={setScale}
            pageNumber={1} 
            numPages={1}
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
            <div className="flex-1 overflow-auto bg-[#0a0e27] flex items-center justify-center custom-scrollbar">
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
                ) : imageSrc ? (
                    <img 
                        src={imageSrc} 
                        alt={activeDoc.title}
                        className="shadow-2xl transition-transform duration-200"
                        style={{ 
                            transform: `scale(${scale}) rotate(${rotate}deg)`,
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                    />
                ) : null}
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

export default ImageReader;
