import { api } from '../store/authStore';

// Phase 2: Generate diagram from prompt
export const generateDiagram = async (prompt) => {
  const response = await api.post('/generate-diagram', { prompt });
  return response.data;
};

// Phase 3: Modify existing diagram with prompt — returns delta
export const modifyDiagram = async (prompt, currentDiagram) => {
  const response = await api.post('/modify-diagram', {
    prompt,
    current_diagram: currentDiagram,
  });
  return response.data;
};

// Phase 4: Save diagram version
export const saveDiagramVersion = async (diagramId, nodes, edges, title, versionLabel = '') => {
  const response = await api.post('/versions/save', {
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
  const response = await api.get(`/versions/${diagramId}`);
  return response.data;
};

// Phase 4: Restore version
export const restoreVersion = async (versionId) => {
  const response = await api.get(`/versions/restore/${versionId}`);
  return response.data;
};
