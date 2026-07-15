import { NodeType } from '../../store/types';
import { NodeRenderer } from './types';
import { TransformBody } from './TransformBody';
import { PythonBody, PythonCollapsedExtras } from './PythonBody';
import { ImageBody } from './ImageBody';
import { PreviewBody } from './PreviewBody';
import { ResultBody } from './ResultBody';
import { SourceBody } from './SourceBody';
import { showsImageContent } from './imageRole';

const STANDARD_COLUMN = { collapsed: 300, expanded: 300 };
const STANDARD_SIZE = { minWidth: 340, minHeight: 200 };

export const nodeRenderers: Record<NodeType, NodeRenderer> = {
  text: { ...STANDARD_SIZE, columnMinWidth: STANDARD_COLUMN, Body: TransformBody },
  voice: { ...STANDARD_SIZE, columnMinWidth: STANDARD_COLUMN, Body: TransformBody },
  javascript: { ...STANDARD_SIZE, columnMinWidth: STANDARD_COLUMN, Body: TransformBody },
  python: {
    minWidth: 800,
    minHeight: 460,
    columnMinWidth: { collapsed: 440, expanded: 760 },
    Body: PythonBody,
    CollapsedExtras: PythonCollapsedExtras,
  },
  image: {
    ...STANDARD_SIZE,
    columnMinWidth: STANDARD_COLUMN,
    Body: ImageBody,
    // resizable only once it actually holds or receives an image
    showsResizeHandle: showsImageContent,
  },
  preview: { ...STANDARD_SIZE, columnMinWidth: STANDARD_COLUMN, Body: PreviewBody },
  result: { ...STANDARD_SIZE, columnMinWidth: STANDARD_COLUMN, Body: ResultBody },
  source: { ...STANDARD_SIZE, columnMinWidth: STANDARD_COLUMN, Body: SourceBody },
};
