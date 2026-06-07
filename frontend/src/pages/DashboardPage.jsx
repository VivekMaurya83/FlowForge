import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { api } from '../store/authStore';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch on mount with [] — the axios interceptor reads token from
  // localStorage directly, so we don't need to wait for the `user`
  // object to be in Zustand state. This also fires when navigating
  // back from the editor (component re-mounts).
  const fetchDiagrams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/diagram/list');
      console.log('[Dashboard] Fetched diagrams:', res.data);
      // Guard against non-array response
      setDiagrams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch diagrams:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to load diagrams';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fire immediately on mount (covers: first load, page refresh, back-nav)
  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  const createDiagram = async () => {
    try {
      const res = await api.post('/diagram/', {
        title: 'Untitled Diagram',
        nodes: [],
        edges: [],
      });
      console.log('[Dashboard] Created diagram:', res.data);
      navigate(`/editor/${res.data.id}`);
    } catch (err) {
      console.error('[Dashboard] Failed to create diagram:', err);
      setError(err.response?.data?.detail || 'Failed to create diagram');
    }
  };

  const deleteDiagram = async (e, diagramId) => {
    e.stopPropagation(); // Don't navigate to editor
    if (!window.confirm('Delete this diagram? This cannot be undone.')) return;
    try {
      await api.delete(`/diagram/${diagramId}`);
      setDiagrams((prev) => prev.filter((d) => d.id !== diagramId));
    } catch (err) {
      console.error('[Dashboard] Failed to delete diagram:', err);
      setError(err.response?.data?.detail || 'Failed to delete diagram');
    }
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white', padding: '2rem' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Welcome, {user?.name}</span>
          <button
            onClick={logout}
            style={{ padding: '0.5rem 1rem', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div style={{
          background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: '8px',
          padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', fontSize: '14px'
        }}>
          <span>⚠ {error}</span>
          <button
            onClick={fetchDiagrams}
            style={{ padding: '0.25rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginLeft: '1rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Toolbar row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
            My Diagrams {!loading && `(${diagrams.length})`}
          </h2>
          <button
            onClick={fetchDiagrams}
            disabled={loading}
            title="Refresh"
            style={{ padding: '0.25rem 0.6rem', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
          >
            {loading ? '⏳' : '↻'}
          </button>
        </div>
        <button
          onClick={createDiagram}
          style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
        >
          + New Diagram
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem', fontSize: '15px' }}>
          ⏳ Loading diagrams…
        </div>
      ) : diagrams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ margin: 0, fontSize: '16px' }}>No diagrams yet.</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '14px' }}>
            Click <strong style={{ color: '#6366f1' }}>+ New Diagram</strong> to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {diagrams.map((diagram) => (
            <div
              key={diagram.id}
              onClick={() => navigate(`/editor/${diagram.id}`)}
              style={{
                background: '#1e293b', padding: '1.25rem', borderRadius: '10px',
                cursor: 'pointer', border: '1px solid #334155',
                transition: 'border-color 0.2s, transform 0.1s',
                position: 'relative',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Delete button */}
              <button
                onClick={(e) => deleteDiagram(e, diagram.id)}
                title="Delete diagram"
                style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: 'transparent', border: 'none', color: '#64748b',
                  cursor: 'pointer', fontSize: '14px', padding: '2px 5px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#1f2937'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
              >
                🗑
              </button>

              <h3 style={{ margin: '0 1.5rem 0.5rem 0', fontSize: '15px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {diagram.title || 'Untitled Diagram'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '0.25rem 0 0' }}>
                🕐 {new Date(diagram.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ color: '#475569', fontSize: '12px', margin: '0.25rem 0 0' }}>
                {diagram.nodes?.length ?? 0} nodes · {diagram.edges?.length ?? 0} edges
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
