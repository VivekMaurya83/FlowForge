import { useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toolbar from '../components/Toolbar';
import Sidebar from '../components/Sidebar';
import DiagramCanvas from '../components/DiagramCanvas';
import PromptBox from '../components/PromptBox';
import useDiagramStore from '../store/diagramStore';

export default function EditorPage() {
  const { diagramId } = useParams();
  const { nodes, edges, addNode, loadDiagramFromApi, autoSaveDiagram } = useDiagramStore();

  const handleAddNode = useCallback(
    (type) => {
      addNode(type);
    },
    [addNode]
  );

  useEffect(() => {
    if (diagramId) {
      loadDiagramFromApi(diagramId);
    }
  }, [diagramId, loadDiagramFromApi]);

  // Debounced Auto-Save (fires 1.5s after last change)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0) {
        autoSaveDiagram();
      }
    }, 1500);
    // Cleanup: cancel debounce timer on unmount/re-run
    return () => clearTimeout(timer);
  }, [nodes, edges, autoSaveDiagram]);

  // Save-on-unmount: fires when navigating away from editor.
  // This guarantees the latest diagram state is persisted even if
  // the user navigates back to dashboard before the 1.5s debounce fires.
  useEffect(() => {
    return () => {
      const { nodes: currentNodes, diagramId: currentId } = useDiagramStore.getState();
      if (currentId && currentNodes.length > 0) {
        useDiagramStore.getState().autoSaveDiagram();
      }
    };
  }, []);

  return (
    <ReactFlowProvider>
      <div className="app-shell">
        {/* Top navbar */}
        <Navbar />

        {/* Main content area */}
        <div className="app-body">
          {/* Left toolbar */}
          <Toolbar onAddNode={handleAddNode} />

          {/* Center canvas */}
          <main className="canvas-area">
            <DiagramCanvas onAddNode={handleAddNode} />
          </main>

          {/* Right sidebar */}
          <Sidebar />
        </div>

        {/* Bottom prompt bar */}
        <PromptBox />
      </div>
    </ReactFlowProvider>
  );
}
