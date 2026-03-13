
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useOverlay } from '../../contexts/OverlayContext';
import * as fabricImpl from 'fabric';
import OverlayToolbar, { ToolType } from './OverlayToolbar';

const UniversalOverlay: React.FC = () => {
  const { isEditing, toggleEditing, setHasDrawing, contextKey } = useOverlay();
  
  // Referência apenas para o container PAI (div)
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null); 
  const isLoadedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#3b82f6');
  const [width, setWidth] = useState(3);

  // Refs para acesso dentro de event listeners que não são recriados
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const widthRef = useRef(width);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { widthRef.current = width; }, [width]);

  // Helper para resolver a instância do Fabric
  const getFabric = () => {
      // @ts-ignore
      return fabricImpl.fabric || fabricImpl.default || fabricImpl;
  };

  // --- PERSISTÊNCIA: LOAD ---
  const loadCanvasState = useCallback(async (key: string, canvas: any) => {
      if (!window.api || !key || !canvas) return;
      
      // Verifica se o canvas ainda é válido
      if (typeof canvas.clear !== 'function') return;

      isLoadedRef.current = false;
      try {
          canvas.clear();
          canvas.setBackgroundColor('transparent', () => canvas.renderAll());
          
          const savedData = await window.api.storage.get(`overlay_${key}`);
          
          if (savedData) {
              canvas.loadFromJSON(savedData, () => {
                  if (canvas) canvas.renderAll();
                  setHasDrawing(true);
                  isLoadedRef.current = true;
              });
          } else {
              setHasDrawing(false);
              isLoadedRef.current = true;
          }
      } catch (e) {
          console.error("Erro ao carregar overlay:", e);
          isLoadedRef.current = true;
      }
  }, [setHasDrawing]);

  // --- PERSISTÊNCIA: SAVE ---
  const contextKeyRef = useRef(contextKey);
  useEffect(() => { contextKeyRef.current = contextKey; }, [contextKey]);

  // Inicialização do Canvas (Abordagem Manual de DOM)
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Limpeza preventiva do container
    containerRef.current.innerHTML = '';

    // 2. Criar elemento Canvas manualmente
    const canvasEl = document.createElement('canvas');
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    containerRef.current.appendChild(canvasEl);

    try {
        const fb = getFabric();
        
        if (!fb || !fb.Canvas) {
            console.warn("Fabric.js não carregou corretamente.");
            return;
        }

        // 3. Inicializar Fabric
        const canvas = new fb.Canvas(canvasEl, {
            isDrawingMode: false,
            selection: false,
            backgroundColor: 'transparent',
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
        });

        // @ts-ignore
        canvas.skipTargetFind = true; 
        fabricRef.current = canvas;

        // 4. Configurar Resize Observer
        const handleResize = () => {
            if (containerRef.current && fabricRef.current) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                
                // Verificação de segurança antes de chamar métodos
                if (typeof fabricRef.current.setWidth === 'function') {
                    fabricRef.current.setWidth(w);
                    fabricRef.current.setHeight(h);
                    fabricRef.current.renderAll();
                }
            }
        };

        resizeObserverRef.current = new ResizeObserver(() => {
            // Pequeno delay para garantir que o DOM atualizou
            requestAnimationFrame(handleResize);
        });
        resizeObserverRef.current.observe(containerRef.current);

        // 5. Configurar Listeners de Save e Path Created
        const handlePathCreated = (e: any) => {
            // LÓGICA CRÍTICA DA BORRACHA:
            // Se a ferramenta atual for borracha, definimos o modo de composição para 'destination-out'
            // Isso faz com que este traço "recorte" o que está embaixo dele (transparência).
            if (toolRef.current === 'eraser') {
                e.path.globalCompositeOperation = 'destination-out';
                e.path.stroke = 'white'; // Cor base não importa, mas evita erros
                e.path.selectable = false;
                
                // Força renderização para aplicar o recorte visualmente
                canvas.requestRenderAll();
            }
            
            handleCanvasChange();
        };

        const handleCanvasChange = () => {
            if (!isLoadedRef.current || !window.api || !fabricRef.current) return;
            const key = contextKeyRef.current;
            if (!key) return;
            
            try {
                const json = fabricRef.current.toJSON();
                window.api.storage.set(`overlay_${key}`, json);
            } catch (e) { console.error("Erro ao salvar canvas", e); }
        };

        canvas.on('path:created', handlePathCreated);
        canvas.on('object:added', handleCanvasChange);
        canvas.on('object:removed', handleCanvasChange);
        canvas.on('object:modified', handleCanvasChange);

        // 6. Configurar Listener de Estado UI
        const updateState = () => {
            if (fabricRef.current) {
                setHasDrawing(fabricRef.current.getObjects().length > 0);
            }
        };
        canvas.on('path:created', updateState);
        canvas.on('object:added', updateState);
        canvas.on('object:removed', updateState);

        // Carregamento inicial de dados
        if (contextKeyRef.current) {
            loadCanvasState(contextKeyRef.current, canvas);
        }

        // Cleanup function
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            
            if (canvas) {
                try {
                    // Remove listeners antes de dispose
                    canvas.off();
                    canvas.dispose();
                } catch (e) {
                    console.warn("Erro ao descartar canvas", e);
                }
            }
            fabricRef.current = null;
            
            // Limpa o DOM manualmente para evitar conflito com React
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };

    } catch (err) {
        console.error("CRITICAL: Falha ao iniciar Overlay Canvas", err);
    }
  }, []); // Executa apenas uma vez

  // Efeito secundário: Carregar dados quando a ContextKey muda
  useEffect(() => {
      if (fabricRef.current && contextKey) {
          loadCanvasState(contextKey, fabricRef.current);
      }
  }, [contextKey, loadCanvasState]);

  // Efeito secundário: Gerenciamento de Ferramentas
  useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || typeof canvas.renderAll !== 'function') return;

      const fb = getFabric();

      try {
          if (isEditing) {
              canvas.isDrawingMode = true;
              // @ts-ignore
              canvas.skipTargetFind = true;
              
              // Sempre usamos PencilBrush, a mágica da borracha acontece no evento 'path:created'
              canvas.freeDrawingBrush = new fb.PencilBrush(canvas);
              
              if (tool === 'pen') {
                  canvas.freeDrawingBrush.color = color;
                  canvas.freeDrawingBrush.width = width;
              } 
              else if (tool === 'highlighter') {
                  const hex = color.replace('#', '');
                  const r = parseInt(hex.substring(0,2), 16);
                  const g = parseInt(hex.substring(2,4), 16);
                  const b = parseInt(hex.substring(4,6), 16);
                  canvas.freeDrawingBrush.color = `rgba(${r}, ${g}, ${b}, 0.4)`;
                  canvas.freeDrawingBrush.width = width > 10 ? width : 25;
              }
              else if (tool === 'eraser') {
                  // Para a borracha, usamos branco visualmente enquanto arrasta
                  // O evento 'path:created' transformará isso em transparência ('destination-out')
                  canvas.freeDrawingBrush.color = 'rgba(255,255,255,1)'; 
                  canvas.freeDrawingBrush.width = width * 5; // Borracha mais larga
              }
          } else {
              canvas.isDrawingMode = false;
              // @ts-ignore
              canvas.skipTargetFind = true;
              canvas.discardActiveObject();
              canvas.requestRenderAll();
          }
      } catch(e) {
          console.error("Erro ao atualizar brush:", e);
      }
  }, [isEditing, tool, color, width]);

  const handleUndo = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const objects = canvas.getObjects();
      if (objects.length > 0) {
          canvas.remove(objects[objects.length - 1]);
      }
  };

  const handleClear = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (confirm("Limpar anotações?")) {
          canvas.clear();
          canvas.setBackgroundColor('transparent', () => canvas.renderAll());
          if (window.api && contextKey) window.api.storage.set(`overlay_${contextKey}`, canvas.toJSON());
          setHasDrawing(false);
      }
  };

  return (
    <>
        <div 
            ref={containerRef}
            className={`
                absolute inset-0 z-[200] transition-all duration-300
                ${isEditing ? 'pointer-events-auto bg-black/5' : 'pointer-events-none bg-transparent'}
            `}
        >
            {/* Canvas é injetado aqui via JS */}
        </div>

        <OverlayToolbar 
            currentTool={tool}
            setTool={setTool}
            currentColor={color}
            setColor={setColor}
            currentWidth={width}
            setWidth={setWidth}
            onUndo={handleUndo}
            onClear={handleClear}
            onClose={toggleEditing}
        />
    </>
  );
};

export default UniversalOverlay;
