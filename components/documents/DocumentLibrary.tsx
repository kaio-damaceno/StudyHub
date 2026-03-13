
import React, { useState } from 'react';
import { useDocument } from '../../contexts/DocumentContext';
import { Icon } from '../ui/Icon';
import { useContextMenu } from '../../hooks/useContextMenu';
import { DocumentFile } from '../../types';

const DocumentLibrary: React.FC = () => {
  const { documents, openDocument, removeDocument, importFromFileSystem, loadDocument } = useDocument();
  const { handleContextMenu } = useContextMenu();
  const [isDragging, setIsDragging] = useState(false);

  const getDocTypeInfo = (path: string) => {
      if (!path) return { label: '?', color: 'bg-gray-500' };
      const lower = path.toLowerCase();
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) return { label: 'WORD', color: 'bg-blue-500' };
      if (lower.endsWith('.txt')) return { label: 'TXT', color: 'bg-gray-500' };
      if (lower.endsWith('.md')) return { label: 'MD', color: 'bg-purple-500' };
      if (lower.endsWith('.pdf')) return { label: 'PDF', color: 'bg-red-500' };
      if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(lower)) return { label: 'IMG', color: 'bg-emerald-500' };
      // Fallback para outros tipos
      return { label: 'FILE', color: 'bg-gray-600' };
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = () => {
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
          files.forEach(file => loadDocument(file));
      }
  };

  const onDocumentContextMenu = (e: React.MouseEvent, doc: DocumentFile) => {
      handleContextMenu(e, [
          { label: 'Abrir', icon: 'fileText', onClick: () => openDocument(doc.id) },
          { label: 'Mostrar na Pasta', icon: 'folderOpen', onClick: () => { if(window.api) window.api.openPath(doc.path); } },
          { type: 'separator' },
          { label: 'Copiar Caminho', icon: 'copy', onClick: () => navigator.clipboard.writeText(doc.path) },
          { type: 'separator' },
          { label: 'Remover da Biblioteca', icon: 'trash', variant: 'danger', onClick: () => removeDocument(doc.id) }
      ]);
  };

  return (
    <div 
        className="flex-1 bg-[#0a0e27] p-8 overflow-y-auto custom-scrollbar animate-[fadeIn_0.3s_ease] relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {/* Overlay de Drag */}
      {isDragging && (
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-3xl pointer-events-none">
              <div className="bg-[#0a0e27] p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
                  <Icon name="download" size={48} className="text-blue-400 mb-4" />
                  <h3 className="text-xl font-bold text-white">Solte para Importar</h3>
                  <p className="text-sm text-blue-300">PDF, Word, Texto, Imagens e outros</p>
              </div>
          </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meus Documentos</h1>
            <p className="text-sm text-gray-400">Gerencie e estude seus PDFs, DOCs, textos e imagens.</p>
          </div>
          <button 
            onClick={importFromFileSystem}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Icon name="plus" size={16} /> Importar Arquivo
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-40 text-center border-2 border-dashed border-white/10 rounded-3xl">
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
              <Icon name="fileText" size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-300 font-medium text-lg">Sua biblioteca está vazia.</p>
            <p className="text-sm text-gray-500 mt-2">Arraste arquivos aqui ou clique em Importar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {documents.map(doc => {
                const typeInfo = getDocTypeInfo(doc.path);
                
                return (
                  <div 
                    key={doc.id}
                    onClick={() => openDocument(doc.id)}
                    onContextMenu={(e) => onDocumentContextMenu(e, doc)}
                    className="group bg-[#1e233c]/40 border border-white/5 hover:bg-[#1e233c] hover:border-blue-500/30 p-4 rounded-2xl cursor-pointer transition-all flex flex-col h-[220px] relative overflow-hidden hover:shadow-xl hover:-translate-y-1"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                      className="absolute top-3 right-3 z-10 p-2 bg-[#0a0e27]/80 text-gray-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                      <Icon name="trash" size={14} />
                    </button>

                    <div className="flex-1 flex items-center justify-center bg-black/20 rounded-xl mb-4 border border-white/5 group-hover:border-blue-500/10 transition-colors overflow-hidden">
                       <div className="w-16 h-20 bg-white shadow-lg flex flex-col items-center justify-center rounded-sm relative overflow-hidden">
                          <div className={`w-full h-2 ${typeInfo.color} absolute top-0`}></div>
                          <div className="space-y-1 w-full px-2 opacity-30">
                              <div className="h-1 bg-black w-full rounded-full"></div>
                              <div className="h-1 bg-black w-3/4 rounded-full"></div>
                              <div className="h-1 bg-black w-5/6 rounded-full"></div>
                          </div>
                          <span className="text-[8px] font-bold text-gray-400 mt-2">{typeInfo.label}</span>
                       </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-200 truncate mb-1" title={doc.title}>{doc.title}</h3>
                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span>{typeInfo.label}</span>
                            <span>{new Date(doc.lastOpened).toLocaleDateString()}</span>
                        </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLibrary;
