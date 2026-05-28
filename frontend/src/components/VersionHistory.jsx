import { useEffect, useCallback } from 'react';
import useDiagramStore from '../store/diagramStore';

function formatTimestamp(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function VersionHistory() {
  const {
    versions,
    versionsLoading,
    versionsSaveSuccess,
    saveVersion,
    fetchVersions,
    restoreVersion,
    diagramId,
    nodes,
  } = useDiagramStore();

  useEffect(() => {
    fetchVersions();
  }, [diagramId]);

  const handleSave = useCallback(async () => {
    const label = `v${versions.length + 1}`;
    await saveVersion(label);
  }, [saveVersion, versions.length]);

  return (
    <div className="version-history">
      <div className="version-save-row">
        <button
          id="save-version-btn"
          className={`save-version-btn ${versionsSaveSuccess ? 'success' : ''}`}
          onClick={handleSave}
          disabled={versionsLoading || nodes.length === 0}
          title="Save current diagram as a version snapshot"
        >
          {versionsLoading ? (
            <span className="btn-spinner small" />
          ) : versionsSaveSuccess ? (
            '✓ Saved!'
          ) : (
            '💾 Save Version'
          )}
        </button>
      </div>

      {versions.length === 0 && !versionsLoading && (
        <div className="no-versions">
          <div className="no-versions-icon">📋</div>
          <p className="no-versions-text">No saved versions yet.</p>
          <p className="no-versions-hint">Click "Save Version" to create a snapshot.</p>
        </div>
      )}

      {versionsLoading && versions.length === 0 && (
        <div className="versions-loading">Loading history…</div>
      )}

      <div className="versions-list">
        {versions.map((v, i) => (
          <div key={v._id} className="version-item">
            <div className="version-info">
              <span className="version-label">
                {v.version_label || `Version ${versions.length - i}`}
              </span>
              <span className="version-title" title={v.title}>{v.title}</span>
              <span className="version-time">{formatTimestamp(v.timestamp)}</span>
              <span className="version-stats">
                {v.nodes?.length ?? 0} nodes · {v.edges?.length ?? 0} edges
              </span>
            </div>
            <button
              id={`restore-version-${v._id}`}
              className="restore-btn"
              onClick={() => restoreVersion(v._id)}
              disabled={versionsLoading}
              title="Restore this version"
            >
              ↩ Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
