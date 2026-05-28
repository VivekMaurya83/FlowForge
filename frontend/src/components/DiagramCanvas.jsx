import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeToolbar,
  useReactFlow,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useDiagramStore from '../store/diagramStore';

// ─── Custom Editable Node ──────────────────────────────────────────────────
function EditableNode({ id, data, selected }) {
  const { updateNodeLabel, setSelectedNode, removeNode } = useDiagramStore();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef(null);

  const color = data.color || { bg: '#6366f1', border: '#4f46e5' };
  const nodeType = data.nodeType || 'process';

  const startEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label);
    setTimeout(() => inputRef.current?.select(), 50);
  }, [data.label]);

  const commitEdit = useCallback(() => {
    const trimmed = label.trim();
    if (trimmed) {
      updateNodeLabel(id, trimmed);
    } else {
      setLabel(data.label);
    }
    setEditing(false);
  }, [id, label, data.label, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') {
        setLabel(data.label);
        setEditing(false);
      }
      e.stopPropagation();
    },
    [commitEdit, data.label]
  );

  // Shape classes per node type
  const shapeClass = {
    decision: 'node-diamond',
    start: 'node-pill',
    end: 'node-pill',
    database: 'node-cylinder',
    api: 'node-hex',
    process: 'node-rect',
  }[nodeType] || 'node-rect';

  return (
    <>
      {/* Toolbar that appears on select */}
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="node-toolbar">
          <button
            id={`node-edit-${id}`}
            className="node-tool-btn"
            onClick={startEdit}
            title="Rename (or double-click)"
          >
            ✏️
          </button>
          <button
            id={`node-delete-${id}`}
            className="node-tool-btn danger"
            onClick={() => removeNode(id)}
            title="Delete node"
          >
            🗑
          </button>
        </div>
      </NodeToolbar>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle target-handle"
        id={`${id}-target`}
      />

      {/* Node Body */}
      <div
        className={`custom-node ${shapeClass} ${selected ? 'node-selected' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${color.bg}dd, ${color.border}cc)`,
          borderColor: selected ? '#fff' : color.border,
          boxShadow: selected
            ? `0 0 0 2px ${color.bg}, 0 8px 32px ${color.bg}55`
            : `0 4px 20px ${color.bg}33`,
        }}
        onDoubleClick={startEdit}
        onClick={() => setSelectedNode(id)}
      >
        {/* Node type badge */}
        <div className="node-type-badge">{nodeType}</div>

        {/* Label / Input */}
        {editing ? (
          <input
            ref={inputRef}
            className="node-label-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            maxLength={60}
            autoFocus
          />
        ) : (
          <div className="node-label">{data.label}</div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="flow-handle source-handle"
        id={`${id}-source`}
      />
      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="flow-handle source-handle"
        id={`${id}-source-bottom`}
      />
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="flow-handle target-handle"
        id={`${id}-target-top`}
      />
    </>
  );
}

const nodeTypes = { editableNode: EditableNode };

// Default edge options
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

// ─── Main Canvas ──────────────────────────────────────────────────────────
export default function DiagramCanvas({ onAddNode }) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    addNode,
  } = useDiagramStore();

  const reactFlowWrapper = useRef(null);

  // Drop handler for drag-and-drop from sidebar (future)
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/node-type');
      if (!type) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 75,
        y: event.clientY - bounds.top - 30,
      };
      addNode(type, position);
    },
    [addNode]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback(
    (_, node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onEdgeClick = useCallback(
    (_, edge) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Key handler for Delete key
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const store = useDiagramStore.getState();
        if (store.selectedNodeId) store.removeNode(store.selectedNodeId);
        else if (store.selectedEdgeId) store.removeEdge(store.selectedEdgeId);
      }
    },
    []
  );

  return (
    <div
      className="canvas-wrapper"
      ref={reactFlowWrapper}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={3}
        deleteKeyCode={null}         // handled manually above
        multiSelectionKeyCode="Shift"
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        attributionPosition="bottom-right"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#334155"
        />
        <Controls
          className="flow-controls"
          showInteractive={false}
        />
        <MiniMap
          className="flow-minimap"
          nodeColor={(n) => n.data?.color?.bg || '#6366f1'}
          maskColor="rgba(10, 15, 30, 0.8)"
          style={{ background: '#0f172a', border: '1px solid #1e293b' }}
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="canvas-empty">
          <div className="empty-icon">🌐</div>
          <h3 className="empty-title">Canvas is empty</h3>
          <p className="empty-subtitle">
            Add nodes from the left toolbar or use a prompt (Phase 2)
          </p>
        </div>
      )}
    </div>
  );
}
