
import React from 'react';
import { Document, Page } from 'react-pdf';

interface PDFThumbnailsProps {
  pdfFile: string;
  numPages: number;
  currentPage: number;
  onPageClick: (page: number) => void;
}

const PDFThumbnails: React.FC<PDFThumbnailsProps> = ({ pdfFile, numPages, currentPage, onPageClick }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
      <Document file={pdfFile}>
        {Array.from(new Array(numPages), (el, index) => {
            const pageNum = index + 1;
            const isCurrent = pageNum === currentPage;
            
            return (
                <div 
                    key={`thumb_${index + 1}`} 
                    className={`
                        cursor-pointer flex flex-col items-center group
                        ${isCurrent ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
                    `}
                    onClick={() => onPageClick(pageNum)}
                >
                    <div className={`
                        relative rounded overflow-hidden border transition-all
                        ${isCurrent ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105' : 'border-transparent group-hover:border-white/20'}
                    `}>
                        <div style={{ filter: 'invert(0.9) hue-rotate(180deg)' }}>
                            <Page 
                                pageNumber={pageNum} 
                                width={120} 
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={<div className="w-[120px] h-[160px] bg-white/5 animate-pulse" />}
                            />
                        </div>
                        {/* Overlay Número */}
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded font-mono backdrop-blur-sm">
                            {pageNum}
                        </div>
                    </div>
                </div>
            );
        })}
      </Document>
    </div>
  );
};

export default React.memo(PDFThumbnails);
