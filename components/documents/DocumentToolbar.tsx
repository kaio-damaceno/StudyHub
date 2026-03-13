
import React from 'react';
import { Icon } from '../ui/Icon';

interface DocumentToolbarProps {
  scale: number;
  setScale: (s: number) => void;
  pageNumber: number;
  numPages: number | null;
  setPageNumber: (p: number) => void;
  onClose: () => void;
  rotate: number;
  setRotate: (r: number) => void;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  showSplitView: boolean;
  setShowSplitView: (v: boolean) => void;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({ 
  scale, setScale, pageNumber, numPages, setPageNumber, onClose, rotate, setRotate,
  showSidebar, setShowSidebar, showSplitView, setShowSplitView
}) => {
  return (
    <div className="h-14 bg-[#0f1223] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-50 shadow-lg select-none">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Voltar para Biblioteca">
          <Icon name="arrowLeft" size={20} />
        </button>
        
        <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

        <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className={`p-2 rounded-lg transition-colors ${showSidebar ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Alternar Barra Lateral"
        >
            <Icon name="layout" size={20} />
        </button>

        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
            <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 text-gray-300"><Icon name="chevronUp" size={16} className="-rotate-90" /></button>
            <span className="text-xs font-mono w-16 text-center text-gray-300">
                {pageNumber} <span className="text-gray-600">/</span> {numPages || '--'}
            </span>
            <button onClick={() => setPageNumber(Math.min(numPages || Infinity, pageNumber + 1))} disabled={pageNumber >= (numPages || Infinity)} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 text-gray-300"><Icon name="chevronRight" size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
         <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
            <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-1.5 hover:bg-white/10 rounded text-gray-300"><Icon name="minus" size={14} /></button>
            <span className="text-xs font-mono w-12 text-center text-blue-400 font-bold">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(3.0, scale + 0.1))} className="p-1.5 hover:bg-white/10 rounded text-gray-300"><Icon name="plus" size={14} /></button>
         </div>
         
         <button onClick={() => setRotate((rotate + 90) % 360)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Girar">
            <Icon name="rotateCw" size={18} />
         </button>
         
         <button onClick={() => setScale(1.0)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Ajustar Página">
            <Icon name="maximize" size={18} />
         </button>

         <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

         <button 
            onClick={() => setShowSplitView(!showSplitView)} 
            className={`p-2 rounded-lg transition-colors ${showSplitView ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Modo Estudo (Split View)"
         >
            <Icon name="book" size={18} />
         </button>
      </div>
    </div>
  );
};

export default DocumentToolbar;
