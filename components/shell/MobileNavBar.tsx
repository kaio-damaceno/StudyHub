
import React from 'react';
import { Icon } from '../ui/Icon';
import { ViewState } from '../../types';

interface MobileNavBarProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  onToggleMenu: () => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeView, onNavigate, onToggleMenu }) => {
  const navItems = [
    { id: ViewState.NEW_TAB, icon: 'home', label: 'Início' },
    { id: ViewState.TASKS, icon: 'checkSquare', label: 'Tarefas' },
    { id: 'CENTER_ACTION', icon: 'plus', label: 'Novo', isAction: true }, // Botão central de destaque
    { id: ViewState.NOTES, icon: 'note', label: 'Notas' },
    { id: ViewState.SCHEDULE, icon: 'calendar', label: 'Agenda' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[65px] bg-[#0f1223]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-[9999] md:hidden pb-safe">
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(ViewState.SEARCH)} // Exemplo: Botão central abre busca ou menu rápido
              className="relative -top-5 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(37,99,235,0.5)] border-4 border-[#0f1223] active:scale-95 transition-transform"
            >
              <Icon name="search" size={24} />
            </button>
          );
        }

        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as ViewState)}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${
              isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-500/10' : ''}`}>
               <Icon 
                 name={item.icon} 
                 size={22} 
                 className={isActive ? 'fill-current' : ''} 
               />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNavBar;
