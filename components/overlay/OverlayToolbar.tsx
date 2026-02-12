
import React from 'react';
import { Icon } from '../ui/Icon';
import { useOverlay } from '../../contexts/OverlayContext';

export type ToolType = 'pen' | 'highlighter' | 'eraser';

interface OverlayToolbarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  currentWidth: number;
  setWidth: (w: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onClose: () => void;
}

const COLORS = [
  { value: '#000000', label: 'Preto' },
  { value: '#ef4444', label: 'Vermelho' }, // red-500
  { value: '#3b82f6', label: 'Azul' },     // blue-500
  { value: '#22c55e', label: 'Verde' },    // green-500
  { value: '#eab308', label: 'Amarelo' },  // yellow-500 (marca-texto)
  { value: '#a855f7', label: 'Roxo' },     // purple-500
];

const OverlayToolbar: React.FC<OverlayToolbarProps> = ({
  currentTool,
  setTool,
  currentColor,
  setColor,
  currentWidth,
  setWidth,
  onUndo,
  onClear,
  onClose
}) => {
  const { isEditing } = useOverlay();

  if (!isEditing) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
      <div className="bg-[#14182d] border border-blue-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 flex items-center gap-4 backdrop-blur-xl">
        
        {/* FERRAMENTAS */}
        <div className="flex gap-1 bg-[#0a0e27] p-1 rounded-xl border border-white/5">
          <ToolButton 
            icon="pencil" 
            isActive={currentTool === 'pen'} 
            onClick={() => setTool('pen')} 
            tooltip="Lápis"
          />
          <ToolButton 
            icon="highlighter" 
            isActive={currentTool === 'highlighter'} 
            onClick={() => setTool('highlighter')} 
            tooltip="Marca-texto"
          />
          <ToolButton 
            icon="eraser" 
            isActive={currentTool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            tooltip="Borracha"
          />
        </div>

        <div className="w-[1px] h-8 bg-white/10"></div>

        {/* CORES (Só mostra se não for borracha) */}
        {currentTool !== 'eraser' && (
          <div className="flex items-center gap-2 px-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`
                  w-6 h-6 rounded-full border-2 transition-all duration-200
                  ${currentColor === c.value ? 'border-white scale-125 shadow-lg' : 'border-transparent hover:scale-110'}
                `}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        )}

        {/* ESPESSURA */}
        <div className="flex items-center gap-2 px-2 w-24">
            <Icon name="circle" size={8} className="text-gray-500" />
            <input 
                type="range" 
                min={currentTool === 'highlighter' ? 10 : 1} 
                max={currentTool === 'highlighter' ? 60 : 20} 
                value={currentWidth}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <Icon name="circle" size={14} className="text-gray-500" />
        </div>

        <div className="w-[1px] h-8 bg-white/10"></div>

        {/* AÇÕES */}
        <div className="flex gap-1">
          <ActionButton icon="rotateCcw" onClick={onUndo} tooltip="Desfazer (Ctrl+Z)" />
          <ActionButton icon="trash" onClick={onClear} tooltip="Limpar Tudo" variant="danger" />
        </div>

        {/* FECHAR / SALVAR */}
        <button 
          onClick={onClose}
          className="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
        >
          Pronto
        </button>

      </div>
    </div>
  );
};

const ToolButton = ({ icon, isActive, onClick, tooltip }: any) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`
      p-3 rounded-lg transition-all duration-200 flex items-center justify-center
      ${isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-gray-400 hover:text-white hover:bg-white/10'
      }
    `}
  >
    <Icon name={icon} size={20} />
  </button>
);

const ActionButton = ({ icon, onClick, tooltip, variant }: any) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`
      p-2.5 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-white/10
      ${variant === 'danger' ? 'hover:text-red-400 hover:bg-red-500/10' : ''}
    `}
  >
    <Icon name={icon} size={18} />
  </button>
);

export default OverlayToolbar;
