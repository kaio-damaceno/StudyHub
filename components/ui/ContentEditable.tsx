
import React, { useRef, useEffect } from 'react';

interface ContentEditableProps {
  // Adicionado id para suportar a busca de elementos via getElementById no editor
  id?: string;
  html: string;
  tagName?: string;
  className?: string;
  onChange: (html: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ContentEditable: React.FC<ContentEditableProps> = ({
  id,
  html,
  tagName = 'div',
  className,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder,
  disabled = false
}) => {
  const contentEditableRef = useRef<HTMLElement>(null);
  const lastHtml = useRef(html);

  // Sincroniza o HTML apenas se a mudança vier de fora (ex: undo, load inicial)
  // Se a mudança veio da própria digitação, o DOM já está atualizado, então não tocamos.
  useEffect(() => {
    if (contentEditableRef.current && html !== contentEditableRef.current.innerText) {
       // Pequena validação para evitar loops se houver diferenças de formatação do browser
       // Para inputs simples de texto, innerText costuma ser mais seguro que innerHTML para evitar injeção de spans indesejados
       if (html !== lastHtml.current) {
          contentEditableRef.current.innerText = html;
          lastHtml.current = html;
       }
    }
  }, [html]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText;
    lastHtml.current = text;
    onChange(text);
  };

  const Tag = tagName as React.ElementType;

  return (
    <Tag
      ref={contentEditableRef}
      // Corrigido: id agora é passado para o elemento DOM real
      id={id}
      className={`${className} outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 cursor-text`}
      contentEditable={!disabled}
      onInput={handleInput}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      data-placeholder={placeholder}
      spellCheck={false}
    />
  );
};

export default ContentEditable;
