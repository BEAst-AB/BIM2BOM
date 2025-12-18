/**
 * Custom Background Component with Swimlanes
 * Properly synced with React Flow viewport using useViewport hook
 */

import { useViewport } from 'reactflow';
import { LANE_IFC, LANE_CDE, LANE_BUYING, LANE_SELLING, SWIMLANE_HEIGHT } from './ProcessCanvas';

export function SwimlaneBackground() {
  const { x, y, zoom } = useViewport();

  const lanes = [
    {
      y: LANE_IFC,
      height: SWIMLANE_HEIGHT,
      label: 'IFC Model',
      color: '#f3f4f6',
      borderColor: '#d1d5db',
      textColor: '#1f2937',
    },
    {
      y: LANE_CDE,
      height: SWIMLANE_HEIGHT,
      label: 'CDE',
      color: '#dbeafe',
      borderColor: '#93c5fd',
      textColor: '#1e40af',
    },
    {
      y: LANE_BUYING,
      height: SWIMLANE_HEIGHT,
      label: 'Buying System',
      color: '#dcfce7',
      borderColor: '#86efac',
      textColor: '#166534',
    },
    {
      y: LANE_SELLING,
      height: SWIMLANE_HEIGHT,
      label: 'Selling System',
      color: '#fef3c7',
      borderColor: '#fde047',
      textColor: '#92400e',
    },
  ];

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      className="react-flow__background"
    >
      <defs>
        <pattern
          id="grid-pattern-swimlanes"
          width={20}
          height={20}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      </defs>
      
      {/* Apply React Flow's viewport transform to match node coordinates */}
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {/* Grid background - large enough to cover viewport */}
        <rect
          x="-10000"
          y="-10000"
          width="20000"
          height="20000"
          fill="url(#grid-pattern-swimlanes)"
        />
        
        {/* Swimlanes - rendered in React Flow coordinate space */}
        {lanes.map((lane, index) => (
          <g key={lane.label}>
            {/* Lane background - full width */}
            <rect
              x="-10000"
              y={lane.y}
              width="20000"
              height={lane.height}
              fill={lane.color}
              opacity="0.3"
            />
            
            {/* Lane label */}
            <rect
              x="10"
              y={lane.y + 50}
              width="120"
              height="30"
              fill={lane.color}
              stroke={lane.borderColor}
              strokeWidth="1"
              rx="4"
            />
            <text
              x="70"
              y={lane.y + 68}
              textAnchor="middle"
              fill={lane.textColor}
              fontSize="14"
              fontWeight="600"
            >
              {lane.label}
            </text>
            
            {/* Bottom divider */}
            {index < lanes.length - 1 && (
              <line
                x1="-10000"
                y1={lane.y + lane.height}
                x2="10000"
                y2={lane.y + lane.height}
                stroke={lane.borderColor}
                strokeWidth="2"
              />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
