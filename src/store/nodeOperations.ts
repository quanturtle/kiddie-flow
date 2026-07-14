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

export const collectDownstream = (edges: Edge[], nodeId: string, acc: Set<string>): void => {
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
const PUSH_GAP = 32; // breathing room kept below the expanded node

type LayoutBox = { left: number; right: number; top: number; bottom: number };

const boxOf = (node: Node<NodeData>, drop: number): LayoutBox => ({
  left: node.position.x,
  right: node.position.x + (node.width ?? DEFAULT_NODE_WIDTH),
  top: node.position.y + drop,
  bottom: node.position.y + drop + (node.height ?? DEFAULT_NODE_HEIGHT),
});

const boxesOverlap = (a: LayoutBox, b: LayoutBox): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const handleY = (node: Node<NodeData>, drop: number): number =>
  node.position.y + drop + (node.height ?? DEFAULT_NODE_HEIGHT) / 2;

const segmentHitsBox = (ax: number, ay: number, bx: number, by: number, box: LayoutBox): boolean => {
  // Liang–Barsky: true when any part of segment a→b lies inside the box
  const dx = bx - ax;
  const dy = by - ay;
  const p = [-dx, dx, -dy, dy];
  const q = [ax - box.left, box.right - ax, ay - box.top, box.bottom - ay];
  let enter = 0;
  let exit = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) enter = Math.max(enter, t);
      else exit = Math.min(exit, t);
    }
  }
  return enter <= exit;
};

const bumpDrop = (drops: Map<string, number>, id: string, value: number): boolean => {
  if (value > (drops.get(id) ?? 0)) {
    drops.set(id, value);
    return true;
  }
  return false;
};

const dropWithChildren = (drops: Map<string, number>, edges: Edge[], pivotId: string, id: string, value: number): boolean => {
  // a displaced node drags its downstream chain by the same amount so its outgoing edges stay level
  let changed = bumpDrop(drops, id, value);
  const chain = new Set<string>();
  collectDownstream(edges, id, chain);
  chain.forEach(childId => {
    if (childId !== pivotId && bumpDrop(drops, childId, value)) changed = true;
  });
  return changed;
};

const resolveDrops = (nodes: Node<NodeData>[], edges: Edge[], pivotId: string): Map<string, number> => {
  // decide how far each node must drop so the expanded pivot overlaps neither a node nor an edge;
  // drops only ever grow, so iterating to a fixed point settles in a few passes.
  const pivot = nodes.find(n => n.id === pivotId);
  const drops = new Map<string, number>();
  if (!pivot) return drops;
  const pivotBox = boxOf(pivot, 0);

  let changed = true;
  let guard = 0;
  while (changed && guard < 16) {
    changed = false;
    guard++;

    // a node the growing (or an already-displaced) box now covers slides down just far enough to clear it
    for (const node of nodes) {
      if (node.id === pivotId) continue;
      const drop = drops.get(node.id) ?? 0;
      const box = boxOf(node, drop);
      let target = drop;

      if (node.position.y > pivot.position.y && boxesOverlap(pivotBox, box)) {
        target = Math.max(target, pivotBox.bottom + PUSH_GAP - node.position.y);
      }
      for (const [moverId, moverDrop] of drops) {
        if (moverId === node.id) continue;
        const mover = nodes.find(n => n.id === moverId);
        if (!mover) continue;
        const moverBox = boxOf(mover, moverDrop);
        if (box.top > moverBox.top && boxesOverlap(moverBox, box)) {
          target = Math.max(target, moverBox.bottom + PUSH_GAP - node.position.y);
        }
      }
      if (dropWithChildren(drops, edges, pivotId, node.id, target)) changed = true;
    }

    // an edge the growing box now crosses drops its target chain until the edge routes clear
    for (const edge of edges) {
      if (edge.source === pivotId || edge.target === pivotId) continue;
      const source = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!source || !targetNode || targetNode.position.y < pivot.position.y) continue;
      const ax = source.position.x + (source.width ?? DEFAULT_NODE_WIDTH);
      const ay = handleY(source, drops.get(source.id) ?? 0);
      const bx = targetNode.position.x;
      const by = handleY(targetNode, drops.get(targetNode.id) ?? 0);
      if (segmentHitsBox(ax, ay, bx, by, pivotBox)) {
        const cleared = (drops.get(targetNode.id) ?? 0) + (pivotBox.bottom + PUSH_GAP - by);
        if (dropWithChildren(drops, edges, pivotId, targetNode.id, cleared)) changed = true;
      }
    }
  }
  return drops;
};

export const pushOverlaps = (nodes: Node<NodeData>[], edges: Edge[], pivotId: string): Node<NodeData>[] => {
  // drop the nodes and edges the pivot's current box now overlaps, only as far as needed, without
  // moving the pivot itself — used both by expansion and when a node reshapes on its own
  const drops = resolveDrops(nodes, edges, pivotId);
  return nodes.map(n => {
    const drop = drops.get(n.id);
    return drop ? { ...n, position: { x: n.position.x, y: n.position.y + drop } } : n;
  });
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

  // grow-down: drop the nodes and edges the taller box now overlaps, only as far as needed
  return pushOverlaps(widened, edges, pivotId);
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