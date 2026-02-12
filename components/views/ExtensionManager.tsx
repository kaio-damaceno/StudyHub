
import React, { useState, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { ExtensionItem } from '../../electron';

interface ExtensionManagerProps {
  extensions: ExtensionItem[];
  extStatus: Record<string, string>;
  onRemoveExtension: (id: string) => void;
  onNavigate: (url: string) => void;
}

const ExtensionManager: React.FC<ExtensionManagerProps> = ({
  extensions,
  extStatus,
  onRemoveExtension,
  onNavigate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const files = Array.from(e.dataTransfer.files) as File[];
    const extensionFile = files.find(f => f.name.endsWith('.crx') || f.name.endsWith('.zip'));

    if (extensionFile && window.api) {
        // @ts-ignore - Electron file object has path
        window.api.installExtensionFromFile(extensionFile.path);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && window.api) {
          // @ts-ignore
          window.api.installExtensionFromFile(file.path);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadUnpacked = () => {
      // Aciona dialogo no main process para abrir pasta
      if (window.api) {
          window.api.installExtensionFromFile('__UNPACKED__');
      }
  };

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 animate-[fadeIn_0.3s_ease]">
      
      {/* Header de Ações */}
      <div className="flex flex-col gap-4 p-4 md:p-6 bg-[#1e233c]/30 border border-blue-400/10 rounded-xl">
          <div>
              <h2 className="text-lg font-bold text-white mb-1">Gerenciador de Extensões</h2>
              <p className="text-xs text-gray-400 max-w-md">
                  Instale extensões da Chrome Web Store ou carregue arquivos .CRX/.ZIP manualmente.
              </p>
          </div>
          
          <div className="grid grid-cols-1 md:flex md:flex-row gap-3">
               <button 
                  onClick={() => onNavigate('https://chromewebstore.google.com')}
                  className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/20 transition-all order-1 md:order-3"
              >
                  <Icon name="plus" size={16} /> <span className="md:hidden">Ir para</span> Chrome Web Store
                  <span className="hidden md:inline">Chrome Web Store</span>
              </button>

              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-lg bg-[#1e233c] hover:bg-[#2a3050] text-gray-300 text-xs font-medium border border-white/10 transition-all order-2"
              >
                  <Icon name="download" size={16} /> Instalar de Arquivo
              </button>

              <button 
                  onClick={handleLoadUnpacked}
                  className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-lg bg-[#1e233c] hover:bg-[#2a3050] text-gray-300 text-xs font-medium border border-white/10 transition-all order-3 md:order-1"
              >
                  <Icon name="folderOpen" size={16} /> <span className="md:hidden">Carregar Pasta (Dev)</span>
                  <span className="hidden md:inline">Carregar Desempacotada</span>
              </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".crx,.zip" 
            className="hidden" 
          />
      </div>

      {/* Drop Zone - Hidden on Mobile */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
            hidden md:flex relative flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all
            ${isDragging 
                ? 'border-blue-400 bg-blue-400/10 text-blue-200 scale-[1.01]' 
                : 'border-white/5 bg-[#0f1223]/50 text-gray-500 hover:border-white/10 hover:bg-[#0f1223]'
            }
        `}
      >
          <div className="pointer-events-none flex flex-col items-center">
              <Icon name="puzzle" size={32} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">Arraste arquivos .CRX ou .ZIP aqui para instalar</p>
          </div>
      </div>

      {/* Lista de Extensões */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          {extensions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-50 text-center px-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
                        <Icon name="puzzle" size={32} />
                    </div>
                    <p className="text-gray-400 font-medium">Nenhuma extensão instalada.</p>
                    <p className="text-xs text-gray-600 mt-2">Visite a Chrome Web Store para adicionar funcionalidades.</p>
                </div>
          ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                    {extensions.map(ext => (
                        <div key={ext.id} className="bg-[#1e233c]/40 border border-blue-400/10 rounded-xl p-4 hover:border-blue-400/30 transition-all relative group flex flex-col h-auto min-h-[120px]">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {ext.icon ? (
                                        <img 
                                            src={`studyhub-ext://${ext.id}/${ext.icon}`} 
                                            className="w-10 h-10 rounded-lg bg-white object-contain shrink-0"
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black font-bold text-lg shrink-0">
                                            {ext.title.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-200 text-sm leading-tight truncate" title={ext.title}>{ext.title}</h3>
                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">v{ext.version || '1.0'}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {extStatus[ext.id] && (
                                        <span className="text-[10px] text-blue-400 animate-pulse font-bold px-2 py-1 bg-blue-400/10 rounded">{extStatus[ext.id]}</span>
                                    )}
                                    <button 
                                        onClick={() => onRemoveExtension(ext.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-400/10 hover:text-red-400 transition-all bg-[#0a0e27]/50"
                                        title="Remover"
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-3">
                                {ext.description || "Sem descrição disponível."}
                            </p>

                            <div className="pt-3 mt-auto border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] text-gray-600 font-mono truncate max-w-[150px]">{ext.id}</span>
                                <span className="text-[9px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Ativo
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
          )}
      </div>
    </div>
  );
};

export default ExtensionManager;
