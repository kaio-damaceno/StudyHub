
import React, { useState } from 'react';
import { useMindMap } from '../../contexts/MindMapContext';
import { Icon } from '../ui/Icon';

interface MindMapConnectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  childId: string;
}

const MindMapConnection: React.FC<MindMapConnectionProps> = ({ startX, startY, endX, endY, color, childId }) => {
  const { deleteNode } = useMindMap();
  const [isHovered, setIsHovered] = useState(false);

  // Bezier Control Points
  const c1x = startX + (endX - startX) / 2;
  const c1y = startY;
  const c2x = startX + (endX - startX) / 2;
  const c2y = endY;

  const path = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

  // Calculate Midpoint for Trash Icon (approximate for Bezier)
  // Cubic Bezier B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
  // t = 0.5
  const t = 0.5;
  const midX = (1-t)**3 * startX + 3*(1-t)**2 * t * c1x + 3*(1-t) * t**2 * c2x + t**3 * endX;
  const midY = (1-t)**3 * startY + 3*(1-t)**2 * t * c1y + 3*(1-t) * t**2 * c2y + t**3 * endY;

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      className="group pointer-events-auto"
    >
      {/* Invisible thicker path for easier hover detection */}
      <path 
        d={path}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        className="cursor-pointer"
      />
      
      {/* Visible Path */}
      <path 
        d={path}
        stroke={isHovered ? '#ef4444' : color}
        strokeWidth={isHovered ? 3 : 2}
        fill="none"
        opacity={isHovered ? 1 : 0.3}
        className="transition-all duration-300 pointer-events-none"
      />

      {/* Trash Button - Visible on Hover */}
      {isHovered && (
        <foreignObject x={midX - 12} y={midY - 12} width="24" height="24" className="overflow-visible">
          <div 
            onClick={(e) => { e.stopPropagation(); deleteNode(childId); }}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
            title="Excluir ramo"
          >
            <Icon name="trash" size={12} />
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default MindMapConnection;
