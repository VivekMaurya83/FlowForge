import { useState, useEffect, useRef } from 'react';
import useDiagramStore from '../store/diagramStore';
import VersionHistory from './VersionHistory';

const COLOR_PRESETS = [
  { bg: '#6366f1', border: '#4f46e5', name: 'Indigo' },
  { bg: '#8b5cf6', border: '#7c3aed', name: 'Violet' },
  { bg: '#06b6d4', border: '#0891b2', name: 'Cyan' },
  { bg: '#10b981', border: '#059669', name: 'Emerald' },
  { bg: '#f59e0b', border: '#d97706', name: 'Amber' },
  { bg: '#ef4444', border: '#dc2626', name: 'Red' },
  { bg: '#ec4899', border: '#db2777', name: 'Pink' },
  { bg: '#64748b', border: '#475569', name: 'Slate' },
];

const NODE_TYPES = [
  { id: 'process',  label: 'Process' },
  { id: 'database', label: 'Database' },
  { id: 'api',      label: 'API' },
  { id: 'decision', label: 'Decision' },
  { id: 'start',    label: 'Start' },
  { id: 'end',      label: 'End' },
];

function NodeProperties({ node }) {
  const { updateNodeLabel, updateNodeDescription, updateNodeColor, updateNodeType, removeNode } = useDiagramStore();
  const [label, setLabel] = useState(node.data.label);
  const [description, setDescription] = useState(node.data.description || '');
  const inputRef = useRef(null);

  useEffect(() => { 
    setLabel(node.data.label); 
    setDescription(node.data.description || '');
  }, [node.id, node.data.label, node.data.description]);

  const handleLabelBlur = () => {
    if (label.trim()) updateNodeLabel(node.id, label.trim());
    else setLabel(node.data.label);
  };

  const handleDescriptionBlur = () => {
    if (description.trim() !== (node.data.description || '')) {
      updateNodeDescription(node.id, description.trim());
    } else {
      setDescription(node.data.description || '');
    }
  };

  return (
    <div className="properties-content">
      <div className="property-group">
        <label className="property-label" htmlFor="node-label-input">Label</label>
        <input
          ref={inputRef}
          id="node-label-input"
          className="property-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleLabelBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.blur();
            if (e.key === 'Escape') { setLabel(node.data.label); inputRef.current?.blur(); }
          }}
          placeholder="Node label..."
          maxLength={60}
        />
      </div>

      <div className="property-group">
        <label className="property-label" htmlFor="node-desc-input">Description</label>
        <textarea
          id="node-desc-input"
          className="property-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Node description..."
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="property-group">
        <label className="property-label">Node Type</label>
        <select
          id="node-type-select"
          className="property-select"
          value={node.data.nodeType || 'process'}
          onChange={(e) => updateNodeType(node.id, e.target.value)}
        >
          {NODE_TYPES.map((nt) => (
            <option key={nt.id} value={nt.id}>{nt.label}</option>
          ))}
        </select>
      </div>

      <div className="property-group">
        <label className="property-label">Color</label>
        <div className="color-preset-grid">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.name}
              id={`color-preset-${c.name.toLowerCase()}`}
              className={`color-swatch ${node.data.color?.bg === c.bg ? 'selected' : ''}`}
              style={{ backgroundColor: c.bg, borderColor: c.border }}
              title={c.name}
              onClick={() => updateNodeColor(node.id, c)}
            />
          ))}
        </div>
      </div>

      <div className="property-group">
        <label className="property-label">Node ID</label>
        <div className="property-id">{node.id}</div>
      </div>

      <button
        id="delete-node-btn"
        className="danger-btn full-width"
        onClick={() => removeNode(node.id)}
      >
        🗑 Delete Node
      </button>
    </div>
  );
}

function EdgeProperties({ edge }) {
  const { removeEdge, toggleEdgeAnimation } = useDiagramStore();

  return (
    <div className="properties-content">
      <div className="property-group">
        <label className="property-label">Connection</label>
        <div className="edge-info">
          <span className="edge-node">{edge.source}</span>
          <span className="edge-arrow">→</span>
          <span className="edge-node">{edge.target}</span>
        </div>
      </div>

      <div className="property-group">
        <label className="property-label">Edge ID</label>
        <div className="property-id">{edge.id}</div>
      </div>

      <div className="property-group">
        <label className="property-label">Animation</label>
        <button
          id="toggle-edge-anim-btn"
          className={`toggle-btn ${edge.animated ? 'active' : ''}`}
          onClick={() => toggleEdgeAnimation(edge.id)}
        >
          {edge.animated ? '⏸ Animated ON' : '▶ Animated OFF'}
        </button>
      </div>

      <button
        id="delete-edge-btn"
        className="danger-btn full-width"
        onClick={() => removeEdge(edge.id)}
      >
        🗑 Delete Connection
      </button>
    </div>
  );
}

export default function Sidebar() {
  const { selectedNodeId, selectedEdgeId, getSelectedNode, getSelectedEdge } = useDiagramStore();
  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'history'

  const selectedNode = getSelectedNode();
  const selectedEdge = getSelectedEdge();
  const hasSelection = selectedNodeId || selectedEdgeId;

  return (
    <aside className="sidebar-panel">
      {/* Tab switcher */}
      <div className="sidebar-tabs">
        <button
          id="tab-properties"
          className={`sidebar-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          ⚙ Properties
        </button>
        <button
          id="tab-history"
          className={`sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          🕐 History
        </button>
      </div>

      {/* Properties tab */}
      {activeTab === 'properties' && (
        <>
          {!hasSelection && (
            <div className="no-selection">
              <div className="no-selection-icon">⬜</div>
              <p className="no-selection-text">
                Select a node or edge to view and edit its properties.
              </p>
              <div className="tips-list">
                <p className="tip-item">💡 <strong>Add nodes</strong> from the left toolbar</p>
                <p className="tip-item">🔗 <strong>Connect nodes</strong> by dragging from handles</p>
                <p className="tip-item">✏️ <strong>Double-click</strong> a node to rename it</p>
                <p className="tip-item">🗑 <strong>Press Delete</strong> to remove selection</p>
                <p className="tip-item">✦ <strong>Use a prompt</strong> to generate with AI</p>
              </div>
            </div>
          )}
          {selectedNode && <NodeProperties node={selectedNode} />}
          {selectedEdge && !selectedNode && <EdgeProperties edge={selectedEdge} />}
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && <VersionHistory />}
    </aside>
  );
}
