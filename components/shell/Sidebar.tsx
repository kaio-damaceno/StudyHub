
import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { ViewState } from '../../types';
import { useTasks } from '../../contexts/TaskContext';
import { useVisionBoard } from '../../contexts/VisionBoardContext';

const getLogoPath = () => 'logo.svg';

interface SidebarProps {
  onHome: () => void;
  onTasks: () => void;
  onSchedule: () => void;
  onLibrary: () => void;
  onNotes: () => void;
  onFlashcards: () => void;
  onMindMap: () => void;
  onDocuments: () => void;
  onSettings: () => void;
  activeView: ViewState;
  isDownloadingUpdate?: boolean; // Nova prop
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onHome, onTasks, onSchedule, onLibrary, onNotes, onFlashcards, onMindMap, onDocuments, onSettings, activeView, isDownloadingUpdate 
}) => {
  const { toggleWidget } = useTasks();
  const { isEditing, setIsEditing } = useVisionBoard();
  const [logoError, setLogoError] = useState(false);
  const logoPath = useMemo(() => getLogoPath(), []);

  const handleHomeClick = () => {
    setIsEditing(false);
    onHome();
  };

  const handleVisionBoardEdit = () => {
    if (activeView === ViewState.NEW_TAB) {
        setIsEditing(true);
    } else {
        onHome(); 
        setTimeout(() => setIsEditing(true), 100);
    }
  };

  return (
    <div className="w-[50px] bg-[#0f1223] flex flex-col items-center py-4 border-r border-blue-400/10 gap-4 z-[100] select-none">
      <div className="mb-2">
        <button 
          onClick={handleHomeClick}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden ${activeView === ViewState.NEW_TAB && !isEditing ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'hover:bg-blue-400/10'}`}
          title="Início"
        >
           {!logoError ? (
             <img src={logoPath} alt="Logo" className="w-8 h-8 object-contain" onError={() => setLogoError(true)} />
           ) : (
             <Icon name="home" size={24} />
           )}
        </button>
      </div>

      <div className="flex flex-col gap-2 w-full px-1">
        <SidebarItem 
           icon="home" 
           active={activeView === ViewState.NEW_TAB && !isEditing} 
           onClick={handleHomeClick} 
           tooltip="Início"
        />

        <SidebarItem 
           icon="palette" 
           active={isEditing} 
           onClick={handleVisionBoardEdit} 
           tooltip="Customizar Mural"
        />
        
        <div className="w-full h-[1px] bg-white/5 my-1" />
        
        <SidebarItem icon="checkSquare" active={activeView === ViewState.TASKS} onClick={() => { setIsEditing(false); onTasks(); }} tooltip="Tarefas" />
        <SidebarItem icon="calendar" active={activeView === ViewState.SCHEDULE} onClick={() => { setIsEditing(false); onSchedule(); }} tooltip="Cronograma" />
        <SidebarItem icon="notebook" active={activeView === ViewState.NOTES} onClick={() => { setIsEditing(false); onNotes(); }} tooltip="Notas" />
        <SidebarItem icon="cards" active={activeView === ViewState.FLASHCARDS} onClick={() => { setIsEditing(false); onFlashcards(); }} tooltip="Flashcards" />
        <SidebarItem icon="network" active={activeView === ViewState.MINDMAP} onClick={() => { setIsEditing(false); onMindMap(); }} tooltip="Mapas Mentais" />
        <SidebarItem icon="fileText" active={activeView === ViewState.DOCUMENTS} onClick={() => { setIsEditing(false); onDocuments(); }} tooltip="Documentos" />
        <SidebarItem icon="library" active={activeView === ViewState.LIBRARY} onClick={() => { setIsEditing(false); onLibrary(); }} tooltip="Biblioteca" />
      </div>

      <div className="mt-auto flex flex-col gap-2 w-full px-1">
         <button onClick={toggleWidget} className="w-full aspect-square rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <Icon name="externalLink" size={20} />
         </button>
         <div className="relative">
             <SidebarItem icon="settings" active={activeView === ViewState.SETTINGS} onClick={() => { setIsEditing(false); onSettings(); }} tooltip={isDownloadingUpdate ? "Baixando atualização..." : "Configurações"} />
             {isDownloadingUpdate && (
                 <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border border-[#0f1223] animate-pulse"></span>
             )}
         </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, active, onClick, tooltip }: { icon: string, active: boolean, onClick: () => void, tooltip: string }) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-200 group relative ${active ? 'bg-blue-400/10 text-blue-400' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
  >
    <Icon name={icon} size={20} />
    {active && <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-blue-400 rounded-r-full" />}
  </button>
);

export default Sidebar;
