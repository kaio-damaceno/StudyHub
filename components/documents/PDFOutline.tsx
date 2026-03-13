
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';

interface PDFOutlineProps {
  pdfObject: any;
  onItemClick: (pageNumber: number) => void;
}

interface OutlineItem {
  title: string;
  dest: any;
  items: OutlineItem[];
}

const OutlineNode: React.FC<{ item: OutlineItem, level: number, onJump: (dest: any) => void }> = ({ item, level, onJump }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = item.items && item.items.length > 0;

    return (
        <div className="flex flex-col">
            <div 
                className="flex items-center py-1.5 px-2 hover:bg-white/5 cursor-pointer rounded transition-colors text-gray-300 hover:text-white"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onJump(item.dest)}
            >
                {hasChildren ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="w-4 h-4 flex items-center justify-center mr-1 text-gray-500 hover:text-white"
                    >
                        <Icon name={expanded ? "chevronDown" : "chevronRight"} size={10} />
                    </button>
                ) : <div className="w-4 mr-1" />}
                
                <span className="text-xs truncate" title={item.title}>{item.title}</span>
            </div>
            {expanded && hasChildren && (
                <div>
                    {item.items.map((sub, idx) => (
                        <OutlineNode key={idx} item={sub} level={level + 1} onJump={onJump} />
                    ))}
                </div>
            )}
        </div>
    );
};

const PDFOutline: React.FC<PDFOutlineProps> = ({ pdfObject, onItemClick }) => {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadOutline = async () => {
          if (!pdfObject) return;
          try {
              const outlineData = await pdfObject.getOutline();
              setOutline(outlineData || []);
          } catch (e) {
              console.error("Error loading outline:", e);
          } finally {
              setLoading(false);
          }
      };
      loadOutline();
  }, [pdfObject]);

  const handleJump = async (dest: any) => {
      if (!pdfObject) return;
      try {
          const pageIndex = await pdfObject.getPageIndex(dest);
          onItemClick(pageIndex + 1); // getPageIndex é 0-based
      } catch (e) {
          // Destino pode ser uma string (named destination) ou array
          if (typeof dest === 'string') {
             // Tenta resolver named destination se necessário (API complexa do PDF.js)
             console.warn("Named destinations not fully implemented yet");
          }
      }
  };

  if (loading) return <div className="p-4 text-xs text-gray-500">Carregando sumário...</div>;
  if (!outline || outline.length === 0) return <div className="p-8 text-center text-xs text-gray-500 italic">Este documento não possui sumário.</div>;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
       {outline.map((item, idx) => (
           <OutlineNode key={idx} item={item} level={0} onJump={handleJump} />
       ))}
    </div>
  );
};

export default PDFOutline;
