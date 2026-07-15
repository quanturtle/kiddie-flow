import { Node } from 'reactflow';
import { NodeData, HandleConfig, NodeType } from './types';
import { nodeBehaviors } from './nodeBehaviors';

// Keep track of the highest ID used so far
let highestId = 1;

export const isImageValue = (value?: string): boolean => !!value && value.startsWith('data:image');

export const createDefaultHandles = (count: number, prefix: string): HandleConfig[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    label: `${prefix}_${i + 1}`,
  }));
};

export const processNodeText = (text: string, inputValues: Record<string, string>, inputHandles: Array<HandleConfig>) => {
  let processedText = text;
  inputHandles.forEach(handle => {
    const value = inputValues[handle.id];
    if (value !== undefined) {
      const regex = new RegExp(`{${handle.label}}`, 'g');
      processedText = processedText.replace(regex, value);
    }
  });
  return processedText;
};

export const deriveNodeText = (type: NodeType, inputValues: Record<string, string>, currentText: string): string =>
  // display nodes mirror their inputs by concatenating them; every other node keeps its own text
  nodeBehaviors[type].isDisplay ? Object.values(inputValues).join('\n\n') : currentText;

export const generateUniqueNodeId = (nodes: Node[]): string => {
  // Get all existing numeric IDs
  const existingIds = new Set(
    nodes
      .map(node => parseInt(node.id))
      .filter(id => !isNaN(id))
  );

  // Update highestId if we find a higher ID in existing nodes
  existingIds.forEach(id => {
    if (id > highestId) {
      highestId = id;
    }
  });

  // Increment highestId until we find an unused ID
  do {
    highestId++;
  } while (existingIds.has(highestId));

  return highestId.toString();
};

export const getNodeOutput = (node: Node<NodeData>): string => {
  // a runnable node emits whatever its last run produced; everything else templates its text
  if (nodeBehaviors[node.data.type].isRunnable) {
    return node.data.computedOutput ?? '';
  }
  return processNodeText(node.data.text, node.data.inputValues, node.data.inputHandles);
};

export const getPythonArgs = (data: NodeData): string[] => {
  // inputs passed positionally to the node's function, in handle order
  return data.inputHandles.map(handle => data.inputValues[handle.id] ?? '');
};

export const toPythonFunctionName = (title: string): string => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const safe = slug || 'run';
  return /^[0-9]/.test(safe) ? `_${safe}` : safe;
};

export const getDefaultDescription = (type: NodeType): string => nodeBehaviors[type].description;