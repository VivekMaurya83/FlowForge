import { useCallback, useRef, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeToolbar,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useDiagramStore from '../store/diagramStore';
import {
  User, Monitor, Server, Database, Sparkles, HardDrive, 
  ShieldCheck, Bell, Mail, Network, Cloud, Box
} from 'lucide-react';

// ─── Icon Mapping Engine ──────────────────────────────────────────────────
function getCategoryIcon(category, label) {
  const lbl = label?.toLowerCase() || '';
  if (category === 'user') return <User size={24} />;
  if (category === 'frontend' || lbl.includes('react') || lbl.includes('web')) return <Monitor size={24} />;
  if (category === 'backend' || category === 'service') return <Server size={24} />;
  if (category === 'database' || lbl.includes('mongo') || lbl.includes('sql')) return <Database size={24} />;
  if (category === 'ai' || lbl.includes('gemini') || lbl.includes('model')) return <Sparkles size={24} />;
  if (category === 'storage') return <HardDrive size={24} />;
  if (category === 'security' || lbl.includes('auth')) return <ShieldCheck size={24} />;
  if (category === 'notification' && lbl.includes('email')) return <Mail size={24} />;
  if (category === 'notification') return <Bell size={24} />;
  if (category === 'gateway' || lbl.includes('api')) return <Network size={24} />;
  if (category === 'cloud') return <Cloud size={24} />;
  
  return <Box size={24} />;
}

// ─── Shape & Color Mapping Engine ──────────────────────────────────────────
function getShapeClass(category) {
  if (category === 'user') return 'shape-circle';
  if (category === 'database' || category === 'storage') return 'shape-cylinder';
  return 'shape-rect'; // Everything else is a rounded rectangle card
}

// ─── Group Container Node (Background) ────────────────────────────────────
function GroupNode({ data }) {
  return (
    <div 
      className="group-node" 
      style={{ width: data.width, height: data.height }}
    >
      <div className="group-node-label">{data.label}</div>
    </div>
  );
}

// ─── Custom Editable Node ──────────────────────────────────────────────────
function EditableNode({ id, data, selected }) {
  const { updateNodeLabel, updateNodeDescription, setSelectedNode, removeNode } = useDiagramStore();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [desc, setDesc] = useState(data.description || '');
  const inputRef = useRef(null);

  const category = data.category || 'service';
  
  const startEdit = useCallback(() => {
    setEditing(true);
    setLabel(data.label);
    setDesc(data.description || '');
    setTimeout(() => inputRef.current?.select(), 50);
  }, [data.label, data.description]);

  const commitEdit = useCallback(() => {
    const trimmedLabel = label.trim();
    if (trimmedLabel) {
      updateNodeLabel(id, trimmedLabel);
    } else {
      setLabel(data.label);
    }
    
    const trimmedDesc = desc.trim();
    if (trimmedDesc !== (data.description || '')) {
      updateNodeDescription(id, trimmedDesc);
    } else {
      setDesc(data.description || '');
    }
    
    setEditing(false);
  }, [id, label, desc, data.label, data.description, updateNodeLabel, updateNodeDescription]);

  const handleKeyDown = useCallback(
    (e) => {
      // Don't commit on Enter for textarea to allow newlines, use Shift+Enter or Ctrl+Enter to commit?
      // Or just commit on Escape. For inputs, Enter works.
      if (e.key === 'Enter' && !e.shiftKey) {
         // only if target is not textarea, or let's just let textarea have enter for newlines
         if (e.target.tagName !== 'TEXTAREA') {
           commitEdit();
         }
      }
      if (e.key === 'Escape') {
        setLabel(data.label);
        setDesc(data.description || '');
        setEditing(false);
      }
      e.stopPropagation();
    },
    [commitEdit, data.label, data.description]
  );

  const shapeClass = getShapeClass(category);
  const colorClass = `cat-${category}`;
  const sizeClass = data.size === 'large' ? 'node-size-large' : '';

  // If the user has picked a custom colour in the sidebar, apply it inline
  // so it overrides the default cat-* CSS class gradient.
  const customColorStyle = data.color?.bg
    ? {
        background: `linear-gradient(135deg, ${data.color.bg}, ${data.color.border})`,
        borderColor: data.color.border,
      }
    : {};

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
      <Handle type="target" position={Position.Left} className="flow-handle target-handle" id={`${id}-target`} />

      {/* Node Body */}
      <div
        className={`custom-node ${shapeClass} ${colorClass} ${sizeClass} ${selected ? 'node-selected' : ''}`}
        style={customColorStyle}
        onDoubleClick={startEdit}
        onClick={() => setSelectedNode(id)}
      >
        <div className="node-icon-wrapper">
          {getCategoryIcon(category, data.label)}
        </div>

        {/* Label / Input */}
        {editing ? (
          <div className="node-editing-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              ref={inputRef}
              className="node-label-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              maxLength={60}
              placeholder="Title"
              autoFocus
            />
            <textarea
              className="node-label-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              placeholder="Description"
              rows={2}
              style={{ resize: 'vertical', fontSize: '10px', fontWeight: 'normal', color: 'rgba(255,255,255,0.9)' }}
            />
          </div>
        ) : (
          <>
            <div className="node-label">{data.label}</div>
            {data.description && <div className="node-desc">{data.description}</div>}
          </>
        )}
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Right} className="flow-handle source-handle" id={`${id}-source`} />
      {/* Bottom handle */}
      <Handle type="source" position={Position.Bottom} className="flow-handle source-handle" id={`${id}-source-bottom`} />
      {/* Top handle */}
      <Handle type="target" position={Position.Top} className="flow-handle target-handle" id={`${id}-target-top`} />
    </>
  );
}

const nodeTypes = { editableNode: EditableNode, groupNode: GroupNode };

// Default edge options
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
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

  // ── Dynamic Layer Containers ──────────────────────────────────────────────
  const renderNodes = useMemo(() => {
    const layerMap = {
      user: { label: 'Users Layer', nodes: [] },
      gateway: { label: 'Edge & Gateway Layer', nodes: [] },
      frontend: { label: 'Frontend Layer', nodes: [] },
      backend: { label: 'Backend Layer', nodes: [] },
      service: { label: 'Backend Layer', nodes: [] }, // group services with backend
      ai: { label: 'AI Services Layer', nodes: [] },
      database: { label: 'Data & Storage Layer', nodes: [] },
      storage: { label: 'Data & Storage Layer', nodes: [] },
    };

    nodes.forEach(n => {
      const cat = n.data?.category;
      if (cat && layerMap[cat]) {
        layerMap[cat].nodes.push(n);
      }
    });

    const groupNodes = [];
    
    // Calculate bounding box for each layer
    Object.keys(layerMap).forEach(key => {
      // prevent duplicate keys since service/backend map to same object
      if (key === 'service' || key === 'storage') return; 
      
      const layer = layerMap[key];
      if (layer.nodes.length === 0) return;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      layer.nodes.forEach(n => {
        const x = n.position.x;
        const y = n.position.y;
        
        // Dynamic dimension checking
        const isLarge = n.data?.size === 'large';
        const nodeW = isLarge ? 340 : 260;
        const nodeH = isLarge ? 140 : 100;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + nodeW + 20); // Add 20px buffer per node
        maxY = Math.max(maxY, y + nodeH + 20);
      });
      
      const paddingX = 60;
      const paddingY = 80; // top padding larger for title
      
      groupNodes.push({
        id: `group-${layer.label.replace(/\s+/g, '-')}`,
        type: 'groupNode',
        position: { x: minX - paddingX, y: minY - paddingY },
        data: { 
          width: (maxX - minX) + paddingX * 2, 
          height: (maxY - minY) + paddingY * 2, 
          label: layer.label 
        },
        selectable: false,
        draggable: false,
        zIndex: -1,
      });
    });

    return [...groupNodes, ...nodes];
  }, [nodes]);

  // Drop handler for drag-and-drop from sidebar
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

  const onNodeClick = useCallback((_, node) => setSelectedNode(node.id), [setSelectedNode]);
  const onEdgeClick = useCallback((_, edge) => setSelectedEdge(edge.id), [setSelectedEdge]);
  const onPaneClick = useCallback(() => clearSelection(), [clearSelection]);

  // Key handler for Delete key
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const store = useDiagramStore.getState();
      if (store.selectedNodeId) store.removeNode(store.selectedNodeId);
      else if (store.selectedEdgeId) store.removeEdge(store.selectedEdgeId);
    }
  }, []);

  return (
    <div
      className="canvas-wrapper"
      ref={reactFlowWrapper}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onKeyDown={onKeyDown}
      tabIndex={0}
      id="exportable-canvas-container"
    >
      <ReactFlow
        nodes={renderNodes}
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
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#334155" />
        <Controls className="flow-controls" showInteractive={false} />
        <MiniMap
          className="flow-minimap"
          width={140}
          height={90}
          nodeColor={(n) => {
            const colors = {
              user: '#e11d48', frontend: '#0284c7', backend: '#7c3aed',
              database: '#059669', storage: '#d97706', ai: '#db2777',
              service: '#4f46e5', cloud: '#0891b2', notification: '#ea580c',
              gateway: '#475569', security: '#0d9488'
            };
            return colors[n.data?.category] || '#4f46e5';
          }}
          maskColor="rgba(10, 15, 30, 0.7)"
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
