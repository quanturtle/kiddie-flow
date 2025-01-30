import { Node, Edge } from 'reactflow';
import { NodeData, NodeType, SourceInputType } from './types';
import { createDefaultHandles, processNodeText, generateUniqueNodeId, getDefaultDescription } from './nodeUtils';

export const updateDownstreamNodes = (nodes: Node<NodeData>[], edges: Edge[], sourceNodeId: string): Node<NodeData>[] => {
  const updatedNodes = [...nodes];
  const visited = new Set<string>();

  const updateNode = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = updatedNodes[nodeIndex];
    const incomingEdges = edges.filter(edge => edge.target === nodeId);

    incomingEdges.forEach(edge => {
      if (!edge.sourceHandle || !edge.targetHandle) return;

      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      if (!sourceNode) return;

      const processedText = processNodeText(
        sourceNode.data.text,
        sourceNode.data.inputValues,
        sourceNode.data.inputHandles
      );

      node.data.inputValues[edge.targetHandle] = processedText;
    });

    if (node.data.type === 'result' || node.data.type === 'preview') {
      node.data.text = Object.values(node.data.inputValues).join('\n\n');
    }

    updatedNodes[nodeIndex] = node;

    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    outgoingEdges.forEach(edge => {
      if (edge.target) {
        updateNode(edge.target);
      }
    });
  };

  updateNode(sourceNodeId);
  return updatedNodes;
};

export const createNewNode = (type: NodeType, lastNode: Node<NodeData>, updateNodeData: (id: string, text: string) => void): Node<NodeData> => {
  const id = generateUniqueNodeId([lastNode]);
  
  const position = {
    x: lastNode.position.x + 50,
    y: lastNode.position.y + 50,
  };

  return {
    id,
    type: 'flowNode',
    position,
    data: {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${id}`,
      description: getDefaultDescription(type),
      showDescription: true,
      text: type === 'result' || type === 'preview' ? '' : `${type} ${id}`,
      createdAt: new Date().toISOString(),
      onChange: (text: string) => updateNodeData(id, text),
      type,
      inputs: type === 'result' || type === 'preview' ? 1 : type === 'source' ? 0 : 1,
      outputs: type === 'result' ? 0 : 1,
      inputValues: {},
      inputHandles: createDefaultHandles(type === 'result' || type === 'preview' ? 1 : type === 'source' ? 0 : 1, 'input'),
      outputHandles: createDefaultHandles(type === 'result' ? 0 : 1, 'output'),
      showInputs: false,
      showOutput: false,
      isCollapsed: false,
      ...(type === 'source' && { sourceType: 'text' as SourceInputType }),
    },
  };
};