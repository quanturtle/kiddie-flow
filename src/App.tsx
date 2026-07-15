import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  NodeTypes,
  NodeMouseHandler,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HelpCircle, Github } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { FlowNode } from './components/FlowNode';
import { Sidebar } from './components/Sidebar';
import { AddNodeMenu } from './components/AddNodeMenu';
import { useStore } from './store/flowStore';
import { CANVAS_BG, CANVAS_DOT } from './theme/nodeTheme';

const nodeTypes: NodeTypes = {
  flowNode: FlowNode,
};

// Default viewport that shows all demo nodes
const defaultViewport = { x: 400, y: 175, zoom: 0.85 };

// Bold black connections to match the Classic Pop frames
const defaultEdgeOptions = { style: { stroke: '#000000', strokeWidth: 2.5 } };

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

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    // If sidebar is already open, switch context to the clicked node
    if (selectedNode !== null) {
      setSelectedNode(node.id);
    }
  };

  const handleNodeDoubleClick: NodeMouseHandler = (_, node) => {
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
    <div className="w-screen h-screen" style={{ backgroundColor: CANVAS_BG }}>
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
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color={CANVAS_DOT} />
        <Controls />
        <AddNodeMenu />

        {/* Help button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleHelpClick}
            className="p-2 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Top-right actions */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <a
            href="https://github.com/quanturtle/kiddie-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center"
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