
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NoteBlock, BlockConnection, CanvasCamera, BlockType, EditorBlockData } from '../types';

export type NotesViewMode = 'CANVAS' | 'LIST' | 'FOLDERS' | 'FAVORITES' | 'TRASH';

interface NotesContextType {
  blocks: NoteBlock[];
  connections: BlockConnection[];
  camera: CanvasCamera;
  focusedBlockId: string | null;
  viewMode: NotesViewMode;
  folders: string[]; // Lista de nomes de pastas
  
  // New State for Folder Navigation
  openedFolderId: string | null;
  setOpenedFolderId: (id: string | null) => void;

  // Actions
  addBlock: (type: BlockType, position: { x: number, y: number }, parentId?: string, folderId?: string, customId?: string) => void;
  addTemplate: (templateId: string, position: { x: number, y: number }) => void;
  addInnerBlock: (containerId: string, type: BlockType, content: string, properties?: any) => void; // Nova Função
  updateBlock: (id: string, updates: Partial<NoteBlock>) => void;
  deleteBlock: (id: string) => void; // Move to trash
  restoreBlock: (id: string) => void; // Recover from trash
  permanentDeleteBlock: (id: string) => void; // Delete forever
  duplicateBlock: (id: string) => void; 
  emptyTrash: () => void;
  moveBlock: (id: string, x: number, y: number) => void;
  resizeBlock: (id: string, width: number, height: number) => void;
  
  connectBlocks: (fromId: string, toId: string) => void;
  deleteConnection: (id: string) => void;
  
  setCamera: (camera: Partial<CanvasCamera>) => void;
  focusBlock: (id: string | null) => void;
  setViewMode: (mode: NotesViewMode) => void;
  
  // Tag/Folder/Fav Actions
  toggleFavorite: (id: string) => void;
  setFolder: (id: string, folderName: string) => void;
  createFolder: (folderName: string) => void;
  deleteFolder: (folderName: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;

  // Interação
  isDraggingBlock: boolean;
  setIsDraggingBlock: (v: boolean) => void;
  
  // Estado de Conexão Manual
  connectionStartId: string | null;
  setConnectionStartId: (id: string | null) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within a NotesProvider');
  return context;
};

// --- DEFINIÇÃO DOS TEMPLATES INTELIGENTES ---
export const SMART_TEMPLATES: Record<string, { title: string, width: number, height: number, color: string, blocks: EditorBlockData[] }> = {
  'cornell': {
    title: 'Anotação Cornell',
    width: 600,
    height: 700,
    color: '#3b82f6', // Azul
    blocks: [
      { id: '1', type: 'h1', content: 'Tópico da Aula / Estudo', level: 0 },
      { id: '2', type: 'callout', content: '💡 Palavras-chave / Conceitos', level: 0, properties: { icon: '🔑' } },
      { id: '3', type: 'h2', content: 'Anotações Detalhadas', level: 0 },
      { id: '4', type: 'bullet-list', content: 'Ponto principal 1', level: 0 },
      { id: '5', type: 'bullet-list', content: 'Detalhe importante...', level: 0 },
      { id: '6', type: 'text', content: '', level: 0 },
      { id: '7', type: 'divider', content: '', level: 0 },
      { id: '8', type: 'h3', content: 'Resumo / Síntese', level: 0 },
      { id: '9', type: 'quote', content: 'Resuma o aprendizado em 2 frases aqui.', level: 0 },
    ]
  },
  'meeting': {
    title: 'Ata de Reunião',
    width: 550,
    height: 600,
    color: '#a855f7', // Roxo
    blocks: [
      { id: '1', type: 'h1', content: 'Reunião: [Assunto]', level: 0 },
      { id: '2', type: 'table', content: '', level: 0, properties: { rows: [['📅 Data', '👥 Participantes'], ['Hoje', '@Todos']] } },
      { id: '3', type: 'h2', content: 'Pauta', level: 0 },
      { id: '4', type: 'text', content: 'Objetivo principal da discussão...', level: 0 },
      { id: '5', type: 'h2', content: 'Ações Definidas', level: 0 },
      { id: '6', type: 'todo-list', content: 'Tarefa 1 (Responsável)', level: 0, properties: { checked: false } },
      { id: '7', type: 'todo-list', content: 'Tarefa 2 (Responsável)', level: 0, properties: { checked: false } },
    ]
  },
  'kanban-card': {
    title: 'Projeto / Card',
    width: 400,
    height: 500,
    color: '#f97316', // Laranja
    blocks: [
      { id: '1', type: 'h2', content: 'Nome do Projeto', level: 0 },
      { id: '2', type: 'callout', content: 'Status: 🟡 Em Andamento', level: 0, properties: { icon: '🚀' } },
      { id: '3', type: 'toggle', content: 'Detalhes e Escopo', level: 0, properties: { isOpen: true } },
      { id: '4', type: 'text', content: 'Descreva o escopo aqui...', level: 1 },
      { id: '5', type: 'h3', content: 'Checklist', level: 0 },
      { id: '6', type: 'todo-list', content: 'Pesquisa inicial', level: 0, properties: { checked: true } },
      { id: '7', type: 'todo-list', content: 'Desenvolvimento', level: 0, properties: { checked: false } },
      { id: '8', type: 'todo-list', content: 'Revisão', level: 0, properties: { checked: false } },
    ]
  },
  'week-plan': {
    title: 'Planejamento Semanal',
    width: 500,
    height: 650,
    color: '#22c55e', // Verde
    blocks: [
      { id: '1', type: 'h1', content: 'Semana #___', level: 0 },
      { id: '2', type: 'callout', content: '🎯 Foco Principal: ', level: 0, properties: { icon: '🎯' } },
      { id: '3', type: 'h2', content: 'Prioridades', level: 0 },
      { id: '4', type: 'todo-list', content: 'Urgente e Importante', level: 0, properties: { checked: false } },
      { id: '5', type: 'todo-list', content: 'Importante, não urgente', level: 0, properties: { checked: false } },
      { id: '6', type: 'divider', content: '', level: 0 },
      { id: '7', type: 'h3', content: 'Agenda Rápida', level: 0 },
      { id: '8', type: 'table', content: '', level: 0, properties: { rows: [['Seg', 'Ter', 'Qua'], ['', '', ''], ['Qui', 'Sex', 'Sab'], ['', '', '']] } }
    ]
  }
};


// Dados iniciais de exemplo com Tutorial Completo
const INITIAL_BLOCKS: NoteBlock[] = [
  {
    id: 'intro-guide',
    type: 'container',
    title: 'Bem-vindo ao Study Hub Notes 🧠',
    content: { 
        text: 'Dê dois cliques para abrir e aprender a usar o sistema.',
        blocks: [
            { id: 'h1-1', type: 'h1', content: 'Bem-vindo ao seu Segundo Cérebro', level: 0 },
            { id: 't1', type: 'text', content: 'Este sistema combina o poder de um Canvas Infinito (como Miro) com um Editor de Texto Avançado (como Notion).', level: 0 },
            { id: 'h2-1', type: 'h2', content: '🎨 Comandos do Canvas', level: 0 },
            { id: 'ul-1', type: 'bullet-list', content: 'Arraste o fundo para mover a visão (Pan).', level: 0 },
            { id: 'ul-2', type: 'bullet-list', content: 'Use Ctrl + Scroll para Zoom In/Out.', level: 0 },
            { id: 'ul-3', type: 'bullet-list', content: 'Duplo clique no fundo cria uma nova nota.', level: 0 },
            { id: 'ul-4', type: 'bullet-list', content: 'Arraste a bolinha azul à direita de um bloco para conectar a outro.', level: 0 },
            { id: 'h2-2', type: 'h2', content: '⌨️ Atalhos de Edição', level: 0 },
            { id: 't-short-1', type: 'text', content: 'Dentro do editor, use estes atalhos para voar:', level: 0 },
            { id: 'table-1', type: 'table', content: '', level: 0, properties: { rows: [
                ['Atalho', 'Ação'],
                ['Ctrl + B', 'Negrito'],
                ['Ctrl + I', 'Itálico'],
                ['Ctrl + U', 'Sublinhado'],
                ['Ctrl + Shift + S', 'Highlight (alternar cores)'],
                ['Ctrl + K', 'Inserir Link'],
                ['Tab / Shift+Tab', 'Indentar / Desindentar'],
                ['Ctrl + /', 'Abrir Menu de Comandos (Slash)'],
                ['Ctrl + Enter', 'Nova linha na Tabela'],
                ['Esc', 'Sair do Editor / Fechar Menus']
            ] } },
            { id: 'h2-3', type: 'h2', content: '💡 Dicas Extras', level: 0 },
            { id: 'callout-1', type: 'callout', content: 'Use Ctrl + Shift + E para extrair o texto selecionado e transformá-lo em um novo bloco logo abaixo.', level: 0, properties: { icon: '✨' } },
            { id: 'check-1', type: 'todo-list', content: 'Experimente arrastar um Template da barra lateral.', level: 0, properties: { checked: false } }
        ]
    },
    position: { x: 100, y: 100, width: 500, height: 600 },
    color: '#3b82f6',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['#Tutorial', '#StudyHub'],
    isFavorite: true,
    isTrash: false
  }
];

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [connections, setConnections] = useState<BlockConnection[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [camera, setCameraState] = useState<CanvasCamera>({ x: 0, y: 0, zoom: 1 });
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [viewMode, setViewMode] = useState<NotesViewMode>('CANVAS');
  
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);
  
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar dados
  useEffect(() => {
    async function load() {
        if(window.api) {
            const savedBlocks = await window.api.storage.get<NoteBlock[]>('notes-blocks');
            const savedConnections = await window.api.storage.get<BlockConnection[]>('notes-connections');
            const savedFolders = await window.api.storage.get<string[]>('notes-folders');
            
            const initialBlocks = savedBlocks || INITIAL_BLOCKS;
            setBlocks(initialBlocks);
            
            if (savedConnections) setConnections(savedConnections);
            
            // Lógica de recuperação de pastas: Merge entre salvas e existentes nos blocos
            const allFolders = new Set<string>(savedFolders || []);
            initialBlocks.forEach(b => { 
                if(b.folderId) allFolders.add(b.folderId); 
            });
            setFolders(Array.from(allFolders).sort());

        } else {
            const localBlocks = localStorage.getItem('study-hub-notes-blocks');
            if (localBlocks) {
                const parsedBlocks = JSON.parse(localBlocks);
                setBlocks(parsedBlocks);
                
                const allFolders = new Set<string>();
                parsedBlocks.forEach((b: any) => { if(b.folderId) allFolders.add(b.folderId); });
                setFolders(Array.from(allFolders).sort());
            } else {
                setBlocks(INITIAL_BLOCKS);
            }
        }
        setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
      if (isLoaded && window.api) {
          const handler = setTimeout(() => {
              window.api.storage.set('notes-blocks', blocks);
              window.api.storage.set('notes-connections', connections);
              window.api.storage.set('notes-folders', folders);
          }, 2000);
          return () => clearTimeout(handler);
      }
  }, [blocks, connections, folders, isLoaded]);

  const addBlock = useCallback((type: BlockType, position: { x: number, y: number }, parentId?: string, folderId?: string, customId?: string) => {
      const newBlock: NoteBlock = {
          id: customId || Date.now().toString(),
          type,
          title: type === 'container' ? 'Nova Nota' : 'Novo Elemento',
          content: { text: '' },
          position: { ...position, width: 300, height: 200 },
          parentId,
          folderId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          color: '#3b82f6',
          tags: [],
          isTrash: false,
          isFavorite: false
      };
      setBlocks(prev => [...prev, newBlock]);
  }, []);

  // --- NOVA FUNÇÃO: Inserir bloco dentro de um container (nota) existente ---
  const addInnerBlock = useCallback((containerId: string, type: BlockType, content: string, properties?: any) => {
      setBlocks(prev => prev.map(b => {
          if (b.id !== containerId) return b;
          
          const currentBlocks = b.content.blocks || [];
          const newBlock: EditorBlockData = {
              id: `eb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              type,
              content,
              level: 0,
              properties
          };
          
          return {
              ...b,
              content: {
                  ...b.content,
                  blocks: [...currentBlocks, newBlock],
                  text: (b.content.text || '') + '\n' + content // Mantém texto plano atualizado para preview
              },
              updatedAt: Date.now()
          };
      }));
  }, []);

  const addTemplate = useCallback((templateId: string, position: { x: number, y: number }) => {
      const template = SMART_TEMPLATES[templateId];
      if (!template) return;

      const newInternalBlocks = template.blocks.map(b => ({
          ...b,
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      const plainText = newInternalBlocks.map(b => b.content || '').join('\n').slice(0, 150);

      const newBlock: NoteBlock = {
          id: Date.now().toString(),
          type: 'container',
          title: template.title,
          content: { 
              text: plainText,
              blocks: newInternalBlocks 
          },
          position: { 
              ...position, 
              width: template.width, 
              height: template.height 
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          color: template.color,
          tags: [`#${templateId}`],
          isTrash: false,
          isFavorite: false
      };

      setBlocks(prev => [...prev, newBlock]);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<NoteBlock>) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, isTrash: true } : b));
  }, []);

  const restoreBlock = useCallback((id: string) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, isTrash: false } : b));
  }, []);

  const permanentDeleteBlock = useCallback((id: string) => {
      if (confirm('Tem certeza que deseja excluir permanentemente? Isso não pode ser desfeito.')) {
          setBlocks(prev => prev.filter(b => b.id !== id));
          setConnections(prev => prev.filter(c => c.fromBlockId !== id && c.toBlockId !== id));
      }
  }, []);

  const duplicateBlock = useCallback((id: string) => {
      setBlocks(prev => {
          const original = prev.find(b => b.id === id);
          if (!original) return prev;
          
          let newContent = { ...original.content };
          if (newContent.blocks) {
              newContent.blocks = newContent.blocks.map(b => ({
                  ...b,
                  id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              }));
          }

          const newBlock: NoteBlock = {
              ...original,
              id: Date.now().toString(),
              title: `${original.title} (Cópia)`,
              content: newContent,
              position: {
                  ...original.position,
                  x: original.position.x + 30,
                  y: original.position.y + 30
              },
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          return [...prev, newBlock];
      });
  }, []);

  const emptyTrash = useCallback(() => {
      if (confirm('Esvaziar lixeira? Todos os itens serão perdidos.')) {
          const trashIds = blocks.filter(b => b.isTrash).map(b => b.id);
          setBlocks(prev => prev.filter(b => !b.isTrash));
          setConnections(prev => prev.filter(c => !trashIds.includes(c.fromBlockId) && !trashIds.includes(c.toBlockId)));
      }
  }, [blocks]);

  const moveBlock = useCallback((id: string, x: number, y: number) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, position: { ...b.position, x, y } } : b));
  }, []);

  const resizeBlock = useCallback((id: string, width: number, height: number) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, position: { ...b.position, width, height } } : b));
  }, []);

  const connectBlocks = useCallback((fromId: string, toId: string) => {
      setConnections(prev => {
          if (fromId === toId) return prev;
          if (prev.some(c => c.fromBlockId === fromId && c.toBlockId === toId)) return prev;
          
          return [...prev, {
              id: Date.now().toString(),
              fromBlockId: fromId,
              toBlockId: toId
          }];
      });
  }, []);

  const deleteConnection = useCallback((id: string) => {
      setConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  const setCamera = useCallback((cam: Partial<CanvasCamera>) => {
      setCameraState(prev => ({ ...prev, ...cam }));
  }, []);

  const focusBlock = useCallback((id: string | null) => {
      setFocusedBlockId(id);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
  }, []);

  const createFolder = useCallback((folderName: string) => {
      setFolders(prev => {
          if (prev.includes(folderName)) return prev;
          return [...prev, folderName].sort();
      });
  }, []);

  const deleteFolder = useCallback((folderName: string) => {
      setFolders(prev => prev.filter(f => f !== folderName));
      setBlocks(prev => prev.map(b => b.folderId === folderName ? { ...b, folderId: undefined } : b));
  }, []);

  const renameFolder = useCallback((oldName: string, newName: string) => {
      if (!newName.trim() || oldName === newName) return;
      
      setFolders(prev => {
          if (prev.includes(newName)) {
              return prev.filter(f => f !== oldName).sort();
          }
          return prev.map(f => f === oldName ? newName : f).sort();
      });

      setBlocks(prev => prev.map(b => b.folderId === oldName ? { ...b, folderId: newName } : b));
  }, []);

  const setFolder = useCallback((id: string, folderName: string) => {
      createFolder(folderName);
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, folderId: folderName } : b));
  }, [createFolder]);

  const addTag = useCallback((id: string, tag: string) => {
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      setBlocks(prev => prev.map(b => {
          if (b.id !== id) return b;
          const tags = b.tags || [];
          if (tags.includes(cleanTag)) return b;
          return { ...b, tags: [...tags, cleanTag] };
      }));
  }, []);

  const removeTag = useCallback((id: string, tag: string) => {
      setBlocks(prev => prev.map(b => {
          if (b.id !== id) return b;
          return { ...b, tags: (b.tags || []).filter(t => t !== tag) };
      }));
  }, []);

  return (
    <NotesContext.Provider value={{
      blocks,
      connections,
      camera,
      focusedBlockId,
      viewMode,
      folders,
      openedFolderId,
      setOpenedFolderId,
      addBlock,
      addTemplate,
      addInnerBlock,
      updateBlock,
      deleteBlock,
      restoreBlock,
      permanentDeleteBlock,
      duplicateBlock,
      emptyTrash,
      moveBlock,
      resizeBlock,
      connectBlocks,
      deleteConnection,
      setCamera,
      focusBlock,
      setViewMode,
      toggleFavorite,
      setFolder,
      createFolder,
      deleteFolder,
      renameFolder,
      addTag,
      removeTag,
      isDraggingBlock,
      setIsDraggingBlock,
      connectionStartId,
      setConnectionStartId
    }}>
      {children}
    </NotesContext.Provider>
  );
};
