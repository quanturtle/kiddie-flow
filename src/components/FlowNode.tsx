import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { Play, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useStore } from '../store/flowStore';
import { NodeData } from '../store/types';
import { nodeBehaviors } from '../store/nodeBehaviors';
import { nodeStyles, HARD_SHADOW, SOFT_SHADOW, ACCENT } from '../theme/nodeTheme';
import { NodeBodyProps } from './nodes/types';
import { nodeRenderers } from './nodes/registry';

interface NodeProps {
  id: string;
  data: NodeData;
}

interface ResizeHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

const ANIMATION_DURATION = 200;
const DEBOUNCE_DELAY = 2000; // 2 seconds delay for text updates

// traces the bottom-right shadow corner — same 16px fillet as the node's rounded-2xl edge — shifted past the shadow; dragging it resizes the node
function ResizeHandle({ onPointerDown, onPointerMove, onPointerUp }: ResizeHandleProps) {
  return (
    <div
      className="nodrag absolute w-14 h-14 text-gray-400"
      style={{ right: -26, bottom: -26, cursor: 'nwse-resize', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <svg className="pointer-events-none" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M47 19 L47 31 A16 16 0 0 1 31 47 L19 47" />
      </svg>
    </div>
  );
}

// the shared chrome around every node: frame, header, handle rails and the resize corner. What fills
// the body — and any collapsed-header chips — is resolved from the type via nodeRenderers.
export function FlowNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeData = useStore(state => state.updateNodeData);
  const updateNodeConfig = useStore(state => state.updateNodeConfig);
  const resizeNode = useStore(state => state.resizeNode);
  const removeLastInput = useStore(state => state.removeLastInput);
  const runPythonNode = useStore(state => state.runPythonNode);
  const toggleCollapseNode = useStore(state => state.toggleCollapse);
  const hasIncomingEdge = useStore(state => state.edges.some(edge => edge.target === id));
  const measuredWidth = useStore(state => state.nodes.find(n => n.id === id)?.width);
  const measuredHeight = useStore(state => state.nodes.find(n => n.id === id)?.height);
  const { getZoom } = useReactFlow();
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeStart = useRef<{ x: number; y: number; zoom: number; w: number; h: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedUpdateRef = useRef<ReturnType<typeof setTimeout>>();
  const [localText, setLocalText] = useState(data.text);

  // Track all elements that might trigger transitions
  const transitionElements = useRef<Set<HTMLElement>>(new Set());

  useEffect(() => {
    if (pendingUpdate && !isAnimating) {
      updateNodeInternals(id);
      setPendingUpdate(false);
    }
  }, [id, pendingUpdate, isAnimating, updateNodeInternals]);

  const startTransition = () => {
    setIsAnimating(true);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
  };

  const endTransition = () => {
    transitionTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATION + 50);
  };

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const handleTransitionStart = (e: TransitionEvent) => {
      if (e.target instanceof HTMLElement) {
        transitionElements.current.add(e.target);
        startTransition();
      }
    };

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.target instanceof HTMLElement) {
        transitionElements.current.delete(e.target);
        if (transitionElements.current.size === 0) {
          endTransition();
        }
      }
    };

    node.addEventListener('transitionstart', handleTransitionStart);
    node.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      node.removeEventListener('transitionstart', handleTransitionStart);
      node.removeEventListener('transitionend', handleTransitionEnd);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAnimating) {
      setPendingUpdate(true);
    } else {
      updateNodeInternals(id);
    }
  }, [
    id,
    data.inputs,
    data.outputs,
    data.inputHandles.length,
    data.outputHandles.length,
    data.isCollapsed,
    data.showInputs,
    data.showOutput,
    isAnimating,
    updateNodeInternals
  ]);

  // Update localText when data.text changes from external sources
  useEffect(() => {
    setLocalText(data.text);
  }, [data.text]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLocalText(newText);

    // Clear any existing timeout
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }

    // Set new timeout for the update
    debouncedUpdateRef.current = setTimeout(() => {
      updateNodeData(id, newText);
    }, DEBOUNCE_DELAY);
  }, [id, updateNodeData]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    updateNodeData(id, localText);
  };

  const handleRun = () => {
    // flush the latest code before executing, cancelling the pending debounce
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    updateNodeData(id, localText);
    runPythonNode(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') updateNodeData(id, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    updateNodeData(id, '');
  };

  const toggleInputs = () => {
    startTransition();
    updateNodeConfig(id, { showInputs: !data.showInputs });
  };

  const toggleOutput = () => {
    startTransition();
    updateNodeConfig(id, { showOutput: !data.showOutput });
  };

  const toggleCollapse = () => {
    startTransition();
    toggleCollapseNode(id);
  };

  const behavior = nodeBehaviors[data.type];
  const renderer = nodeRenderers[data.type];
  const { minWidth, minHeight } = renderer;

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      zoom: getZoom(),
      w: data.width ?? measuredWidth ?? minWidth,
      h: data.height ?? measuredHeight ?? minHeight,
    };
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    const start = resizeStart.current;
    if (!start) return;
    const width = Math.max(minWidth, Math.round(start.w + (e.clientX - start.x) / start.zoom));
    const height = Math.max(minHeight, Math.round(start.h + (e.clientY - start.y) / start.zoom));
    resizeNode(id, width, height);
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    resizeStart.current = null;
    setIsResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const addInput = () => {
    if (data.inputs < 5) {
      updateNodeConfig(id, {
        inputs: data.inputs + 1,
        showInputs: true
      });
      updateNodeInternals(id);
    }
  };

  const handleRemoveLastInput = () => {
    if (data.inputs > 1) {
      removeLastInput(id);
      updateNodeInternals(id);
    }
  };

  const calculateHandlePositions = (count: number, isCollapsed: boolean | undefined) => {
    if (isCollapsed) {
      // When collapsed, distribute handles using 90% of the node height
      const positions: number[] = [];
      const start = 5; // Start at 5% from top
      const end = 95; // End at 95% from top
      const step = (end - start) / (count + 1);

      for (let i = 1; i <= count; i++) {
        positions.push(start + (step * i));
      }
      return positions;
    } else {
      // When expanded, distribute handles along the full height
      const positions: number[] = [];
      const step = 100 / (count + 1);
      for (let i = 1; i <= count; i++) {
        positions.push(step * i);
      }
      return positions;
    }
  };

  const inputPositions = useMemo(
    () => calculateHandlePositions(data.inputHandles.length, data.isCollapsed),
    [data.inputHandles.length, data.isCollapsed]
  );

  const outputPositions = useMemo(
    () => calculateHandlePositions(data.outputHandles.length, data.isCollapsed),
    [data.outputHandles.length, data.isCollapsed]
  );

  const style = nodeStyles[data.type];
  const Icon = style.icon;
  const Body = renderer.Body;
  const CollapsedExtras = renderer.CollapsedExtras;
  const columnMinWidth = data.isCollapsed ? renderer.columnMinWidth.collapsed : renderer.columnMinWidth.expanded;
  const canResize = renderer.showsResizeHandle ? renderer.showsResizeHandle(data, hasIncomingEdge) : true;

  const bodyProps: NodeBodyProps = {
    id,
    data,
    localText,
    hasIncomingEdge,
    onTextChange: handleChange,
    onImageUpload: handleImageUpload,
    onClearImage: handleClearImage,
    onAddInput: addInput,
    onRemoveLastInput: handleRemoveLastInput,
    onToggleInputs: toggleInputs,
    onToggleOutput: toggleOutput,
  };

  return (
    <div
      ref={nodeRef}
      className={`rounded-2xl border-4 border-black relative flex flex-col ${HARD_SHADOW} ${style.bg}`}
      style={{
        // anchor at the top-left so expanding grows the node down and to the right; the handles
        // ride along to their new positions as the box changes size
        padding: '16px',
        minHeight: data.isCollapsed ? '48px' : 'auto',
        // an explicit size takes over once the user drags the corner; otherwise the box sizes to content.
        // while collapsed the box shrinks to the compact bar, and the stored size is kept on the node so
        // expanding reopens it to the custom size the user dragged to.
        width: data.isCollapsed ? '100%' : (data.width ?? '100%'),
        height: data.isCollapsed ? undefined : data.height,
        transition: isResizing ? 'none' : `all ${ANIMATION_DURATION}ms ease-in-out`,
      }}
    >
      <div className="flex gap-6 relative flex-1 min-h-0">
        <div
          className="absolute left-0 h-full flex flex-col justify-center"
          style={{
            width: '20px',
            // 8px clear of the node's left edge
            transform: 'translateX(-31px)',
            transition: `height ${ANIMATION_DURATION}ms ease-in-out`
          }}
        >
          {data.inputHandles.map((handle, i) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="target"
              position={Position.Left}
              className="w-3.5 h-3.5 !bg-white !border-2 !border-black"
              style={{
                top: `${inputPositions[i]}%`
              }}
            />
          ))}
        </div>

        <div className="w-full flex flex-col min-h-0" style={{ minWidth: columnMinWidth, transition: isResizing ? 'none' : `width ${ANIMATION_DURATION}ms ease-in-out` }}>
          <div className={`shrink-0 flex flex-col gap-2 ${!data.isCollapsed ? '-mx-4 -mt-4 px-4 pt-4 pb-3 mb-4 border-b-4 border-black' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-9 h-9 flex items-center justify-center bg-white text-black border-2 border-black rounded-xl shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${style.dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {data.type}
                  </div>
                  <h3 className="font-extrabold leading-tight truncate">{data.title || `Node ${id}`}</h3>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={toggleCollapse}
                  className={`p-1.5 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-100 transition-colors ${SOFT_SHADOW}`}
                  title={data.isCollapsed ? "Expand node" : "Collapse node"}
                >
                  {data.isCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {behavior.hasManualAction && (
                  <button
                    onClick={behavior.isRunnable ? handleRun : handlePlay}
                    disabled={data.isRunning}
                    className={`p-1.5 ${ACCENT} text-black border-2 border-black rounded-lg transition-colors ${SOFT_SHADOW} ${data.isRunning ? 'opacity-70' : ''}`}
                    title={behavior.isRunnable ? 'Run Python' : 'Send text to connected nodes'}
                  >
                    {data.isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {data.description && (
              <p className={`text-sm ${style.dark ? 'text-gray-400' : 'text-gray-500'}`}>{data.description}</p>
            )}

            {data.isCollapsed && CollapsedExtras && <CollapsedExtras {...bodyProps} />}
          </div>

          {!data.isCollapsed && (
            <div className="flex-1 min-h-0 flex flex-col">
              <Body {...bodyProps} />
            </div>
          )}
        </div>

        <div
          className="absolute right-0 h-full flex flex-col justify-center"
          style={{
            width: '20px',
            // 8px clear of the shadow, which extends 5px past the node's right edge
            transform: 'translateX(36px)',
            transition: `height ${ANIMATION_DURATION}ms ease-in-out`
          }}
        >
          {data.outputHandles.map((handle, i) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={Position.Right}
              className="w-3.5 h-3.5 !bg-white !border-2 !border-black"
              style={{
                top: `${outputPositions[i]}%`
              }}
            />
          ))}
        </div>
      </div>

      {!data.isCollapsed && canResize && (
        <ResizeHandle
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        />
      )}
    </div>
  );
}
