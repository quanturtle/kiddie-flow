import { Node, Edge } from 'reactflow';
import { NodeData, HandleConfig, NodeType } from './types';

// Keep track of the highest ID used so far
let highestId = 1;

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

export const getDefaultDescription = (type: NodeType) => {
  switch (type) {
    case 'text': return 'Transforms text input using template syntax';
    case 'image': return 'Processes image data';
    case 'voice': return 'Handles voice and audio processing';
    case 'javascript': return 'Executes JavaScript code';
    case 'python': return 'Runs Python code';
    case 'result': return 'Displays final output';
    case 'source': return 'Provides initial input data';
    case 'preview': return 'Shows live preview of changes';
    default: return '';
  }
};