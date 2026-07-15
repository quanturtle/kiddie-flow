import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';

export type NodeType = 'text' | 'image' | 'voice' | 'javascript' | 'python' | 'result' | 'source' | 'preview';

export type HandleConfig = {
  id: string;
  label: string;
};

export type NodeData = {
  title: string;
  description: string;
  showDescription: boolean;
  text: string;
  createdAt: string;
  type: NodeType;
  inputs: number;
  outputs: number;
  inputValues: Record<string, string>;
  inputHandles: Array<HandleConfig>;
  outputHandles: Array<HandleConfig>;
  showInputs?: boolean;
  showOutput?: boolean;
  isCollapsed?: boolean;
  // explicit box size once the user has dragged the resize corner; unset means size-to-content
  width?: number;
  height?: number;
  // execution state for runnable nodes (python)
  computedOutput?: string;
  isRunning?: boolean;
  runError?: string;
};

export type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: string | null;
  pendingExpand: { id: string; baseWidth: number; baseHeight: number } | null;
  preExpandLayout: Record<string, Record<string, { x: number; y: number }>>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (nodeId: string, text: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Partial<NodeData>) => void;
  resizeNode: (nodeId: string, width: number, height: number) => void;
  toggleCollapse: (nodeId: string) => void;
  addNode: (type: NodeType) => void;
  updateInputValue: (nodeId: string, inputId: string, value: string) => void;
  updateHandleLabel: (nodeId: string, handleId: string, newLabel: string, isInput: boolean) => void;
  removeLastInput: (nodeId: string) => void;
  runPythonNode: (nodeId: string) => Promise<void>;
};