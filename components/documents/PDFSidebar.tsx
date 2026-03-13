
import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import PDFThumbnails from './PDFThumbnails';
import PDFOutline from './PDFOutline';

interface PDFSidebarProps {
  pdfFile: string;
  pdfObject: any;
  numPages: number;
  currentPage: number;
  onPageClick: (page: number) => void;
}

const PDFSidebar: React.FC<PDFSidebarProps> = ({ pdfFile, pdfObject, numPages, currentPage, onPageClick }) => {
  const [activeTab, setActiveTab] = useState<'THUMBS' | 'OUTLINE'>('THUMBS');

  return (
    <div className="w-[260px] bg-[#0f1223] border-r border-white/5 flex flex-col shrink-0 animate-[slideInLeft_0.2s_ease]">
      <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab('THUMBS')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'THUMBS' ? 'text-blue-400 bg-white/5 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
              <div className="flex items-center justify-center gap-2"><Icon name="layout" size={14} /> Páginas</div>
          </button>
          <button 
            onClick={() => setActiveTab('OUTLINE')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'OUTLINE' ? 'text-blue-400 bg-white/5 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
              <div className="flex items-center justify-center gap-2"><Icon name="list" size={14} /> Sumário</div>
          </button>
      </div>

      {activeTab === 'THUMBS' ? (
          <PDFThumbnails 
            pdfFile={pdfFile} 
            numPages={numPages} 
            currentPage={currentPage} 
            onPageClick={onPageClick} 
          />
      ) : (
          <PDFOutline 
            pdfObject={pdfObject} 
            onItemClick={onPageClick} 
          />
      )}
    </div>
  );
};

export default PDFSidebar;
