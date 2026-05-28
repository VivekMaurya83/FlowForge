import { useState } from 'react';
import useDiagramStore from '../store/diagramStore';

export default function Navbar() {
  const {
    diagramTitle, setDiagramTitle,
    nodes, edges,
    isLoading, aiMode,
    clearDiagram,
  } = useDiagramStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput]     = useState(diagramTitle);

  const handleTitleSubmit = () => {
    const trimmed = titleInput.trim();
    if (trimmed) setDiagramTitle(trimmed);
    else setTitleInput(diagramTitle);
    setEditingTitle(false);
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="brand-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#logoGrad)" />
            <path d="M8 14 L12 10 L16 14 L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 18 L12 14 L16 18 L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">FlowForge</span>
          <span className="brand-ai">AI</span>
        </div>
      </div>

      {/* Diagram title */}
      <div className="navbar-center">
        {editingTitle ? (
          <input
            id="diagram-title-input"
            className="title-input"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') { setTitleInput(diagramTitle); setEditingTitle(false); }
            }}
            autoFocus
            maxLength={60}
          />
        ) : (
          <button
            id="diagram-title-btn"
            className="title-display"
            onClick={() => { setTitleInput(diagramTitle); setEditingTitle(true); }}
            title="Click to rename diagram"
          >
            {diagramTitle}
            <span className="title-edit-icon">✏️</span>
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="navbar-right">
        {/* AI status indicator */}
        {isLoading ? (
          <div className="ai-status loading">
            <span className="ai-pulse" />
            Gemini thinking…
          </div>
        ) : (
          <div className="diagram-stats">
            <span className="stat-chip">{nodes.length} nodes</span>
            <span className="stat-chip">{edges.length} edges</span>
          </div>
        )}

        {/* Clear button */}
        <button
          id="clear-diagram-btn"
          className="nav-icon-btn"
          onClick={() => {
            if (nodes.length === 0 || window.confirm('Clear the entire diagram?')) {
              clearDiagram();
            }
          }}
          title="Clear diagram"
        >
          🗑
        </button>

        {/* Keyboard hints */}
        <div className="keyboard-hints">
          <kbd>Del</kbd> Delete &nbsp; <kbd>Shift</kbd> Multi-select
        </div>
      </div>
    </nav>
  );
}
