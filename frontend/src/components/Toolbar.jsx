import { useState, useCallback } from 'react';
import useDiagramStore from '../store/diagramStore';

const NODE_TYPES = [
  { id: 'process', label: 'Process', icon: '⬜', description: 'General process step' },
  { id: 'database', label: 'Database', icon: '🗄️', description: 'Data storage' },
  { id: 'api', label: 'API', icon: '⚡', description: 'API endpoint or service' },
  { id: 'decision', label: 'Decision', icon: '◇', description: 'Decision point' },
  { id: 'start', label: 'Start/End', icon: '⬭', description: 'Flow start or end' },
];

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

export default function Toolbar({ onAddNode }) {
  const [selectedType, setSelectedType] = useState('process');
  const [isExpanded, setIsExpanded] = useState(true);
  const { clearDiagram, nodes, edges } = useDiagramStore();

  const handleAddNode = useCallback(() => {
    if (onAddNode) {
      onAddNode(selectedType);
    }
  }, [selectedType, onAddNode]);

  const handleExport = useCallback(() => {
    const snapshot = { nodes, edges };
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowforge-diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  return (
    <aside className="toolbar-panel">
      {/* Header */}
      <div className="toolbar-header">
        <span className="toolbar-title">Tools</span>
        <button
          id="toolbar-toggle"
          className="icon-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '◀' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Node Types */}
          <div className="toolbar-section">
            <p className="section-label">Node Type</p>
            <div className="node-type-list">
              {NODE_TYPES.map((nt) => (
                <button
                  key={nt.id}
                  id={`node-type-${nt.id}`}
                  className={`node-type-btn ${selectedType === nt.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(nt.id)}
                  title={nt.description}
                >
                  <span className="node-type-icon">{nt.icon}</span>
                  <span className="node-type-label">{nt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Node */}
          <div className="toolbar-section">
            <button
              id="add-node-btn"
              className="primary-btn full-width"
              onClick={handleAddNode}
            >
              <span>＋</span> Add Node
            </button>
          </div>

          {/* Divider */}
          <div className="toolbar-divider" />

          {/* Actions */}
          <div className="toolbar-section">
            <p className="section-label">Actions</p>
            <button
              id="export-btn"
              className="secondary-btn full-width"
              onClick={handleExport}
              title="Export diagram as JSON"
            >
              ↓ Export JSON
            </button>
            <button
              id="clear-diagram-btn"
              className="danger-btn full-width"
              onClick={() => {
                if (window.confirm('Clear all nodes and edges?')) {
                  clearDiagram();
                }
              }}
              title="Clear entire diagram"
            >
              ✕ Clear All
            </button>
          </div>

          {/* Stats */}
          <div className="toolbar-divider" />
          <div className="toolbar-section">
            <p className="section-label">Stats</p>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{nodes.length}</span>
                <span className="stat-label">Nodes</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{edges.length}</span>
                <span className="stat-label">Edges</span>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
