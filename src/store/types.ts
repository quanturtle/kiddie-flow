import { Node, Edge } from 'reactflow';

export type NodeType = 'text' | 'image' | 'voice' | 'javascript' | 'python' | 'result' | 'source' | 'preview';
export type SourceInputType = 'text' | 'image' | 'voice';

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
  onChange: (text: string) => void;
  type: NodeType;
  inputs: number;
  outputs: number;
  inputValues: Record<string, string>;
  inputHandles: Array<HandleConfig>;
  outputHandles: Array<HandleConfig>;
  sourceType?: SourceInputType;
  imageUrl?: string;
  audioUrl?: string;
  showInputs?: boolean;
  showOutput?: boolean;
  isCollapsed?: boolean;
};