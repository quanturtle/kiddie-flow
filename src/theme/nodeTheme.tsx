import { Type, Image, Mic, Braces, Code, Sparkles, Eye, FileOutput, LucideIcon } from 'lucide-react';
import { NodeType } from '../store/types';

// Classic Pop design tokens — the single source of truth for how nodes look.
// Bright saturated grounds on crisp black frames with hard offset shadows.

export const HARD_SHADOW = 'shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]';
export const SOFT_SHADOW = 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
export const ACCENT = 'bg-lime-300 hover:bg-lime-400';

// The dotted canvas ground.
export const CANVAS_BG = '#f5f5f4';
export const CANVAS_DOT = '#00000038';

type NodeStyle = {
  bg: string;
  icon: LucideIcon;
  dark: boolean;
};

export const nodeStyles: Record<NodeType, NodeStyle> = {
  text: { bg: 'bg-blue-200', icon: Type, dark: false },
  image: { bg: 'bg-red-200', icon: Image, dark: false },
  voice: { bg: 'bg-yellow-200', icon: Mic, dark: false },
  javascript: { bg: 'bg-purple-200', icon: Braces, dark: false },
  python: { bg: 'bg-green-200', icon: Code, dark: false },
  result: { bg: 'bg-neutral-900 text-white', icon: FileOutput, dark: true },
  source: { bg: 'bg-zinc-200', icon: Sparkles, dark: false },
  preview: { bg: 'bg-amber-200', icon: Eye, dark: false },
};
