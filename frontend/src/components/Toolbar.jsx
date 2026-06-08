import { useState, useCallback } from 'react';
import useDiagramStore from '../store/diagramStore';
import { toPng, toSvg } from 'html-to-image';
import {
  Monitor, Server, Database, Sparkles, HardDrive,
  ShieldCheck, Bell, Network, Cloud, User
} from 'lucide-react';

const NODE_TYPES = [
  { id: 'user',         label: 'User / Client',   icon: <User size={15} />,       description: 'End user or client application' },
  { id: 'frontend',    label: 'Frontend',         icon: <Monitor size={15} />,    description: 'Web or mobile interface' },
  { id: 'backend',     label: 'Backend API',      icon: <Server size={15} />,     description: 'Core application logic' },
  { id: 'database',    label: 'Database',         icon: <Database size={15} />,   description: 'Data storage' },
  { id: 'storage',     label: 'Cloud Storage',    icon: <HardDrive size={15} />,  description: 'Object or file storage' },
  { id: 'ai',          label: 'AI Service',       icon: <Sparkles size={15} />,   description: 'LLM or ML model' },
  { id: 'gateway',     label: 'API Gateway',      icon: <Network size={15} />,    description: 'Routing and rate limiting' },
  { id: 'security',    label: 'Auth / Security',  icon: <ShieldCheck size={15} />,description: 'Authentication provider' },
  { id: 'notification',label: 'Notification',     icon: <Bell size={15} />,       description: 'Email or SMS service' },
  { id: 'cloud',       label: 'External Cloud',   icon: <Cloud size={15} />,      description: 'Third-party cloud service' },
];

export default function Toolbar({ onAddNode }) {
  const [selectedType, setSelectedType] = useState('user');
  const [isExpanded, setIsExpanded] = useState(true);
  const { clearDiagram, nodes, edges } = useDiagramStore();

  const handleAddNode = useCallback(() => {
    if (onAddNode) onAddNode(selectedType);
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
      // Detect current theme for correct background colour
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const bgColor = isDark ? '#060a14' : '#f0f4ff';

      // Hide UI chrome that shouldn't appear in exports
      const controls     = element.querySelector('.flow-controls');
      const minimap      = element.querySelector('.flow-minimap');
      const background   = element.querySelector('.react-flow__background');
      const attribution  = element.querySelector('.react-flow__attribution');

      if (controls)    controls.style.display    = 'none';
      if (minimap)     minimap.style.display      = 'none';
      if (background)  background.style.display   = 'none';
      if (attribution) attribution.style.display  = 'none';

      const dataUrl = format === 'png'
        ? await toPng(element, { backgroundColor: bgColor })
        : await toSvg(element, { backgroundColor: bgColor });

      // Restore hidden elements
      if (controls)    controls.style.display    = '';
      if (minimap)     minimap.style.display      = '';
      if (background)  background.style.display   = '';
      if (attribution) attribution.style.display  = '';

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
    <aside className={`toolbar-panel ${!isExpanded ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="toolbar-header">
        {isExpanded && <span className="toolbar-title">Architecture</span>}
        <button
          id="toolbar-toggle"
          className="icon-btn toolbar-collapse-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isExpanded ? '◀' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* ── Components section ── */}
          <div className="toolbar-section">
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

          {/* ── Add Component CTA ── */}
          <div className="toolbar-add-row">
            <button
              id="add-node-btn"
              className="primary-btn full-width"
              onClick={handleAddNode}
            >
              <span>＋</span> Add Component
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* ── Export section ── */}
          <div className="toolbar-section toolbar-section-sm">
            <p className="section-label">Export</p>
            <div className="export-btn-row">
              <button
                className="export-icon-btn"
                onClick={() => handleExportImage('png')}
                title="Export as PNG image"
              >
                <span className="export-icon">🖼️</span>
                <span>PNG</span>
              </button>
              <button
                className="export-icon-btn"
                onClick={() => handleExportImage('svg')}
                title="Export as vector SVG"
              >
                <span className="export-icon">📐</span>
                <span>SVG</span>
              </button>
              <button
                id="export-btn"
                className="export-icon-btn"
                onClick={handleExportJson}
                title="Export as raw JSON"
              >
                <span className="export-icon">{ '{}'}</span>
                <span>JSON</span>
              </button>
            </div>
          </div>

          <div className="toolbar-divider" />

          {/* ── Stats ── */}
          <div className="toolbar-section toolbar-section-sm">
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

          <div className="toolbar-divider" />

          {/* ── Danger zone ── */}
          <div className="toolbar-section toolbar-section-sm">
            <button
              id="clear-diagram-btn"
              className="danger-btn full-width"
              onClick={() => {
                if (window.confirm('Clear all components and connections?')) {
                  clearDiagram();
                }
              }}
              title="Clear entire diagram"
            >
              ✕ Clear All
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
