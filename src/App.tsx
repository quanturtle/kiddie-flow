import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  NodeTypes,
  OnNodeClick,
  OnNodeDoubleClick,
  Node,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HelpCircle, Github } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { TextNode } from './components/TextNode';
import { Sidebar } from './components/Sidebar';
import { AddNodeMenu } from './components/AddNodeMenu';
import { useStore } from './store/flowStore';

const nodeTypes: NodeTypes = {
  flowNode: TextNode,
};

// Default viewport that shows all demo nodes
const defaultViewport = { x: 400, y: 175, zoom: 0.85 };

function Flow() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    selectedNode,
  } = useStore();

  const { getNode } = useReactFlow();

  const handleNodeClick: OnNodeClick = (_, node) => {
    // If sidebar is already open, switch context to the clicked node
    if (selectedNode !== null) {
      setSelectedNode(node.id);
    }
  };

  const handleNodeDoubleClick: OnNodeDoubleClick = (_, node) => {
    // Always open sidebar on double click
    setSelectedNode(node.id);
  };

  const handlePaneClick = () => {
    // Close sidebar when clicking on empty canvas
    setSelectedNode(null);
  };

  const handleHelpClick = () => {
    toast('Welcome to Kiddie Flow!', {
      description: 'Double-click any node to edit its properties. Connect nodes by dragging between handles.',
      position: 'bottom-center',
    });
  };

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
      >
        <Background />
        <Controls />
        <AddNodeMenu />

        {/* Help button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleHelpClick}
            className="p-2 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* GitHub button */}
        <div className="absolute top-4 right-4 z-10">
          <a
            href="https://github.com/quanturtle/kiddie-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center"
            title="View on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </ReactFlow>
      <Sidebar />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;