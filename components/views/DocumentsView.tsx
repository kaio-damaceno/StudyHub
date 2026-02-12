import React from 'react';
import { useDocument } from '../../contexts/DocumentContext';
import DocumentLibrary from '../documents/DocumentLibrary';
import PDFReader from '../documents/PDFReader';
import WordReader from '../documents/WordReader';
import TextReader from '../documents/TextReader';
import ImageReader from '../documents/ImageReader';

const DocumentsContent: React.FC = () => {
  const { activeDoc } = useDocument();

  if (activeDoc) {
      const path = activeDoc.path.toLowerCase();
      
      if (path.endsWith('.docx') || path.endsWith('.doc')) {
          return <WordReader />;
      }
      
      if (path.endsWith('.pdf')) {
          return <PDFReader />;
      }

      if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(path)) {
          return <ImageReader />;
      }

      // Fallback para texto e qualquer outro arquivo genérico que não seja PDF ou Word
      return <TextReader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0e27] overflow-hidden relative">
      <DocumentLibrary />
    </div>
  );
};

const DocumentsView: React.FC = () => {
  return (
      <DocumentsContent />
  );
};

export default DocumentsView;