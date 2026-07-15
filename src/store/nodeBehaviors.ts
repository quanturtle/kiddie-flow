import { NodeType } from './types';

// One place that answers "how does this node type behave?" — the capabilities and defaults that
// were previously scattered as ad-hoc string comparisons across the store and components.
// Presentation (icons, colours) stays in the theme layer so this module holds no UI dependency.

export type NodeBehavior = {
  // display nodes mirror their inputs by concatenating them into their own text
  isDisplay: boolean;
  // runnable nodes execute their body on demand (their output is whatever the run produced)
  isRunnable: boolean;
  // nodes whose output is produced on a manual trigger, so the header shows a Play/Run button
  hasManualAction: boolean;
  // whether the config panel lets the user change the output count (a result node is a terminal sink)
  configurableOutputs: boolean;
  // handle counts a freshly-added node starts with
  defaultInputs: number;
  defaultOutputs: number;
  description: string;
};

export const nodeBehaviors: Record<NodeType, NodeBehavior> = {
  text: {
    isDisplay: false,
    isRunnable: false,
    hasManualAction: true,
    configurableOutputs: true,
    defaultInputs: 1,
    defaultOutputs: 1,
    description: 'Transforms text input using template syntax',
  },
  image: {
    isDisplay: false,
    isRunnable: false,
    hasManualAction: false,
    configurableOutputs: true,
    defaultInputs: 1,
    defaultOutputs: 0,
    description: 'Processes image data',
  },
  voice: {
    isDisplay: false,
    isRunnable: false,
    hasManualAction: true,
    configurableOutputs: true,
    defaultInputs: 1,
    defaultOutputs: 1,
    description: 'Scaffolding — audio processing not wired to execution yet',
  },
  javascript: {
    isDisplay: false,
    isRunnable: false,
    hasManualAction: true,
    configurableOutputs: true,
    defaultInputs: 1,
    defaultOutputs: 1,
    description: 'Scaffolding — runs as a text template; no JS engine yet',
  },
  python: {
    isDisplay: false,
    isRunnable: true,
    hasManualAction: true,
    configurableOutputs: true,
    defaultInputs: 1,
    defaultOutputs: 1,
    description: 'Runs Python code',
  },
  result: {
    isDisplay: true,
    isRunnable: false,
    hasManualAction: false,
    configurableOutputs: false,
    defaultInputs: 1,
    defaultOutputs: 0,
    description: 'Displays final output',
  },
  source: {
    isDisplay: false,
    isRunnable: false,
    hasManualAction: false,
    configurableOutputs: true,
    defaultInputs: 0,
    defaultOutputs: 1,
    description: 'Provides initial input data',
  },
  preview: {
    isDisplay: true,
    isRunnable: false,
    hasManualAction: false,
    configurableOutputs: true,
    defaultInputs: 1,
    defaultOutputs: 1,
    description: 'Shows live preview of changes',
  },
};
