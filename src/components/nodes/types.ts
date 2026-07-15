import React from 'react';
import { NodeData } from '../../store/types';

// The surface every node body receives from the shell. Bodies derive anything type-specific
// (templated output, image role, python signature) from this rather than the shell computing it.
export interface NodeBodyProps {
  id: string;
  data: NodeData;
  localText: string;
  hasIncomingEdge: boolean;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onAddInput: () => void;
  onRemoveLastInput: () => void;
  onToggleInputs: () => void;
  onToggleOutput: () => void;
}

// How a single node type renders, resolved from the type instead of switched inline in the shell.
export interface NodeRenderer {
  // pixel floor the resize corner enforces
  minWidth: number;
  minHeight: number;
  // min width of the inner content column, which differs collapsed vs expanded
  columnMinWidth: { collapsed: number; expanded: number };
  // the expanded body below the header
  Body: React.FC<NodeBodyProps>;
  // optional chips shown under the header title while the node is collapsed (python signature/output)
  CollapsedExtras?: React.FC<NodeBodyProps>;
  // whether the resize corner shows; defaults to true when omitted (image gates on holding an image)
  showsResizeHandle?: (data: NodeData, hasIncomingEdge: boolean) => boolean;
}
