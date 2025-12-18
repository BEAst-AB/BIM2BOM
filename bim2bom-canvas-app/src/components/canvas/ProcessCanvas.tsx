/**
 * Process Canvas Component using React Flow with Swimlanes
 */

import { useCallback, useEffect } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  MarkerType,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SystemNode } from './SystemNode';
import { SwimlaneBackground } from './SwimlaneBackground';
import { ProcurementStep, useProcurementStore } from '../../store/procurementStore';

const nodeTypes = {
  systemNode: SystemNode,
};

// Swimlane Y positions
export const SWIMLANE_HEIGHT = 150;
export const LANE_IFC = 50;
export const LANE_CDE = LANE_IFC + SWIMLANE_HEIGHT;
export const LANE_BUYING = LANE_CDE + SWIMLANE_HEIGHT;
export const LANE_SELLING = LANE_BUYING + SWIMLANE_HEIGHT;

// Horizontal spacing between nodes
const NODE_SPACING = 350;

const initialNodes: Node[] = [
  // IFC Model lane - Combined Upload & Validate
  {
    id: 'upload-validate',
    type: 'systemNode',
    position: { x: 100, y: LANE_IFC },
    data: { label: 'Upload & Validate', step: ProcurementStep.VALIDATED, isActive: false },
    draggable: false,
  },
  
  // CDE lane - Stacked vertically
  {
    id: 'convert',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING, y: LANE_CDE },
    data: { label: 'Convert', step: ProcurementStep.CONVERTED, isActive: false },
    draggable: false,
  },
  {
    id: 'publish',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING, y: LANE_CDE + 80 },
    data: { label: 'Publish', step: ProcurementStep.SENT_TO_BUYER, isActive: false },
    draggable: false,
  },
  
  // Buying System lane
  {
    id: 'enrich',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING * 2, y: LANE_BUYING },
    data: { label: 'Enrich', step: ProcurementStep.ENRICHED, isActive: false },
    draggable: false,
  },
  {
    id: 'send-rfq',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING * 3, y: LANE_BUYING },
    data: { label: 'Send RFQ', step: ProcurementStep.RFQ_SENT, isActive: false },
    draggable: false,
  },
  
  // Selling System lane
  {
    id: 'respond',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING * 3, y: LANE_SELLING },
    data: { label: 'Respond', step: ProcurementStep.QUOTE_RECEIVED, isActive: false },
    draggable: false,
  },
  {
    id: 'accept',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING * 4, y: LANE_BUYING },
    data: { label: 'Accept', step: ProcurementStep.ACCEPTED, isActive: false },
    draggable: false,
  },
  
  // Back to CDE
  {
    id: 'writeback',
    type: 'systemNode',
    position: { x: 100 + NODE_SPACING * 5, y: LANE_CDE },
    data: { label: 'Write-back', step: ProcurementStep.WRITTEN_BACK, isActive: false },
    draggable: false,
  },
];

const initialEdges: Edge[] = [
  // Cross swimlane: IFC -> CDE (bottom to top)
  {
    id: 'e1',
    source: 'upload-validate',
    target: 'convert',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'IFC (validated)',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
  // Same position: Convert -> Publish (top to bottom, stacked)
  {
    id: 'e2',
    source: 'convert',
    target: 'publish',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'Peppol Catalogue XML',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
  // Cross swimlane: CDE -> Buying System (right to left)
  {
    id: 'e4',
    source: 'publish',
    target: 'enrich',
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'Peppol Catalogue',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
  // Same swimlane: Buying System
  {
    id: 'e5',
    source: 'enrich',
    target: 'send-rfq',
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'Catalogue (enriched)',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
  // Cross swimlane: Buying -> Selling (bottom to top)
  {
    id: 'e6',
    source: 'send-rfq',
    target: 'respond',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'RFQ XML',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
  // Cross swimlane: Selling -> Buying (right to bottom - upward flow)
  {
    id: 'e7',
    source: 'respond',
    target: 'accept',
    sourceHandle: 'right',
    targetHandle: 'bottom-target',
    label: 'Quote XML',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
  // Cross swimlane: Buying -> CDE (right to bottom - upward flow)
  {
    id: 'e8',
    source: 'accept',
    target: 'writeback',
    sourceHandle: 'right',
    targetHandle: 'bottom-target',
    label: 'Accepted Catalogue',
    labelStyle: { fill: '#1f2937', fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed },
    type: 'smoothstep',
  },
];

export function ProcessCanvas() {
  const currentCase = useProcurementStore((state) => state.currentCase);
  const selectedNodeId = useProcurementStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useProcurementStore((state) => state.setSelectedNodeId);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Helper function to check if we have data for a step
  const hasDataForStep = useCallback((case_: typeof currentCase, step: ProcurementStep): boolean => {
    if (!case_) return false;
    
    switch (step) {
      case ProcurementStep.CONVERTED:
        return !!case_.catalogueXML;
      case ProcurementStep.ENRICHED:
        return !!case_.enrichedData;
      case ProcurementStep.RFQ_SENT:
        return !!case_.rfqData;
      case ProcurementStep.QUOTE_RECEIVED:
        return !!case_.quoteData;
      case ProcurementStep.ACCEPTED:
        return !!case_.acceptanceData;
      case ProcurementStep.VALIDATED:
        return !!case_.validationResults;
      default:
        return true; // For steps that don't have data, assume they're done
    }
  }, []);

  // Update node states based on current procurement case step
  useEffect(() => {
    if (!currentCase) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { ...node.data, isActive: false, status: 'idle' },
        }))
      );
      return;
    }

    const stepOrder: ProcurementStep[] = [
      ProcurementStep.UPLOADED,
      ProcurementStep.VALIDATED,
      ProcurementStep.CONVERTED,
      ProcurementStep.SENT_TO_BUYER,
      ProcurementStep.ENRICHED,
      ProcurementStep.RFQ_SENT,
      ProcurementStep.QUOTE_RECEIVED,
      ProcurementStep.ACCEPTED,
      ProcurementStep.WRITTEN_BACK,
    ];

    const currentStepIndex = stepOrder.indexOf(currentCase.step);
    console.log('ProcessCanvas: currentCase.step =', currentCase.step, 'index =', currentStepIndex);
    
    if (currentStepIndex === -1) {
      console.warn('ProcessCanvas: Step not found in stepOrder:', currentCase.step);
      return;
    }

    setNodes((nds) =>
      nds.map((node) => {
        // Special handling for combined upload-validate node
        let nodeStepIndex: number;
        let isActive: boolean;
        let isCurrent: boolean;
        
        if (node.id === 'upload-validate') {
          // Combined node is active if UPLOADED or VALIDATED step is reached
          const uploadedIndex = stepOrder.indexOf(ProcurementStep.UPLOADED);
          const validatedIndex = stepOrder.indexOf(ProcurementStep.VALIDATED);
          nodeStepIndex = Math.max(uploadedIndex, validatedIndex);
          isActive = uploadedIndex <= currentStepIndex || validatedIndex <= currentStepIndex;
          isCurrent = uploadedIndex === currentStepIndex || validatedIndex === currentStepIndex;
        } else {
          nodeStepIndex = stepOrder.indexOf(node.data.step);
          isActive = nodeStepIndex <= currentStepIndex;
          isCurrent = nodeStepIndex === currentStepIndex;
        }
        
        // Determine status: if active and has data, it's complete; if current but no data yet, it's processing
        let status: 'idle' | 'processing' | 'complete' | 'error' = 'idle';
        if (isActive) {
          if (node.id === 'upload-validate') {
            // For combined node, check if validated step has data
            if (currentStepIndex >= stepOrder.indexOf(ProcurementStep.VALIDATED) && hasDataForStep(currentCase, ProcurementStep.VALIDATED)) {
              status = 'complete';
            } else if (currentStepIndex >= stepOrder.indexOf(ProcurementStep.UPLOADED)) {
              status = 'processing';
            }
          } else if (isCurrent && !hasDataForStep(currentCase, node.data.step)) {
            status = 'processing';
          } else {
            status = 'complete';
          }
        }

        if (node.id === 'convert') {
          console.log('Convert node:', {
            nodeStepIndex,
            currentStepIndex,
            isActive,
            isCurrent,
            hasData: hasDataForStep(currentCase, node.data.step),
            status,
            currentStep: currentCase.step,
            nodeStep: node.data.step,
          });
        }

        return {
          ...node,
          selected: node.id === selectedNodeId,
          data: {
            ...node.data,
            isActive,
            status,
          },
        };
      })
    );
  }, [currentCase, selectedNodeId, setNodes, hasDataForStep]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <SwimlaneBackground />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
