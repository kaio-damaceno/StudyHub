
import React, { useState, useRef } from 'react';
import { useMindMap } from '../../contexts/MindMapContext';
import { Icon } from '../ui/Icon';
import MindMapCanvas from '../MindMap/MindMapCanvas';
import MindMapFlashcardModal from '../MindMap/modals/MindMapFlashcardModal';
import MindMapNoteModal from '../MindMap/modals/MindMapNoteModal';
import MindMapNoteViewerModal from '../MindMap/modals/MindMapNoteViewerModal';
import MindMapFlashcardViewerModal from '../MindMap/modals/MindMapFlashcardViewerModal';

const MindMapView: React.FC = () => {
  const { 
      maps, currentMap, createMap, deleteMap, openMap, closeMap, 
      activeModal, setModal, importMap
  } = useMindMap();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMapTitle.trim()) {
      createMap(newMapTitle.trim());
      setNewMapTitle('');
      setIsCreating(false);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const json = JSON.parse(ev.target?.result as string);
              importMap(json);
          } catch (err) {
              alert("Erro ao ler o arquivo JSON. Certifique-se de que é um arquivo válido.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  if (currentMap) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#0a0e27] overflow-hidden relative">
        <div className="h-14 bg-[#0f1223] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <button onClick={closeMap} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
              <Icon name="arrowLeft" size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-white leading-tight">{currentMap.title}</h1>
              <span className="text-[10px] text-gray-500">Última edição: {new Date(currentMap.updatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex text-[10px] text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="bg-black/30 px-1 rounded text-gray-300">Tab</kbd> Filho</span>
                <span className="flex items-center gap-1"><kbd className="bg-black/30 px-1 rounded text-gray-300">Enter</kbd> Irmão</span>
                <span className="flex items-center gap-1"><kbd className="bg-black/30 px-1 rounded text-gray-300">Espaço</kbd> Expandir</span>
             </div>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden flex flex-col">
            <MindMapCanvas />
        </div>

        {/* Integration Modals (Creation) */}
        {activeModal?.type === 'FLASHCARD' && (
            <MindMapFlashcardModal 
                nodeId={activeModal.nodeId} 
                onClose={() => setModal(null)} 
            />
        )}
        {activeModal?.type === 'NOTE' && (
            <MindMapNoteModal 
                nodeId={activeModal.nodeId} 
                onClose={() => setModal(null)} 
            />
        )}

        {/* Viewers (Consumption) */}
        <MindMapNoteViewerModal />
        <MindMapFlashcardViewerModal />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0e27] p-8 overflow-y-auto custom-scrollbar animate-[fadeIn_0.3s_ease]">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mapas Mentais</h1>
            <p className="text-sm text-gray-400">Organize estruturas cognitivas complexas em árvores visuais.</p>
          </div>
          
          <div className="flex gap-3">
              <button 
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-[#1e233c] hover:bg-[#252b48] text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-white/5 transition-all"
              >
                <Icon name="folderOpen" size={16} /> Importar JSON
              </button>
              <input 
                type="file" 
                accept=".json" 
                ref={importInputRef} 
                onChange={handleImportJSON} 
                className="hidden" 
              />

              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Icon name="plus" size={16} /> Novo Mapa
              </button>
          </div>
        </div>

        {isCreating && (
          <div className="mb-8 bg-[#1e233c] border border-blue-500/30 p-6 rounded-2xl animate-[slideDown_0.2s_ease] shadow-2xl">
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tema Central</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  placeholder="Ex: Sistema Solar, Verbos Irregulares..."
                  className="w-full bg-[#0a0e27] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-4 py-3 text-gray-400 hover:text-white text-xs font-bold bg-white/5 hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all">Criar</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map(map => (
            <div 
              key={map.id} 
              onClick={() => openMap(map.id)}
              className="bg-[#1e233c]/40 border border-white/5 hover:bg-[#1e233c] hover:border-blue-500/30 p-6 rounded-2xl cursor-pointer transition-all group flex flex-col h-[200px] relative overflow-hidden hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteMap(map.id); }}
                  className="p-2 bg-[#0a0e27] rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shadow-lg"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
              
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-blue-500/10">
                <Icon name="network" size={28} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-200 mb-2 truncate pr-8">{map.title}</h3>
              <p className="text-xs text-gray-500 font-medium">{Object.keys(map.nodes).length} conceitos</p>
              
              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-mono">
                <span>Editado: {new Date(map.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          
          {maps.length === 0 && !isCreating && (
            <div className="col-span-full py-32 text-center opacity-40 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Icon name="network" size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-400 font-medium">Nenhum mapa mental criado ainda.</p>
              <p className="text-sm text-gray-600 mt-2">Comece criando um novo mapa acima ou importando um backup.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MindMapView;
