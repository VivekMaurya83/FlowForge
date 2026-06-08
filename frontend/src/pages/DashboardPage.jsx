import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { api } from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDiagrams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/diagram/list');
      setDiagrams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load diagrams';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  const createDiagram = async () => {
    try {
      const res = await api.post('/diagram/', { title: 'Untitled Diagram', nodes: [], edges: [] });
      navigate(`/editor/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create diagram');
    }
  };

  const deleteDiagram = async (e, diagramId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this diagram? This cannot be undone.')) return;
    try {
      await api.delete(`/diagram/${diagramId}`);
      setDiagrams((prev) => prev.filter((d) => d.id !== diagramId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete diagram');
    }
  };

  return (
    <div className="dashboard-shell">
      {/* ── Navbar ── */}
      <header className="dashboard-nav">
        <div className="dashboard-nav-brand">
          <div className="brand-logo" style={{ width: 32, height: 32 }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#dbLogoGrad)" />
              <path d="M8 14 L12 10 L16 14 L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 18 L12 14 L16 18 L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <defs>
                <linearGradient id="dbLogoGrad" x1="0" y1="0" x2="28" y2="28">
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

        <div className="dashboard-nav-right">
          {user?.name && (
            <span className="dashboard-welcome">👋 {user.name}</span>
          )}
          <button
            className="nav-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="dashboard-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="dashboard-main">
        {/* Page title row */}
        <div className="dashboard-title-row">
          <div className="dashboard-title-group">
            <h1 className="dashboard-h1">My Diagrams</h1>
            {!loading && (
              <span className="dashboard-count-badge">{diagrams.length}</span>
            )}
            <button
              className="dashboard-refresh-btn"
              onClick={fetchDiagrams}
              disabled={loading}
              title="Refresh"
            >
              {loading ? '⏳' : '↻'}
            </button>
          </div>
          <button className="dashboard-new-btn" onClick={createDiagram}>
            <span>＋</span> New Diagram
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="dashboard-error">
            <span>⚠ {error}</span>
            <button className="dashboard-error-retry" onClick={fetchDiagrams}>Retry</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-spinner" />
            <p>Loading your diagrams…</p>
          </div>
        ) : diagrams.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">📋</div>
            <p className="dashboard-empty-title">No diagrams yet</p>
            <p className="dashboard-empty-sub">
              Click <strong>+ New Diagram</strong> to get started
            </p>
            <button className="dashboard-new-btn" onClick={createDiagram} style={{ marginTop: '1rem' }}>
              <span>＋</span> New Diagram
            </button>
          </div>
        ) : (
          <div className="dashboard-grid">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="diagram-card"
                onClick={() => navigate(`/editor/${diagram.id}`)}
              >
                {/* Preview gradient header */}
                <div className="diagram-card-preview" />

                <div className="diagram-card-body">
                  <button
                    className="diagram-card-delete"
                    onClick={(e) => deleteDiagram(e, diagram.id)}
                    title="Delete diagram"
                  >
                    🗑
                  </button>
                  <h3 className="diagram-card-title">
                    {diagram.title || 'Untitled Diagram'}
                  </h3>
                  <p className="diagram-card-meta">
                    🕐 {new Date(diagram.updated_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <div className="diagram-card-stats">
                    <span className="diagram-stat-chip">{diagram.nodes?.length ?? 0} nodes</span>
                    <span className="diagram-stat-chip">{diagram.edges?.length ?? 0} edges</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
