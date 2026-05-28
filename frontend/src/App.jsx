import { useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Navbar from './components/Navbar';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import DiagramCanvas from './components/DiagramCanvas';
import PromptBox from './components/PromptBox';
import useDiagramStore from './store/diagramStore';
import './App.css';

export default function App() {
  const { addNode } = useDiagramStore();

  const handleAddNode = useCallback(
    (type) => {
      addNode(type);
    },
    [addNode]
  );

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

        {/* Bottom prompt bar — Phase 2+ fully active */}
        <PromptBox />
      </div>
    </ReactFlowProvider>
  );
}

