
import React from 'react';
import { BlockConnection, BlockPosition } from '../../types';

interface CanvasConnectionProps {
  connection: BlockConnection;
  fromPos: BlockPosition;
  toPos: BlockPosition;
}

const CanvasConnection: React.FC<CanvasConnectionProps> = ({ fromPos, toPos }) => {
  // Pontos centrais dos blocos
  const x1 = fromPos.x + fromPos.width / 2;
  const y1 = fromPos.y + fromPos.height / 2;
  const x2 = toPos.x + toPos.width / 2;
  const y2 = toPos.y + toPos.height / 2;

  // Curva de Bézier para suavizar a linha
  const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const curvature = Math.min(dist * 0.5, 150);
  
  // Lógica simples para direção da curva
  const controlX1 = x1 + (x2 > x1 ? curvature : -curvature);
  const controlY1 = y1;
  const controlX2 = x2 + (x2 > x1 ? -curvature : curvature);
  const controlY2 = y2;

  const path = `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;

  return (
    <g>
      {/* Linha "sombra" para destaque */}
      <path d={path} stroke="#0a0e27" strokeWidth="6" fill="none" opacity="0.5" />
      {/* Linha principal */}
      <path d={path} stroke="#4b5563" strokeWidth="2" fill="none" className="transition-colors hover:stroke-blue-400" />
      {/* Círculo no destino */}
      <circle cx={x2} cy={y2} r="3" fill="#4b5563" />
    </g>
  );
};

export default CanvasConnection;
