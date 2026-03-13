
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Icon } from '../ui/Icon';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  showCloze?: boolean;
}

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '30', '36'];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  minHeight = "120px",
  showCloze = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const savedSelection = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      if (value === "") editorRef.current.innerHTML = "";
      else if (editorRef.current.innerHTML === "") editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    if (selectedImg) {
      const updateRect = () => setImgRect(selectedImg.getBoundingClientRect());
      updateRect();
      window.addEventListener('resize', updateRect);
      return () => window.removeEventListener('resize', updateRect);
    } else {
      setImgRect(null);
    }
  }, [selectedImg]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelection.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelection.current);
      }
    } else {
      editorRef.current?.focus();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // --- TRATAMENTO DE CLIPBOARD (COLAR IMAGEM) ---
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            if (!blob) continue;

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                insertImage(base64);
            };
            reader.readAsDataURL(blob);
            return;
        }
    }
  }, []);

  const insertImage = (src: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const imgHtml = `<img src="${src}" style="width: 100%; border-radius: 12px; margin: 8px 0; display: block; cursor: pointer;" />`;
    document.execCommand('insertHTML', false, imgHtml);
    handleInput();
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, val);
    handleInput();
    saveSelection();
  };

  const createCloze = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) return;
    restoreSelection();
    const selectedText = sel.toString();
    const matches = editorRef.current.innerHTML.match(/{{c(\d+)::/g);
    let nextIdx = 1;
    if (matches) nextIdx = Math.max(...matches.map(m => parseInt(m.match(/\d+/)![0]))) + 1;
    document.execCommand('insertHTML', false, `<span class="text-blue-400 font-bold">{{c${nextIdx}::${selectedText}}}</span>`);
    handleInput();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => insertImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className={`flex flex-col border rounded-2xl transition-all duration-200 overflow-hidden bg-[#0a0e27] relative ${isFocused ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-white/10'} ${className}`}>
      <div className="flex items-center gap-0.5 p-1.5 border-b border-white/5 bg-[#14182d]/50 overflow-x-auto scrollbar-hide">
        {showCloze && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={createCloze} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all font-bold text-xs shrink-0">[...]</button>
        )}
        <select onChange={(e) => {
            restoreSelection();
            document.execCommand('fontSize', false, '7');
            editorRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
                (el as HTMLElement).removeAttribute('size');
                (el as HTMLElement).style.fontSize = e.target.value + 'px';
            });
            handleInput();
        }} onMouseDown={saveSelection} className="bg-[#0a0e27] border border-white/10 text-[10px] text-gray-300 rounded px-1 py-1 outline-none mr-1" defaultValue="16">
          {FONT_SIZES.map(size => <option key={size} value={size}>{size}px</option>)}
        </select>
        <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
        <ToolbarButton icon="bold" onClick={() => execCommand('bold')} title="Negrito" />
        <ToolbarButton icon="italic" onClick={() => execCommand('italic')} title="Itálico" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => colorInputRef.current?.click()} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all shrink-0">
          <Icon name="palette" size={16} />
          <input ref={colorInputRef} type="color" className="sr-only" onChange={(e) => execCommand('foreColor', e.target.value)} />
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1 shrink-0" />
        <ToolbarButton icon="list" onClick={() => execCommand('insertUnorderedList')} title="Lista" />
        <label className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all shrink-0" onMouseDown={saveSelection}>
          <Icon name="image" size={16} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <ToolbarButton icon="rotateCw" onClick={() => execCommand('removeFormat')} title="Limpar" />
      </div>

      {selectedImg && imgRect && editorRef.current && (
        <div className="absolute pointer-events-none z-10 border-2 border-blue-500 transition-all duration-75" style={{ top: selectedImg.offsetTop + 45, left: selectedImg.offsetLeft + 16, width: selectedImg.offsetWidth, height: selectedImg.offsetHeight }}>
          <div onMouseDown={(e) => {
              e.preventDefault(); e.stopPropagation();
              const startX = e.clientX; const startWidth = selectedImg.offsetWidth; const editorW = editorRef.current!.offsetWidth;
              const move = (ev: MouseEvent) => {
                  const newW = Math.max(50, startWidth + (ev.clientX - startX));
                  selectedImg.style.width = `${Math.min(100, (newW / editorW) * 100)}%`;
                  setImgRect(selectedImg.getBoundingClientRect());
              };
              const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); handleInput(); };
              document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
          }} className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize pointer-events-auto flex items-center justify-center"><div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-lg" /></div>
          <button onClick={() => { selectedImg.remove(); setSelectedImg(null); handleInput(); }} className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center pointer-events-auto shadow-lg"><Icon name="trash" size={12} /></button>
        </div>
      )}

      <div 
        ref={editorRef}
        contentEditable
        onPaste={handlePaste}
        onClick={(e) => { const t = e.target as HTMLElement; if (t.tagName === 'IMG') setSelectedImg(t as HTMLImageElement); else setSelectedImg(null); }}
        onInput={handleInput}
        onFocus={() => { setIsFocused(true); saveSelection(); }}
        onBlur={() => { setIsFocused(false); saveSelection(); }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="p-4 outline-none text-sm text-gray-200 overflow-y-auto custom-scrollbar leading-relaxed prose prose-invert max-w-none min-h-[inherit]"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
      
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; cursor: text; }
        [contenteditable] img { border-radius: 12px; margin: 8px 0; display: block; transition: outline 0.2s; cursor: pointer; max-width: 100%; }
        [contenteditable] img:hover { outline: 2px solid rgba(59, 130, 246, 0.5); }
        [contenteditable] ul { list-style-type: disc; padding-left: 24px; margin: 8px 0; }
      `}</style>
    </div>
  );
};

const ToolbarButton = ({ icon, onClick, title }: { icon: string, onClick: () => void, title: string }) => (
  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all shrink-0">
    <Icon name={icon} size={16} />
  </button>
);

export default RichTextEditor;
