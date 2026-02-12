
import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';

const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.api && window.api.onWindowStateChanged) {
       const remove = window.api.onWindowStateChanged((newState) => {
           setIsMaximized(newState === 'maximized');
       });
       return remove;
    }
  }, []);

  const handleMinimize = () => {
    if (window.api) window.api.minimize();
  };

  const handleMaximize = () => {
    if (window.api) window.api.maximize();
  };

  const handleClose = () => {
    if (window.api) window.api.close();
  };

  // Ocultar em telas pequenas (mobile não usa window controls)
  return (
    <div className="hidden md:flex items-center h-full ml-2 z-[9999]" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <button 
        onClick={handleMinimize}
        className="h-8 w-11 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        title="Minimizar"
      >
        <Icon name="minus" size={14} />
      </button>
      <button 
        onClick={handleMaximize}
        className="h-8 w-11 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        title={isMaximized ? "Restaurar" : "Maximizar"}
      >
        <Icon name={isMaximized ? "restore" : "stop"} size={isMaximized ? 12 : 12} className={isMaximized ? "" : ""} />
      </button>
      <button 
        onClick={handleClose}
        className="h-8 w-11 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
        title="Fechar"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
};

export default WindowControls;
