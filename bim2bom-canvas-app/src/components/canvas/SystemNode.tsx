/**
 * System Node Component for React Flow Canvas
 */

import { Handle, Position } from 'reactflow';
import { ProcurementStep } from '../../store/procurementStore';

export interface SystemNodeData {
  label: string;
  step: ProcurementStep;
  isActive: boolean;
  status?: 'idle' | 'processing' | 'complete' | 'error';
}

interface SystemNodeProps {
  data: SystemNodeData;
  selected?: boolean;
}

export function SystemNode({ data, selected }: SystemNodeProps) {
  const { label, isActive, status = 'idle' } = data;

  const getStatusColor = () => {
    if (!isActive) return '#666';
    switch (status) {
      case 'processing':
        return '#3b82f6';
      case 'complete':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#666';
    }
  };

  const getStatusIcon = () => {
    if (!isActive) return '○';
    switch (status) {
      case 'processing':
        return '⟳';
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div
      className={`system-node ${selected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
      style={{
        padding: '12px 16px',
        background: isActive ? '#ffffff' : '#f9fafb',
        border: `2px solid ${getStatusColor()}`,
        borderRadius: '8px',
        minWidth: '120px',
        textAlign: 'center',
        boxShadow: selected ? '0 4px 6px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        color: '#1f2937',
      }}
    >
      {/* Top handle for receiving from different swimlane */}
      <Handle type="target" position={Position.Top} id="top" />
      {/* Left handle for same swimlane */}
      <Handle type="target" position={Position.Left} id="left" />
      {/* Bottom handle for receiving from lower swimlane */}
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      
      <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1f2937', fontSize: '14px' }}>
        {getStatusIcon()} {label}
      </div>
      {status === 'processing' && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Processing...</div>
      )}
      
      {/* Right handle for same swimlane */}
      <Handle type="source" position={Position.Right} id="right" />
      {/* Bottom handle for sending to different swimlane */}
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}

