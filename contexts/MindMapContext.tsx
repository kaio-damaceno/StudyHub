
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MindMap, MindMapNode, MindMapReference } from '../types';

interface MindMapContextType {
  maps: MindMap[];
  currentMap: MindMap | null;
  createMap: (title: string) => void;
  deleteMap: (id: string) => void;
  openMap: (id: string) => void;
  closeMap: () => void;
  importMap: (mapData: any) => void;
  
  // Node Operations
  addSiblingNode: (referenceNodeId: string) => void;
  addChildNode: (parentId: string) => void;
  addChildNodeAt: (parentId: string, offset: { x: number, y: number }) => void;
  connectNodes: (parentId: string, childId: string) => void;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  addNodeReference: (nodeId: string, reference: MindMapReference) => void;
  deleteNode: (nodeId: string) => void;
  deleteNodes: (nodeIds: string[]) => void;
  toggleCollapse: (nodeId: string) => void;
  
  // Selection & Interaction
  selectedNodeId: string | null;
  selectedNodeIds: Set<string>;
  selectNode: (id: string | null, multi?: boolean) => void;
  toggleNodeSelection: (id: string) => void;
  setMultiSelection: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Drag-to-Create State
  dragCreation: { sourceId: string | null; x: number; y: number } | null;
  setDragCreation: (state: { sourceId: string | null; x: number; y: number } | null) => void;

  // Integration Modals (Creation)
  activeModal: { type: 'FLASHCARD' | 'NOTE'; nodeId: string } | null;
  setModal: (modal: { type: 'FLASHCARD' | 'NOTE'; nodeId: string } | null) => void;

  // Viewer State (Consuming Content)
  viewingReference: MindMapReference | null;
  setViewingReference: (ref: MindMapReference | null) => void;
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined);

export const useMindMap = () => {
  const context = useContext(MindMapContext);
  if (!context) throw new Error('useMindMap must be used within MindMapProvider');
  return context;
};

export const MindMapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [currentMap, setCurrentMap] = useState<MindMap | null>(null);
  
  // Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null); // Primary selection
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set()); // Multi selection

  const [dragCreation, setDragCreation] = useState<{ sourceId: string | null; x: number; y: number } | null>(null);
  
  // Modal State (Creation)
  const [activeModal, setModal] = useState<{ type: 'FLASHCARD' | 'NOTE'; nodeId: string } | null>(null);
  
  // Viewer State (Reading/Editing)
  const [viewingReference, setViewingReference] = useState<MindMapReference | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (window.api) {
        const savedMaps = await window.api.storage.get<MindMap[]>('mind-maps');
        if (savedMaps) setMaps(savedMaps);
      } else {
        const local = localStorage.getItem('study-hub-mindmaps');
        if (local) setMaps(JSON.parse(local));
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (isLoaded && window.api) {
      const handler = setTimeout(() => {
        window.api.storage.set('mind-maps', maps);
      }, 1000);
      return () => clearTimeout(handler);
    } else if (isLoaded) {
      localStorage.setItem('study-hub-mindmaps', JSON.stringify(maps));
    }
  }, [maps, isLoaded]);

  const createMap = useCallback((title: string) => {
    const rootId = `node_${Date.now()}_root`;
    const rootNode: MindMapNode = {
      id: rootId,
      text: title,
      parentId: null,
      childrenIds: [],
      isCollapsed: false,
      color: '#3b82f6'
    };

    const newMap: MindMap = {
      id: `map_${Date.now()}`,
      title,
      rootId,
      nodes: { [rootId]: rootNode },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setMaps(prev => [...prev, newMap]);
    setCurrentMap(newMap);
    setSelectedNodeId(rootId);
    setSelectedNodeIds(new Set([rootId]));
  }, []);

  const deleteMap = useCallback((id: string) => {
    if (confirm('Tem certeza que deseja excluir este mapa mental?')) {
      setMaps(prev => prev.filter(m => m.id !== id));
      if (currentMap?.id === id) setCurrentMap(null);
    }
  }, [currentMap]);

  const openMap = useCallback((id: string) => {
    const map = maps.find(m => m.id === id);
    if (map) {
        setCurrentMap(map);
        setSelectedNodeId(map.rootId);
        setSelectedNodeIds(new Set([map.rootId]));
    }
  }, [maps]);

  const closeMap = useCallback(() => {
    setCurrentMap(null);
    setSelectedNodeId(null);
    setSelectedNodeIds(new Set());
  }, []);

  const importMap = useCallback((mapData: any) => {
      try {
          if (!mapData.id || !mapData.nodes || !mapData.rootId) {
              alert("Arquivo de mapa mental inválido.");
              return;
          }
          
          if (typeof mapData.nodes !== 'object') {
               alert("Estrutura de nós inválida.");
               return;
          }

          // Generate new ID to avoid conflict if importing same map copy
          const newMapData = {
              ...mapData,
              id: `map_imported_${Date.now()}`,
              title: mapData.title + ' (Importado)'
          };

          setMaps(prev => [...prev, newMapData]);
          setCurrentMap(newMapData);
          setSelectedNodeId(newMapData.rootId);
          setSelectedNodeIds(new Set([newMapData.rootId]));
          
      } catch (e) {
          console.error("Erro ao importar mapa:", e);
          alert("Erro ao processar arquivo.");
      }
  }, []);

  const saveCurrentMap = (updatedMap: MindMap) => {
    setCurrentMap(updatedMap);
    setMaps(prev => prev.map(m => m.id === updatedMap.id ? updatedMap : m));
  };

  // --- Selection Logic ---

  const selectNode = useCallback((id: string | null, multi: boolean = false) => {
      if (id === null) {
          setSelectedNodeId(null);
          if (!multi) setSelectedNodeIds(new Set());
          return;
      }

      setSelectedNodeId(id);
      
      if (multi) {
          setSelectedNodeIds(prev => {
              const next = new Set(prev);
              next.add(id);
              return next;
          });
      } else {
          setSelectedNodeIds(new Set([id]));
      }
  }, []);

  const toggleNodeSelection = useCallback((id: string) => {
      const nextIds = new Set(selectedNodeIds);
      let nextPrimary = selectedNodeId;

      if (nextIds.has(id)) {
          nextIds.delete(id);
          if (nextPrimary === id) {
              nextPrimary = null;
          }
      } else {
          nextIds.add(id);
          nextPrimary = id;
      }

      setSelectedNodeIds(nextIds);
      setSelectedNodeId(nextPrimary);
  }, [selectedNodeIds, selectedNodeId]);

  const setMultiSelection = useCallback((ids: string[]) => {
      setSelectedNodeIds(new Set(ids));
      if (ids.length > 0) setSelectedNodeId(ids[ids.length - 1]);
      else setSelectedNodeId(null);
  }, []);

  const clearSelection = useCallback(() => {
      setSelectedNodeId(null);
      setSelectedNodeIds(new Set());
  }, []);

  // --- Node Operations ---

  const addChildNode = useCallback((parentId: string) => {
    if (!currentMap) return;

    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNode: MindMapNode = {
      id: newNodeId,
      text: 'Novo Item',
      parentId,
      childrenIds: [],
      isCollapsed: false
    };

    const updatedNodes = { ...currentMap.nodes };
    updatedNodes[newNodeId] = newNode;
    
    if (updatedNodes[parentId]) {
      updatedNodes[parentId] = {
        ...updatedNodes[parentId],
        childrenIds: [...updatedNodes[parentId].childrenIds, newNodeId],
        isCollapsed: false 
      };
    }

    saveCurrentMap({ ...currentMap, nodes: updatedNodes, updatedAt: Date.now() });
    selectNode(newNodeId);
  }, [currentMap, selectNode]);

  const addChildNodeAt = useCallback((parentId: string, offset: { x: number, y: number }) => {
      if (!currentMap) return;

      const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      
      const newNode: MindMapNode = {
        id: newNodeId,
        text: 'Novo Item',
        parentId,
        childrenIds: [],
        isCollapsed: false,
        offset: offset 
      };

      const updatedNodes = { ...currentMap.nodes };
      updatedNodes[newNodeId] = newNode;
      
      if (updatedNodes[parentId]) {
        updatedNodes[parentId] = {
          ...updatedNodes[parentId],
          childrenIds: [...updatedNodes[parentId].childrenIds, newNodeId],
          isCollapsed: false 
        };
      }

      saveCurrentMap({ ...currentMap, nodes: updatedNodes, updatedAt: Date.now() });
      selectNode(newNodeId);
  }, [currentMap, selectNode]);

  const connectNodes = useCallback((parentId: string, childId: string) => {
      if (!currentMap) return;
      if (parentId === childId) return; 

      const isAncestor = (ancestorId: string, nodeId: string, visited = new Set<string>()): boolean => {
          if (ancestorId === nodeId) return true;
          if (visited.has(nodeId)) return false; 
          visited.add(nodeId);
          
          const node = currentMap.nodes[nodeId];
          if (!node) return false;
          
          for (const child of node.childrenIds) {
              if (isAncestor(ancestorId, child, visited)) return true;
          }
          return false;
      };

      if (isAncestor(childId, parentId)) {
          alert("Não é possível conectar: Isso criaria um ciclo infinito.");
          return;
      }

      const updatedNodes = { ...currentMap.nodes };
      if (updatedNodes[parentId].childrenIds.includes(childId)) return;

      updatedNodes[parentId] = {
          ...updatedNodes[parentId],
          childrenIds: [...updatedNodes[parentId].childrenIds, childId],
          isCollapsed: false
      };

      saveCurrentMap({ ...currentMap, nodes: updatedNodes, updatedAt: Date.now() });
  }, [currentMap]);

  const addSiblingNode = useCallback((referenceNodeId: string) => {
      if (!currentMap) return;
      const refNode = currentMap.nodes[referenceNodeId];
      if (!refNode || !refNode.parentId) return; 

      const parentId = refNode.parentId;
      const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newNode: MindMapNode = {
        id: newNodeId,
        text: 'Novo Item',
        parentId,
        childrenIds: [],
        isCollapsed: false
      };

      const updatedNodes = { ...currentMap.nodes };
      updatedNodes[newNodeId] = newNode;

      const parentNode = updatedNodes[parentId];
      const newChildrenIds = [...parentNode.childrenIds];
      const refIndex = newChildrenIds.indexOf(referenceNodeId);
      if (refIndex !== -1) {
          newChildrenIds.splice(refIndex + 1, 0, newNodeId);
      } else {
          newChildrenIds.push(newNodeId);
      }

      updatedNodes[parentId] = {
          ...parentNode,
          childrenIds: newChildrenIds
      };

      saveCurrentMap({ ...currentMap, nodes: updatedNodes, updatedAt: Date.now() });
      selectNode(newNodeId);
  }, [currentMap, selectNode]);

  const updateNode = useCallback((nodeId: string, updates: Partial<MindMapNode>) => {
    if (!currentMap || !currentMap.nodes[nodeId]) return;

    const updatedNodes = { ...currentMap.nodes };
    updatedNodes[nodeId] = { ...updatedNodes[nodeId], ...updates };

    let newTitle = currentMap.title;
    if (nodeId === currentMap.rootId && updates.text) {
      newTitle = updates.text;
    }

    saveCurrentMap({ ...currentMap, title: newTitle, nodes: updatedNodes, updatedAt: Date.now() });
  }, [currentMap]);

  const addNodeReference = useCallback((nodeId: string, reference: MindMapReference) => {
      if (!currentMap || !currentMap.nodes[nodeId]) return;
      
      const node = currentMap.nodes[nodeId];
      const currentRefs = node.references || [];
      
      if (currentRefs.some(r => r.type === reference.type && r.id === reference.id)) return;

      updateNode(nodeId, { references: [...currentRefs, reference] });
  }, [currentMap, updateNode]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!currentMap || !currentMap.nodes[nodeId]) return;
    if (nodeId === currentMap.rootId) return alert("Não é possível deletar a raiz.");

    const updatedNodes = { ...currentMap.nodes };
    
    const nodesToDelete = new Set<string>();
    const collectIds = (id: string) => {
      if (nodesToDelete.has(id)) return;
      nodesToDelete.add(id);
      if (updatedNodes[id]) {
          updatedNodes[id].childrenIds.forEach(childId => collectIds(childId));
      }
    };
    collectIds(nodeId);

    Object.keys(updatedNodes).forEach(key => {
        const node = updatedNodes[key];
        if (node.childrenIds.some(child => nodesToDelete.has(child))) {
            updatedNodes[key] = {
                ...node,
                childrenIds: node.childrenIds.filter(child => !nodesToDelete.has(child))
            };
        }
    });

    nodesToDelete.forEach(id => delete updatedNodes[id]);

    if (selectedNodeId && nodesToDelete.has(selectedNodeId)) {
        selectNode(null);
    }

    saveCurrentMap({ ...currentMap, nodes: updatedNodes, updatedAt: Date.now() });
  }, [currentMap, selectedNodeId, selectNode]);

  const deleteNodes = useCallback((nodeIds: string[]) => {
      if (!currentMap) return;
      
      const updatedNodes = { ...currentMap.nodes };
      const nodesToDelete = new Set<string>();

      nodeIds.forEach(nodeId => {
          if (nodeId === currentMap.rootId) return; 
          
          const collectIds = (id: string) => {
            if (nodesToDelete.has(id)) return;
            nodesToDelete.add(id);
            if (updatedNodes[id]) {
                updatedNodes[id].childrenIds.forEach(childId => collectIds(childId));
            }
          };
          collectIds(nodeId);
      });

      Object.keys(updatedNodes).forEach(key => {
          const node = updatedNodes[key];
          if (node.childrenIds.some(child => nodesToDelete.has(child))) {
              updatedNodes[key] = {
                  ...node,
                  childrenIds: node.childrenIds.filter(child => !nodesToDelete.has(child))
              };
          }
      });

      nodesToDelete.forEach(id => delete updatedNodes[id]);

      clearSelection();
      saveCurrentMap({ ...currentMap, nodes: updatedNodes, updatedAt: Date.now() });
  }, [currentMap, clearSelection]);

  const toggleCollapse = useCallback((nodeId: string) => {
    if (!currentMap || !currentMap.nodes[nodeId]) return;
    updateNode(nodeId, { isCollapsed: !currentMap.nodes[nodeId].isCollapsed });
  }, [currentMap, updateNode]);

  return (
    <MindMapContext.Provider value={{
      maps, currentMap, createMap, deleteMap, openMap, closeMap, importMap,
      addSiblingNode, addChildNode, addChildNodeAt, connectNodes, updateNode, addNodeReference, deleteNode, deleteNodes, toggleCollapse,
      selectedNodeId, selectedNodeIds, selectNode, toggleNodeSelection, setMultiSelection, clearSelection,
      dragCreation, setDragCreation, activeModal, setModal,
      viewingReference, setViewingReference
    }}>
      {children}
    </MindMapContext.Provider>
  );
};
