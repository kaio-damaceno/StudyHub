
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';

const FloatingToolbar: React.FC = () => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Só mostra se a seleção estiver dentro do editor
      const editor = document.getElementById('block-editor-content');
      if (editor && !editor.contains(range.commonAncestorContainer)) {
          setPosition(null);
          return;
      }

      setPosition({
        top: rect.top - 45, // Acima do texto
        left: rect.left + rect.width / 2 - 100, // Centralizado (estimado 200px largura)
      });
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    
    // Esconde ao scrollar
    document.addEventListener('scroll', () => setPosition(null), true);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('scroll', () => setPosition(null), true);
    };
  }, []);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    // Mantém a toolbar visível se possível, ou deixa o evento de mouseup lidar
  };

  if (!position) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] flex items-center bg-[#1e233c] border border-blue-400/20 rounded-lg shadow-xl px-1 py-1 animate-[fadeIn_0.1s_ease]"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()} // Impede perder o foco da seleção
    >
      <ToolbarButton icon="bold" onClick={() => executeCommand('bold')} tooltip="Negrito (Ctrl+B)" />
      <ToolbarButton icon="italic" onClick={() => executeCommand('italic')} tooltip="Itálico (Ctrl+I)" />
      <ToolbarButton icon="underline" onClick={() => executeCommand('underline')} tooltip="Sublinhado (Ctrl+U)" />
      <div className="w-[1px] h-4 bg-white/10 mx-1" />
      <ToolbarButton icon="highlighter" onClick={() => executeCommand('hiliteColor', '#fcd34d')} tooltip="Marca-texto" />
      <ToolbarButton icon="code" onClick={() => executeCommand('formatBlock', 'PRE')} tooltip="Código Inline" />
      <ToolbarButton icon="link" onClick={() => {
          const url = prompt('URL:');
          if (url) executeCommand('createLink', url);
      }} tooltip="Link" />
    </div>
  );
};

const ToolbarButton = ({ icon, onClick, tooltip }: { icon: any; onClick: () => void; tooltip: string }) => (
    <button 
        onClick={onClick}
        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        title={tooltip}
    >
        {/* Mapeamento simples de ícones para evitar importar todos */}
        {icon === 'bold' ? <b>B</b> : 
         icon === 'italic' ? <i>I</i> : 
         icon === 'underline' ? <u>U</u> : 
         icon === 'highlighter' ? <span className="bg-yellow-400 text-black px-1 rounded text-xs font-bold">H</span> :
         <Icon name={icon} size={14} />
        }
    </button>
);

export default FloatingToolbar;
