
import React, { useEffect } from 'react';
import { EditorBlockData } from '../../types';
import { Icon } from '../ui/Icon';
import ContentEditable from '../ui/ContentEditable';

interface EditorBlockItemProps {
  block: EditorBlockData;
  index: number;
  isSelected: boolean;
  onUpdate: (content: string, properties?: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const EditorBlockItem: React.FC<EditorBlockItemProps> = ({
  block,
  isSelected,
  onUpdate,
  onKeyDown,
  onFocus,
  onDragStart,
  onDrop
}) => {
  
  useEffect(() => {
    if (isSelected) {
        const el = document.getElementById(`editable-${block.id}`);
        el?.focus();
    }
  }, [isSelected, block.id]);

  const renderContent = () => {
    switch (block.type) {
      case 'h1':
        return (
          <ContentEditable
            id={`editable-${block.id}`}
            html={block.content}
            onChange={(html) => onUpdate(html)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            tagName="h1"
            className="text-3xl font-bold text-white mb-2 mt-6 outline-none"
            placeholder="Título 1"
          />
        );
      case 'h2':
        return (
          <ContentEditable
            id={`editable-${block.id}`}
            html={block.content}
            onChange={(html) => onUpdate(html)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            tagName="h2"
            className="text-2xl font-bold text-white/90 mb-2 mt-4 outline-none"
            placeholder="Título 2"
          />
        );
      case 'h3':
        return (
          <ContentEditable
            id={`editable-${block.id}`}
            html={block.content}
            onChange={(html) => onUpdate(html)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            tagName="h3"
            className="text-xl font-bold text-white/80 mb-1 mt-3 outline-none"
            placeholder="Título 3"
          />
        );
      case 'todo-list':
        return (
          <div className="flex items-start gap-2 py-1">
            <button
              onClick={() => onUpdate(block.content, { checked: !block.properties?.checked })}
              className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                block.properties?.checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 hover:border-blue-400'
              }`}
            >
              {block.properties?.checked && <Icon name="checkSquare" size={12} />}
            </button>
            <ContentEditable
              id={`editable-${block.id}`}
              html={block.content}
              onChange={(html) => onUpdate(html)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              className={`flex-1 outline-none text-sm leading-relaxed ${block.properties?.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}
              placeholder="Tarefa..."
            />
          </div>
        );
      case 'bullet-list':
        return (
          <div className="flex items-start gap-3 py-1">
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            <ContentEditable
              id={`editable-${block.id}`}
              html={block.content}
              onChange={(html) => onUpdate(html)}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              className="flex-1 outline-none text-sm text-gray-200 leading-relaxed"
              placeholder="Item da lista..."
            />
          </div>
        );
      case 'image':
        return (
            <div className="my-4 group/img relative">
                {block.properties?.url ? (
                    <img src={block.properties.url} className="rounded-lg max-w-full h-auto" style={{ width: block.properties.width || '100%' }} />
                ) : (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-8 text-center text-gray-500 text-xs italic">
                        Imagem vazia.
                    </div>
                )}
            </div>
        );
      case 'divider':
        return <div className="h-[1px] bg-white/10 my-4 w-full" />;
      case 'quote':
        return (
            <div className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-300 bg-white/5 py-2 rounded-r-lg">
                <ContentEditable
                    id={`editable-${block.id}`}
                    html={block.content}
                    onChange={(html) => onUpdate(html)}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    className="outline-none text-sm leading-relaxed"
                    placeholder="Citação..."
                />
            </div>
        );
      default:
        return (
          <ContentEditable
            id={`editable-${block.id}`}
            html={block.content}
            onChange={(html) => onUpdate(html)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            className="text-sm text-gray-200 leading-relaxed py-1 outline-none min-h-[1.5em]"
            placeholder="Digite '/' para comandos..."
          />
        );
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="group/row flex items-start gap-1 relative -ml-10 pr-4"
      style={{ paddingLeft: `${(block.level || 0) * 24 + 40}px` }}
    >
      {/* Drag Handle */}
      <div className="opacity-0 group-hover/row:opacity-100 flex items-center transition-opacity absolute left-0 h-8">
        <div className="cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-gray-300">
          <Icon name="menu" size={14} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default EditorBlockItem;
