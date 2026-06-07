import { useState, useCallback } from 'react';
import useDiagramStore from '../store/diagramStore';
import { toPng, toSvg } from 'html-to-image';
import { 
  Monitor, Server, Database, Sparkles, HardDrive, 
  ShieldCheck, Bell, Network, Cloud, User 
} from 'lucide-react';

const NODE_TYPES = [
  { id: 'user', label: 'User / Client', icon: <User size={14} />, description: 'End user or client application' },
  { id: 'frontend', label: 'Frontend', icon: <Monitor size={14} />, description: 'Web or mobile interface' },
  { id: 'backend', label: 'Backend API', icon: <Server size={14} />, description: 'Core application logic' },
  { id: 'database', label: 'Database', icon: <Database size={14} />, description: 'Data storage' },
  { id: 'storage', label: 'Cloud Storage', icon: <HardDrive size={14} />, description: 'Object or file storage' },
  { id: 'ai', label: 'AI Service', icon: <Sparkles size={14} />, description: 'LLM or ML model' },
  { id: 'gateway', label: 'API Gateway', icon: <Network size={14} />, description: 'Routing and rate limiting' },
  { id: 'security', label: 'Auth / Security', icon: <ShieldCheck size={14} />, description: 'Authentication provider' },
  { id: 'notification', label: 'Notification', icon: <Bell size={14} />, description: 'Email or SMS service' },
  { id: 'cloud', label: 'External Cloud', icon: <Cloud size={14} />, description: 'Third-party cloud service' },
];

export default function Toolbar({ onAddNode }) {
  const [selectedType, setSelectedType] = useState('service');
  const [isExpanded, setIsExpanded] = useState(true);
  const { clearDiagram, nodes, edges } = useDiagramStore();

  const handleAddNode = useCallback(() => {
    if (onAddNode) {
      onAddNode(selectedType);
    }
  }, [selectedType, onAddNode]);

  const handleExportJson = useCallback(() => {
    const snapshot = { nodes, edges };
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowforge-architecture.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleExportImage = useCallback(async (format) => {
    const element = document.querySelector('.react-flow');
    if (!element) return;
    
    try {
      // Temporarily hide controls for export
      const controls = element.querySelector('.flow-controls');
      const minimap = element.querySelector('.flow-minimap');
      if (controls) controls.style.display = 'none';
      if (minimap) minimap.style.display = 'none';

      const dataUrl = format === 'png' 
        ? await toPng(element, { backgroundColor: '#0f172a' })
        : await toSvg(element, { backgroundColor: '#0f172a' });
        
      if (controls) controls.style.display = '';
      if (minimap) minimap.style.display = '';

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `flowforge-architecture.${format}`;
      a.click();
    } catch (err) {
      console.error('Failed to export', err);
      alert('Export failed. Diagram might be too large or contain unsupported elements.');
    }
  }, []);

  return (
    <aside className="toolbar-panel">
      {/* Header */}
      <div className="toolbar-header">
        <span className="toolbar-title">Architecture</span>
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
          <div className="toolbar-section" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
            <p className="section-label">Components</p>
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
              <span>＋</span> Add Component
            </button>
          </div>

          {/* Divider */}
          <div className="toolbar-divider" />

          {/* Actions */}
          <div className="toolbar-section">
            <p className="section-label">Export & Actions</p>
            <button
              className="secondary-btn full-width"
              onClick={() => handleExportImage('png')}
              title="Export diagram as PNG image"
            >
              🖼️ Export PNG
            </button>
            <button
              className="secondary-btn full-width"
              onClick={() => handleExportImage('svg')}
              title="Export diagram as vector SVG"
            >
              📐 Export SVG
            </button>
            <button
              id="export-btn"
              className="secondary-btn full-width"
              onClick={handleExportJson}
              title="Export diagram as raw JSON"
            >
              ↓ Export JSON
            </button>
            <button
              id="clear-diagram-btn"
              className="danger-btn full-width"
              onClick={() => {
                if (window.confirm('Clear all components and connections?')) {
                  clearDiagram();
                }
              }}
              title="Clear entire diagram"
              style={{ marginTop: '4px' }}
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
