import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s for Gemini which can be slow
});

// Phase 2: Generate diagram from prompt
export const generateDiagram = async (prompt) => {
  const response = await api.post('/api/generate-diagram', { prompt });
  return response.data;
};

// Phase 3: Modify existing diagram with prompt — returns delta
export const modifyDiagram = async (prompt, currentDiagram) => {
  const response = await api.post('/api/modify-diagram', {
    prompt,
    current_diagram: currentDiagram,
  });
  return response.data;
};

// Phase 4: Save diagram version
export const saveDiagramVersion = async (diagramId, nodes, edges, title, versionLabel = '') => {
  const response = await api.post('/api/versions/save', {
    diagram_id: diagramId,
    nodes,
    edges,
    title,
    version_label: versionLabel,
  });
  return response.data;
};

// Phase 4: List versions
export const listVersions = async (diagramId) => {
  const response = await api.get(`/api/versions/${diagramId}`);
  return response.data;
};

// Phase 4: Restore version
export const restoreVersion = async (versionId) => {
  const response = await api.get(`/api/versions/restore/${versionId}`);
  return response.data;
};

export default api;
