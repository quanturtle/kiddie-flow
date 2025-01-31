import { Node, Edge } from 'reactflow';
import { NodeData } from './types';
import { createDefaultHandles } from './nodeUtils';

// Initial nodes setup with waterfall layout
export const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'flowNode',
    position: { x: -50, y: -50 },
    data: {
      title: 'Some Text File',
      description: 'A source node containing some text',
      showDescription: false,
      text: '@quanturtle',
      createdAt: new Date().toISOString(),
      onChange: (text: string) => {},  // Will be updated after store creation
      type: 'source',
      inputs: 0,
      outputs: 1,
      inputValues: {},
      inputHandles: [],
      outputHandles: createDefaultHandles(1, 'output'),
      showInputs: false,
      showOutput: false,
      isCollapsed: true,
    },
  },
  {
    id: '2',
    type: 'flowNode',
    position: { x: 400, y: 100 },
    data: {
      title: 'My Text Node',
      description: 'Transforms the input text',
      showDescription: false,
      text: "Hola, I'm {input_1}",
      createdAt: new Date().toISOString(),
      onChange: (text: string) => {},
      type: 'text',
      inputs: 1,
      outputs: 1,
      inputValues: {},
      inputHandles: createDefaultHandles(1, 'input'),
      outputHandles: createDefaultHandles(1, 'output'),
      showInputs: false,
      showOutput: false,
      isCollapsed: false,
    },
  },
  {
    id: '3',
    type: 'flowNode',
    position: { x: 825, y: 200 },
    data: {
      title: 'Preview',
      description: 'Shows a preview of the transformed text',
      showDescription: false,
      text: '',
      createdAt: new Date().toISOString(),
      onChange: (text: string) => {},
      type: 'preview',
      inputs: 1,
      outputs: 1,
      inputValues: {},
      inputHandles: createDefaultHandles(1, 'input'),
      outputHandles: createDefaultHandles(1, 'output'),
      showInputs: false,
      showOutput: false,
      isCollapsed: true,
    },
  },
  {
    id: '4',
    type: 'flowNode',
    position: { x: 1250, y: 350 },
    data: {
      title: 'Result',
      description: 'Displays the final result',
      showDescription: false,
      text: '',
      createdAt: new Date().toISOString(),
      onChange: (text: string) => {},
      type: 'result',
      inputs: 1,
      outputs: 0,
      inputValues: {},
      inputHandles: createDefaultHandles(1, 'input'),
      outputHandles: [],
      showInputs: false,
      showOutput: false,
      isCollapsed: false,
    },
  },
];

// Initial edges setup
export const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'output1',
    targetHandle: 'input1',
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    sourceHandle: 'output1',
    targetHandle: 'input1',
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    sourceHandle: 'output1',
    targetHandle: 'input1',
  },
];