import { Node, Edge } from 'reactflow';
import { NodeData, NodeType } from './types';
import { createDefaultHandles, generateUniqueNodeId, getDefaultDescription, getNodeOutput, isImageValue } from './nodeUtils';

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

const collectDownstream = (edges: Edge[], nodeId: string, acc: Set<string>): void => {
  // walk every edge out of nodeId so the whole downstream chain lands in acc
  edges
    .filter(edge => edge.source === nodeId)
    .forEach(edge => {
      if (edge.target && !acc.has(edge.target)) {
        acc.add(edge.target);
        collectDownstream(edges, edge.target, acc);
      }
    });
};

export const shiftDownstream = (nodes: Node<NodeData>[], edges: Edge[], pivotId: string, dx: number): Node<NodeData>[] => {
  // open/close room on expand/collapse by sliding only the pivot's own downstream chain: the
  // pivot and everything after it in its pipeline travel together, so their edges keep their
  // length and no node in a parallel pipeline is disturbed.
  const downstream = new Set<string>();
  collectDownstream(edges, pivotId, downstream);
  return nodes.map(n =>
    downstream.has(n.id)
      ? { ...n, position: { x: n.position.x + dx, y: n.position.y } }
      : n
  );
};

const DEFAULT_NODE_WIDTH = 300;
const DEFAULT_NODE_HEIGHT = 150;

const horizontallyOverlap = (a: Node<NodeData>, b: Node<NodeData>): boolean => {
  const aWidth = a.width ?? DEFAULT_NODE_WIDTH;
  const bWidth = b.width ?? DEFAULT_NODE_WIDTH;
  return a.position.x < b.position.x + bWidth && b.position.x < a.position.x + aWidth;
};

const collectBelowOverlap = (nodes: Node<NodeData>[], pivotId: string, dH: number): Set<string> => {
  // flood down from the pivot: a node whose top sits inside a mover's vertical span and shares its
  // column must drop too, so the pivot's downward growth never lands on top of another node.
  const pivot = nodes.find(n => n.id === pivotId);
  const push = new Set<string>();
  if (!pivot) return push;

  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of nodes) {
      if (candidate.id === pivotId || push.has(candidate.id)) continue;
      const top = candidate.position.y;

      // overlapped from above by the taller pivot itself
      const underPivot =
        horizontallyOverlap(pivot, candidate) &&
        top > pivot.position.y &&
        top < pivot.position.y + (pivot.height ?? DEFAULT_NODE_HEIGHT);

      // or overlapped by an already-pushed node once it has dropped by dH
      let underPushed = false;
      if (!underPivot) {
        for (const id of push) {
          const mover = nodes.find(n => n.id === id);
          if (!mover) continue;
          if (
            horizontallyOverlap(mover, candidate) &&
            top > mover.position.y &&
            top < mover.position.y + (mover.height ?? DEFAULT_NODE_HEIGHT) + dH
          ) {
            underPushed = true;
            break;
          }
        }
      }

      if (underPivot || underPushed) {
        push.add(candidate.id);
        changed = true;
      }
    }
  }
  return push;
};

export const applyExpansion = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  pivotId: string,
  dW: number,
  dH: number
): Node<NodeData>[] => {
  // grow-right: slide the pivot's downstream chain right so those edges keep their length
  const widened = shiftDownstream(nodes, edges, pivotId, dW);
  if (dH <= 0) return widened;

  // grow-down: drop the nodes the taller pivot now overlaps (and their column) by the same dH,
  // dragging each displaced node's downstream chain along so its outgoing edges stay level
  const pushDown = collectBelowOverlap(widened, pivotId, dH);
  const dragged = new Set(pushDown);
  pushDown.forEach(id => collectDownstream(edges, id, dragged));
  dragged.delete(pivotId);
  return widened.map(n =>
    dragged.has(n.id)
      ? { ...n, position: { x: n.position.x, y: n.position.y + dH } }
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

const reconcileImageNode = (node: Node<NodeData>, edges: Edge[]): Node<NodeData> => {
  // an image node shapes itself to its role: with its own uploaded image and nothing feeding
  // it, it is a loader that emits downstream (output handle only); otherwise it receives an
  // image to preview (input handle only, no play button, no upload box).
  const hasIncoming = edges.some(edge => edge.target === node.id);
  const isLoader = !hasIncoming && isImageValue(node.data.text);
  const inputHandles = isLoader ? [] : createDefaultHandles(1, 'input');
  const outputHandles = isLoader ? createDefaultHandles(1, 'output') : [];
  return {
    ...node,
    data: {
      ...node.data,
      inputs: inputHandles.length,
      outputs: outputHandles.length,
      inputHandles,
      outputHandles,
    },
  };
};

export const reconcileImageNodes = (nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] => {
  return nodes.map(node => (node.data.type === 'image' ? reconcileImageNode(node, edges) : node));
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
      text: type === 'result' || type === 'preview' || type === 'image' ? '' : `${type} ${id}`,
      createdAt: new Date().toISOString(),
      onChange: (text: string) => updateNodeData(id, text),
      type,
      // a fresh image node starts empty: it can receive an image (input) or load one; the
      // output handle only appears once it holds its own image (see reconcileImageNodes).
      inputs: type === 'source' ? 0 : 1,
      outputs: type === 'result' || type === 'image' ? 0 : 1,
      inputValues: {},
      inputHandles: createDefaultHandles(type === 'source' ? 0 : 1, 'input'),
      outputHandles: createDefaultHandles(type === 'result' || type === 'image' ? 0 : 1, 'output'),
      showInputs: false,
      showOutput: false,
      isCollapsed: false,
    },
  };
};