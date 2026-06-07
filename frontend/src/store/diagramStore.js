import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { generateDiagram, modifyDiagram, saveDiagramVersion, listVersions, restoreVersion } from '../api/diagramApi';

// ── Color palette for nodes ───────────────────────────────────────────────────
const NODE_COLORS = [
  { bg: '#6366f1', border: '#4f46e5' }, // indigo
  { bg: '#8b5cf6', border: '#7c3aed' }, // violet
  { bg: '#06b6d4', border: '#0891b2' }, // cyan
  { bg: '#10b981', border: '#059669' }, // emerald
  { bg: '#f59e0b', border: '#d97706' }, // amber
  { bg: '#ef4444', border: '#dc2626' }, // red
  { bg: '#ec4899', border: '#db2777' }, // pink
  { bg: '#14b8a6', border: '#0d9488' }, // teal
];

let colorIndex = 0;
const getNextColor = () => {
  const color = NODE_COLORS[colorIndex % NODE_COLORS.length];
  colorIndex++;
  return color;
};

// ── Generate a stable diagram ID per session ──────────────────────────────────
const generateDiagramId = () =>
  `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── Initial welcome nodes ─────────────────────────────────────────────────────
const initialNodes = [
  {
    id: 'welcome',
    type: 'editableNode',
    position: { x: 300, y: 200 },
    data: { label: 'Welcome to FlowForge AI', color: { bg: '#6366f1', border: '#4f46e5' }, nodeType: 'process' },
  },
  {
    id: 'start-here',
    type: 'editableNode',
    position: { x: 100, y: 350 },
    data: { label: 'Click "Add Node" to begin', color: { bg: '#10b981', border: '#059669' }, nodeType: 'start' },
  },
  {
    id: 'connect',
    type: 'editableNode',
    position: { x: 520, y: 350 },
    data: { label: 'Drag handles to connect', color: { bg: '#06b6d4', border: '#0891b2' }, nodeType: 'process' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: 'welcome', target: 'start-here', type: 'smoothstep', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e1-3', source: 'welcome', target: 'connect',    type: 'smoothstep', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
];

// ── Default edge style applied to new AI-generated edges ─────────────────────
const ensureEdgeStyle = (edge) => ({
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  ...edge,
});

const ensureNodeType = (node) => ({
  ...node,
  type: 'editableNode',
});

const useDiagramStore = create((set, get) => ({
  // ── Core diagram state ──────────────────────────────────────────────────────
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  selectedEdgeId: null,
  diagramTitle: 'Untitled Diagram',
  nodeCounter: 4,

  // ── AI state ───────────────────────────────────────────────────────────────
  diagramId: generateDiagramId(),
  isLoading: false,
  aiError: null,
  aiMode: 'generate',          // 'generate' | 'modify'
  lastPrompt: '',

  // ── Version history ────────────────────────────────────────────────────────
  versions: [],
  versionsLoading: false,
  versionsSaveSuccess: false,

  // ── React Flow event handlers ──────────────────────────────────────────────
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#6366f1' },
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  // ── Selection ──────────────────────────────────────────────────────────────
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  setSelectedEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  // ── Node CRUD ──────────────────────────────────────────────────────────────
  addNode: (nodeType = 'process', position = null) => {
    const counter = get().nodeCounter;
    const color = getNextColor();
    const defaultLabels = { process: 'Process', decision: 'Decision', start: 'Start', end: 'End', database: 'Database', api: 'API' };
    const newNode = {
      id: `node-${counter}`,
      type: 'editableNode',
      position: position || { x: 150 + Math.random() * 400, y: 150 + Math.random() * 300 },
      data: { label: defaultLabels[nodeType] || 'New Node', color, nodeType },
    };
    set({ nodes: [...get().nodes, newNode], nodeCounter: counter + 1, selectedNodeId: newNode.id });
    return newNode.id;
  },

  removeNode: (nodeId) => {
    const id = nodeId || get().selectedNodeId;
    if (!id) return;
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: null,
    });
  },

  updateNodeLabel: (nodeId, newLabel) => {
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n) });
  },

  updateNodeDescription: (nodeId, description) => {
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, description, userEditedDescription: true } } : n) });
  },

  updateNodeColor: (nodeId, color) => {
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, color } } : n) });
  },

  updateNodeType: (nodeId, nodeType) => {
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, nodeType } } : n) });
  },

  removeEdge: (edgeId) => {
    const id = edgeId || get().selectedEdgeId;
    if (!id) return;
    set({ edges: get().edges.filter((e) => e.id !== id), selectedEdgeId: null });
  },

  toggleEdgeAnimation: (edgeId) => {
    set({ edges: get().edges.map((e) => e.id === edgeId ? { ...e, animated: !e.animated } : e) });
  },

  setDiagramTitle: (title) => set({ diagramTitle: title }),

  clearDiagram: () => set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null }),

  // ── Load / snapshot ────────────────────────────────────────────────────────
  loadDiagram: (id, title, nodes, edges) => {
    set({
      diagramId: id,
      diagramTitle: title,
      nodes: (nodes || []).map(ensureNodeType),
      edges: (edges || []).map(ensureEdgeStyle),
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  loadDiagramFromApi: async (id) => {
    set({ isLoading: true, aiError: null });
    try {
      const { api } = await import('./authStore');
      const res = await api.get(`/diagram/${id}`);
      const d = res.data;
      set({
        diagramId: d.id,
        diagramTitle: d.title,
        nodes: (d.nodes || []).map(ensureNodeType),
        edges: (d.edges || []).map(ensureEdgeStyle),
        isLoading: false,
      });
      get().fetchVersions();
    } catch (err) {
      set({ isLoading: false, aiError: 'Failed to load diagram' });
    }
  },

  autoSaveDiagram: async () => {
    const { diagramId, diagramTitle, nodes, edges, isLoading } = get();
    // Don't save if no diagram is loaded, or if we're still loading from API
    if (!diagramId || isLoading) return;
    try {
      const { api } = await import('./authStore');
      await api.put(`/diagram/${diagramId}`, {
        title: diagramTitle,
        nodes,
        edges,
      });
    } catch (err) {
      console.error('Auto-save failed', err);
    }
  },

  getDiagramSnapshot: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    return nodes.find((n) => n.id === selectedNodeId) || null;
  },

  getSelectedEdge: () => {
    const { edges, selectedEdgeId } = get();
    return edges.find((e) => e.id === selectedEdgeId) || null;
  },

  // ── AI Mode toggle ─────────────────────────────────────────────────────────
  setAiMode: (mode) => set({ aiMode: mode, aiError: null }),

  clearAiError: () => set({ aiError: null }),

  // ── Phase 2: Generate diagram from prompt ──────────────────────────────────
  generateFromPrompt: async (prompt) => {
    set({ isLoading: true, aiError: null, lastPrompt: prompt });
    try {
      const result = await generateDiagram(prompt);
      
      // Safety check to debug exactly what `result` is
      if (!result || !result.nodes) {
        throw new Error(`Unexpected API response: ${JSON.stringify(result)}`);
      }
      
      const nodes = result.nodes.map(ensureNodeType);
      const edges = result.edges.map(ensureEdgeStyle);
      set({
        nodes,
        edges,
        selectedNodeId: null,
        selectedEdgeId: null,
        isLoading: false,
        diagramTitle: prompt.slice(0, 50),
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI generation failed';
      set({ isLoading: false, aiError: msg });
      return { success: false, error: msg };
    }
  },

  // ── Phase 3: Incrementally modify existing diagram ─────────────────────────
  modifyWithPrompt: async (prompt) => {
    const snapshot = get().getDiagramSnapshot();
    set({ isLoading: true, aiError: null, lastPrompt: prompt });
    try {
      const delta = await modifyDiagram(prompt, snapshot);
      get().applyDiagramDelta(delta);
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI modification failed';
      set({ isLoading: false, aiError: msg });
      return { success: false, error: msg };
    }
  },

  // ── Phase 3: Apply delta — the core preservation logic ────────────────────
  applyDiagramDelta: (delta) => {
    const { nodes, edges } = get();
    const {
      nodes_to_add = [],
      edges_to_add = [],
      nodes_to_update = [],
      nodes_to_remove = [],
      edges_to_remove = [],
    } = delta;

    // 1. Remove nodes/edges if explicitly requested
    let updatedNodes = nodes.filter((n) => !nodes_to_remove.includes(n.id));
    let updatedEdges = edges.filter((e) => !edges_to_remove.includes(e.id));

    // 2. Update existing nodes — only data fields, NEVER position
    updatedNodes = updatedNodes.map((n) => {
      const update = nodes_to_update.find((u) => u.id === n.id);
      if (!update) return n;
      
      const newData = { ...n.data, ...(update.data || {}) };
      
      // Preserve manual description edits if present
      if (n.data.userEditedDescription) {
        newData.description = n.data.description;
        newData.userEditedDescription = true;
      }
      
      return {
        ...n,
        data: newData,
        // position is intentionally NOT updated — preserves manual layout
      };
    });

    // 3. Add new nodes (ensure correct type)
    const newNodes = nodes_to_add.map(ensureNodeType);
    updatedNodes = [...updatedNodes, ...newNodes];

    // 4. Add new edges (ensure style)
    const newEdges = edges_to_add.map((e) => ({
      ...ensureEdgeStyle(e),
      id: e.id || `e-${e.source}-${e.target}-${Date.now()}`,
    }));
    updatedEdges = [...updatedEdges, ...newEdges];

    set({ nodes: updatedNodes, edges: updatedEdges });
  },

  // ── Phase 4: Save version to MongoDB ──────────────────────────────────────
  saveVersion: async (label = '') => {
    const { nodes, edges, diagramId, diagramTitle } = get();
    set({ versionsLoading: true, versionsSaveSuccess: false });
    try {
      await saveDiagramVersion(diagramId, nodes, edges, diagramTitle, label);
      set({ versionsLoading: false, versionsSaveSuccess: true });
      // Refresh list
      await get().fetchVersions();
      setTimeout(() => set({ versionsSaveSuccess: false }), 2000);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Save failed';
      set({ versionsLoading: false, aiError: msg });
      return { success: false, error: msg };
    }
  },

  // ── Phase 4: Fetch versions list ──────────────────────────────────────────
  fetchVersions: async () => {
    const { diagramId } = get();
    set({ versionsLoading: true });
    try {
      const data = await listVersions(diagramId);
      set({ versions: data.versions || [], versionsLoading: false });
    } catch (err) {
      set({ versionsLoading: false });
    }
  },

  // ── Phase 4: Restore a saved version ──────────────────────────────────────
  restoreVersion: async (versionId) => {
    set({ versionsLoading: true });
    try {
      const data = await restoreVersion(versionId);
      // data.diagram is the saved version doc: { diagram_id, title, nodes, edges, ... }
      const versionDoc = data.diagram;
      const { diagram_id, title, nodes, edges } = versionDoc;
      // loadDiagram(id, title, nodes, edges) — all four args required
      get().loadDiagram(diagram_id, title, nodes, edges);
      set({ versionsLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Restore failed';
      set({ versionsLoading: false, aiError: msg });
      return { success: false, error: msg };
    }
  },
}));

export default useDiagramStore;
