
import { MindMapNode } from '../../types';

interface LayoutConfig {
  baseHeight: number;
  baseWidth: number;
  minWidth: number;
  maxWidth: number;
  horizontalGap: number;
  verticalGap: number;
  charWidthApprox: number;
}

const CONFIG: LayoutConfig = {
  baseHeight: 40,
  baseWidth: 150,
  minWidth: 140,
  maxWidth: 350,
  horizontalGap: 100,
  verticalGap: 20,
  charWidthApprox: 9 
};

interface LayoutNode extends MindMapNode {
  _width: number;
  _height: number;
  _outerHeight: number;
  _x: number;
  _y: number;
}

const measureNode = (node: MindMapNode): { width: number, height: number } => {
  const fontSize = node.style?.fontSize || 14;
  // Ajuste fino da largura média do caractere para a fonte Inter
  const charWidth = fontSize * 0.65; 
  
  const textLength = node.text ? node.text.length : 0;
  const paddingHorizontal = 32; // px
  const paddingVertical = 24; // px
  
  // 1. Calcular Largura (Width)
  // Cresce com o texto até atingir o maxWidth
  const estimatedWidth = Math.max(
    CONFIG.minWidth,
    Math.min(CONFIG.maxWidth, (textLength * charWidth) + paddingHorizontal)
  );
  
  // 2. Calcular Altura (Height) baseada na quebra de linha
  // Largura disponível para o texto = largura total - padding
  const availableTextWidth = estimatedWidth - paddingHorizontal;
  
  // Largura total que o texto ocuparia em uma linha
  const totalTextLineLength = textLength * charWidth;
  
  // Estimar número de linhas (Math.ceil)
  // Adiciona um pequeno buffer (1.1) para evitar quebras prematuras não calculadas
  const estimatedLines = Math.max(1, Math.ceil(totalTextLineLength / availableTextWidth));
  
  const lineHeight = fontSize * 1.5; // line-height padrão (leading-tight/relaxed)
  
  // Altura do texto = linhas * altura da linha + padding vertical
  let estimatedHeight = (estimatedLines * lineHeight) + paddingVertical;
  
  // Garante altura mínima base
  estimatedHeight = Math.max(CONFIG.baseHeight, estimatedHeight);
  
  // 3. Adicionar altura de mídia (Imagem)
  if (node.image) {
      // Se tem imagem, adiciona altura fixa do container de imagem (96px) + bordas/padding extra
      estimatedHeight += 100; 
  }

  // 4. Adicionar altura de referências (Rodapé)
  if (node.references && node.references.length > 0) {
      // Altura base por item (aprox 29px por item com padding)
      const refsHeight = node.references.length * 30; 
      estimatedHeight += refsHeight + 5; // + borda superior
  }
  
  return {
    width: estimatedWidth,
    height: estimatedHeight
  };
};

export const calculateMindMapLayout = (
  rootId: string, 
  nodes: Record<string, MindMapNode>
): { nodes: MindMapNode[], width: number, height: number } => {
  
  const layoutNodes: Record<string, LayoutNode> = {};

  const measureTree = (nodeId: string, visitedStack: Set<string>): LayoutNode | null => {
    // Cycle detection
    if (visitedStack.has(nodeId)) return null;

    const originalNode = nodes[nodeId];
    if (!originalNode) return null;

    const newStack = new Set(visitedStack);
    newStack.add(nodeId);

    const size = measureNode(originalNode);
    
    const layoutNode: LayoutNode = {
      ...originalNode,
      _width: size.width,
      _height: size.height,
      _outerHeight: 0,
      _x: 0,
      _y: 0
    };

    layoutNodes[nodeId] = layoutNode;

    if (originalNode.isCollapsed || originalNode.childrenIds.length === 0) {
      layoutNode._outerHeight = layoutNode._height;
      return layoutNode;
    }

    let childrenTotalHeight = 0;
    originalNode.childrenIds.forEach((childId, index) => {
      const childLayout = measureTree(childId, newStack);
      if (childLayout) {
        childrenTotalHeight += childLayout._outerHeight;
        if (index < originalNode.childrenIds.length - 1) {
          childrenTotalHeight += CONFIG.verticalGap;
        }
      }
    });

    layoutNode._outerHeight = Math.max(layoutNode._height, childrenTotalHeight);
    return layoutNode;
  };

  const positionTree = (nodeId: string, x: number, yTop: number, visitedStack: Set<string>) => {
    if (visitedStack.has(nodeId)) return;
    
    const node = layoutNodes[nodeId];
    if (!node) return;

    const newStack = new Set(visitedStack);
    newStack.add(nodeId);

    node._x = x;

    if (node.isCollapsed || node.childrenIds.length === 0) {
      // Centraliza na área vertical alocada
      node._y = yTop + (node._outerHeight / 2) - (node._height / 2);
      return;
    }

    const childrenBlockHeight = node.childrenIds.reduce((acc, childId, idx) => {
      const child = layoutNodes[childId];
      if (!child) return acc;
      
      let h = acc + child._outerHeight;
      if (idx < node.childrenIds.length - 1) h += CONFIG.verticalGap;
      return h;
    }, 0);

    let currentChildY = yTop + (node._outerHeight - childrenBlockHeight) / 2;
    
    // X do filho é relativo à largura deste nó
    const childX = x + node._width + CONFIG.horizontalGap;

    node.childrenIds.forEach(childId => {
      const child = layoutNodes[childId];
      if (child) {
          positionTree(childId, childX, currentChildY, newStack);
          currentChildY += child._outerHeight + CONFIG.verticalGap;
      }
    });

    const firstChildId = node.childrenIds[0];
    const lastChildId = node.childrenIds[node.childrenIds.length - 1];
    
    const firstChild = layoutNodes[firstChildId];
    const lastChild = layoutNodes[lastChildId];
    
    if (firstChild && lastChild) {
        const childrenCenterY = (firstChild._y + lastChild._y) / 2;
        // Centraliza o nó pai em relação ao bloco de filhos
        // Ajuste para alinhar o centro do pai com o centro do bloco de filhos
        node._y = childrenCenterY + (firstChild._height / 2) - (node._height / 2);
        
        // Refinamento: Se o pai for muito maior que os filhos, centraliza melhor
        if (node._height > childrenBlockHeight) {
             node._y = yTop + (node._outerHeight / 2) - (node._height / 2);
        }
    } else {
        node._y = yTop + (node._outerHeight / 2) - (node._height / 2);
    }
  };

  const rootMetrics = measureTree(rootId, new Set());
  
  if (!rootMetrics && Object.keys(layoutNodes).length === 0) return { nodes: [], width: 0, height: 0 };

  if (layoutNodes[rootId]) {
      positionTree(rootId, 0, 0, new Set());
  }

  const allNodes = Object.values(layoutNodes);
  if (allNodes.length === 0) return { nodes: [], width: 0, height: 0 };

  const minX = Math.min(...allNodes.map(n => n._x + (n.offset?.x || 0)));
  const minY = Math.min(...allNodes.map(n => n._y + (n.offset?.y || 0)));
  const maxX = Math.max(...allNodes.map(n => n._x + n._width + (n.offset?.x || 0)));
  const maxY = Math.max(...allNodes.map(n => n._y + n._height + (n.offset?.y || 0)));

  const padding = 200; 
  
  const finalNodes = allNodes.map(n => ({
    ...n,
    _width: undefined, _height: undefined, _outerHeight: undefined, _x: undefined, _y: undefined,
    x: n._x + (n.offset?.x || 0) - minX + padding,
    y: n._y + (n.offset?.y || 0) - minY + padding,
    width: n._width,
    height: n._height
  }));

  return {
    nodes: finalNodes,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};
