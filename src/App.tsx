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

import { TextNode } from './components/TextNode';
import { Sidebar } from './components/Sidebar';
import { AddNodeMenu } from './components/AddNodeMenu';
import { useStore } from './store/flowStore';

const nodeTypes: NodeTypes = {
  flowNode: TextNode,
};

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
        fitView
      >
        <Background />
        <Controls />
        <AddNodeMenu />
      </ReactFlow>
      <Sidebar />
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