import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { BlockType } from '../../types';

interface SlashMenuProps {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

interface CommandItem {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

const COMMANDS: CommandItem[] = [
  { type: 'text', label: 'Texto', icon: 'fileText', description: 'Comece a escrever com texto simples.' },
  { type: 'h1', label: 'Título 1', icon: 'type', description: 'Cabeçalho de seção grande.' },
  { type: 'h2', label: 'Título 2', icon: 'type', description: 'Cabeçalho de seção médio.' },
  { type: 'h3', label: 'Título 3', icon: 'type', description: 'Cabeçalho de seção pequeno.' },
  { type: 'bullet-list', label: 'Lista com Marcadores', icon: 'list', description: 'Crie uma lista simples.' },
  { type: 'number-list', label: 'Lista Numerada', icon: 'list', description: 'Crie uma lista ordenada.' },
  { type: 'todo-list', label: 'Lista de Tarefas', icon: 'checkSquare', description: 'Acompanhe tarefas com checkbox.' },
  { type: 'toggle', label: 'Lista Alternável', icon: 'chevronRight', description: 'Oculte conteúdo dentro de um toggle.' },
  { type: 'quote', label: 'Citação', icon: 'quote', description: 'Capture uma citação.' },
  { type: 'callout', label: 'Destaque', icon: 'alert', description: 'Faça o texto se destacar.' },
  { type: 'divider', label: 'Divisor', icon: 'minus', description: 'Separe visualmente blocos.' },
  { type: 'code', label: 'Código', icon: 'code', description: 'Capture um snippet de código.' },
  { type: 'image', label: 'Imagem', icon: 'image', description: 'Carregue ou incorpore uma imagem.' },
  { type: 'table', label: 'Tabela', icon: 'layout', description: 'Adicione uma tabela simples.' },
];

const SlashMenu: React.FC<SlashMenuProps> = ({ position, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(COMMANDS[selectedIndex].type);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  // Ajuste de posição para não sair da tela
  const style: React.CSSProperties = {
    top: position.top + 24, // Um pouco abaixo da linha
    left: position.left,
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-[9999] w-[300px] bg-[#14182d] border border-blue-400/20 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.1s_ease]"
      style={style}
    >
      <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase bg-[#0f1223]">Blocos Básicos</div>
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
        {COMMANDS.map((cmd, index) => (
          <button
            key={cmd.type}
            onClick={() => onSelect(cmd.type)}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-md transition-colors ${index === selectedIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={`p-1 rounded bg-white/10 ${index === selectedIndex ? 'text-white' : 'text-gray-400'}`}>
               <Icon name={cmd.icon} size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{cmd.label}</div>
                <div className={`text-xs truncate ${index === selectedIndex ? 'text-blue-200' : 'text-gray-500'}`}>{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlashMenu;