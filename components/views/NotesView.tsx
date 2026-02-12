
import React, { useEffect } from 'react';
import { useNotes } from '../../contexts/NotesContext';
import NotesCanvas from '../notes/NotesCanvas';
import NotesListView from '../notes/NotesListView';
import FoldersView from '../notes/FoldersView';
import TrashView from '../notes/TrashView';
import BlockEditor from '../notes/BlockEditor';
import { NotesSidebar } from '../notes/NotesSidebar';

const NotesContent: React.FC = () => {
  const { focusedBlockId, viewMode, setViewMode } = useNotes();

  // Force List view on mobile mount if currently on Canvas (Canvas sucks on mobile)
  useEffect(() => {
      if (window.innerWidth < 768 && viewMode === 'CANVAS') {
          setViewMode('LIST');
      }
  }, []);

  return (
    <div className="w-full h-full relative bg-[#0a0e27] flex overflow-hidden">
      
      {/* Sidebar: Hidden on Mobile */}
      <div className="hidden md:flex h-full shrink-0">
          <NotesSidebar />
      </div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
          
          {/* Header Navigation (Top Tabs) - Scrollable on Mobile */}
          <div className="h-12 md:h-10 bg-[#0f1223] border-b border-white/5 flex items-center px-4 gap-2 shrink-0 overflow-x-auto scrollbar-hide">
              <button 
                  onClick={() => setViewMode('CANVAS')}
                  className={`hidden md:block text-xs font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${viewMode === 'CANVAS' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
              >
                  Canvas
              </button>
              <button 
                  onClick={() => setViewMode('LIST')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${viewMode === 'LIST' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
              >
                  Todas as Notas
              </button>
              <button 
                  onClick={() => setViewMode('FOLDERS')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${viewMode === 'FOLDERS' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
              >
                  Pastas
              </button>
              <button 
                  onClick={() => setViewMode('FAVORITES')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${viewMode === 'FAVORITES' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-500 hover:text-white'}`}
              >
                  Favoritos
              </button>
              <button 
                  onClick={() => setViewMode('TRASH')}
                  className={`ml-auto text-xs font-bold px-3 py-1 rounded transition-colors whitespace-nowrap ${viewMode === 'TRASH' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white'}`}
              >
                  Lixeira
              </button>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {viewMode === 'CANVAS' && <div className="hidden md:block h-full"><NotesCanvas /></div>}
            {/* Fallback for mobile if canvas selected accidentally */}
            {viewMode === 'CANVAS' && <div className="md:hidden h-full"><NotesListView /></div>}
            
            {(viewMode === 'LIST' || viewMode === 'FAVORITES') && <NotesListView />}
            {viewMode === 'FOLDERS' && <FoldersView />}
            {viewMode === 'TRASH' && <TrashView />}
          </div>
      </div>

      {/* Editor Overlay - Full Screen on Mobile */}
      {focusedBlockId && (
        <div className="absolute inset-0 z-50 bg-[#0a0e27]">
            <BlockEditor blockId={focusedBlockId} />
        </div>
      )}
    </div>
  );
};

const NotesView: React.FC = () => {
  return (
      <NotesContent />
  );
};

export default NotesView;
