
import React from 'react';
import { useOverlay } from '../../contexts/OverlayContext';
import { Icon } from '../ui/Icon';

const OverlayTrigger: React.FC = () => {
  const { isEditing, toggleEditing, hasDrawing } = useOverlay();

  return (
    <div 
        className={`fixed bottom-6 right-6 z-[9990] flex flex-col gap-2 transition-all duration-300 ${isEditing ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}
    >
      <button
        onClick={toggleEditing}
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border bg-[#1e233c]/80 backdrop-blur-md text-gray-400 border-white/10 hover:text-white hover:bg-[#1e233c] hover:scale-105 transition-all"
        title="Anotar na Tela"
      >
        <div className="relative">
            <Icon name="pencil" size={24} />
            {hasDrawing && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#1e233c]"></span>
            )}
        </div>
      </button>
    </div>
  );
};

export default OverlayTrigger;
