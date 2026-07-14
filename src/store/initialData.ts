import { Node, Edge } from 'reactflow';
import { NodeData } from './types';
import { createDefaultHandles } from './nodeUtils';

const sortDedupeCode = `def sort_dedupe(numbers: tuple[int, ...]) -> tuple[int, ...]:
    return tuple(sorted(set(numbers)))`;

const statisticsCode = `@dataclass
class Stats:
    count: int
    total: int
    minimum: int
    maximum: int
    mean: float


def statistics(numbers: tuple[int, ...]) -> Stats:
    return Stats(
        count=len(numbers),
        total=sum(numbers),
        minimum=min(numbers),
        maximum=max(numbers),
        mean=round(sum(numbers) / len(numbers), 2),
    )`;

const reportCode = `def report(stats: Stats) -> str:
    return "\\n".join([
        f"count : {stats.count}",
        f"sum   : {stats.total}",
        f"min   : {stats.minimum}",
        f"max   : {stats.maximum}",
        f"mean  : {stats.mean}",
    ])`;

// Numbers flow through three python nodes: one returns a hashable tuple, one packs a Stats
// dataclass, and one unpacks that dataclass into a readable report.
export const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'flowNode',
    position: { x: 0, y: 0 },
    data: {
      title: 'Raw Numbers',
      description: 'A messy, unsorted list of numbers with duplicates',
      showDescription: false,
      text: '3, 14, 1, 5, 9, 2, 6, 5, 3, 5, 9',
      createdAt: new Date().toISOString(),
      onChange: () => {},  // Will be updated after store creation
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
    position: { x: 720, y: 40 },
    data: {
      title: 'sort_dedupe',
      description: 'Returns a sorted tuple of the unique numbers',
      showDescription: false,
      text: sortDedupeCode,
      createdAt: new Date().toISOString(),
      onChange: () => {},
      type: 'python',
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
    id: '3',
    type: 'flowNode',
    position: { x: 1440, y: 80 },
    data: {
      title: 'statistics',
      description: 'Packs the numbers into a Stats dataclass',
      showDescription: false,
      text: statisticsCode,
      createdAt: new Date().toISOString(),
      onChange: () => {},
      type: 'python',
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
    position: { x: 2160, y: 120 },
    data: {
      title: 'report',
      description: 'Unpacks the Stats dataclass into a readable summary',
      showDescription: false,
      text: reportCode,
      createdAt: new Date().toISOString(),
      onChange: () => {},
      type: 'python',
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
    id: '5',
    type: 'flowNode',
    position: { x: 2880, y: 160 },
    data: {
      title: 'Summary',
      description: 'Displays the final report',
      showDescription: false,
      text: '',
      createdAt: new Date().toISOString(),
      onChange: () => {},
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
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    sourceHandle: 'output1',
    targetHandle: 'input1',
  },
];
