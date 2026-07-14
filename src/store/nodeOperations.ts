import { Node, Edge } from 'reactflow';
import { NodeData, NodeType, SourceInputType } from './types';
import { createDefaultHandles, generateUniqueNodeId, getDefaultDescription, getNodeOutput } from './nodeUtils';

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

      node.data.inputValues[edge.targetHandle] = getNodeOutput(sourceNode);
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

export const shiftDownstream = (nodes: Node<NodeData>[], pivotId: string, dx: number): Node<NodeData>[] => {
  // move every node to the right of the pivot by dx (used to open/close room on expand/collapse)
  const pivot = nodes.find(n => n.id === pivotId);
  if (!pivot) return nodes;
  const pivotX = pivot.position.x;
  return nodes.map(n =>
    n.id !== pivotId && n.position.x > pivotX
      ? { ...n, position: { x: n.position.x + dx, y: n.position.y } }
      : n
  );
};

const visitAncestors = (
  nodeId: string,
  nodes: Node<NodeData>[],
  edges: Edge[],
  visited: Set<string>,
  order: string[]
): void => {
  if (visited.has(nodeId)) return;
  visited.add(nodeId);

  // visit every parent first so ancestors run before their descendants
  edges
    .filter(edge => edge.target === nodeId)
    .forEach(edge => visitAncestors(edge.source, nodes, edges, visited, order));

  const node = nodes.find(n => n.id === nodeId);
  if (node && node.data.type === 'python') {
    order.push(nodeId);
  }
};

export const collectPythonRunOrder = (nodes: Node<NodeData>[], edges: Edge[], targetId: string): string[] => {
  // python nodes to run to produce targetId's value: its python ancestors, then itself
  const order: string[] = [];
  visitAncestors(targetId, nodes, edges, new Set<string>(), order);
  return order;
};

export const buildExecutableCode = (nodes: Node<NodeData>[], edges: Edge[], nodeId: string): string => {
  // prepend the definitions of every python ancestor so upstream dataclasses are in scope
  return collectPythonRunOrder(nodes, edges, nodeId)
    .map(id => nodes.find(n => n.id === id)?.data.text ?? '')
    .join('\n\n\n');
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