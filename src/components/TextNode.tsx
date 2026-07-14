import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { Play, ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Minus, Loader2, AlertTriangle, Upload, X } from 'lucide-react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useStore, NodeType } from '../store/flowStore';
import { isImageValue } from '../store/nodeUtils';
import { nodeStyles, HARD_SHADOW, SOFT_SHADOW, ACCENT } from '../theme/nodeTheme';

interface NodeProps {
  id: string;
  data: {
    title: string;
    text: string;
    description?: string;
    showDescription?: boolean;
    createdAt: string;
    onChange: (text: string) => void;
    type: NodeType;
    inputs: number;
    outputs: number;
    inputValues: Record<string, string>;
    inputHandles: Array<{ id: string; label: string; }>;
    outputHandles: Array<{ id: string; label: string; }>;
    showInputs?: boolean;
    showOutput?: boolean;
    isCollapsed?: boolean;
  };
}

const ANIMATION_DURATION = 200;
const DEBOUNCE_DELAY = 2000; // 2 seconds delay for text updates

export function TextNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeConfig = useStore(state => state.updateNodeConfig);
  const removeLastInput = useStore(state => state.removeLastInput);
  const runPythonNode = useStore(state => state.runPythonNode);
  const toggleCollapseNode = useStore(state => state.toggleCollapse);
  const hasIncomingEdge = useStore(state => state.edges.some(edge => edge.target === id));
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedUpdateRef = useRef<NodeJS.Timeout>();
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
      data.onChange(newText);
    }, DEBOUNCE_DELAY);
  }, [data]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    data.onChange(localText);
  };

  const handleRun = () => {
    // flush the latest code before executing, cancelling the pending debounce
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    data.onChange(localText);
    runPythonNode(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') data.onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    data.onChange('');
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

  const calculateHandlePositions = (count: number, isCollapsed: boolean) => {
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

  const processedText = useMemo(() => {
    let result = data.text;
    data.inputHandles.forEach(handle => {
      const value = data.inputValues[handle.id];
      if (value !== undefined) {
        const regex = new RegExp(`{${handle.label}}`, 'g');
        result = result.replace(regex, value);
      }
    });
    return result;
  }, [data.text, data.inputValues, data.inputHandles]);

  const pythonSignature = useMemo(() => {
    const line = data.text.split('\n').find(l => l.trim().startsWith('def '));
    return line ? line.trim().replace(/:\s*$/, '') : '';
  }, [data.text]);

  // an image node adapts to its role: while an edge feeds it, it previews that incoming image;
  // otherwise, holding its own uploaded image makes it a loader that emits downstream.
  const incomingImage = data.inputValues[data.inputHandles[0]?.id ?? ''] ?? '';
  const isImageLoader = !hasIncomingEdge && isImageValue(data.text);

  const style = nodeStyles[data.type];
  const Icon = style.icon;

  return (
    <div
      ref={nodeRef}
      className={`rounded-2xl border-4 border-black relative ${HARD_SHADOW} ${style.bg}`}
      style={{
        // anchor at the left edge so expanding grows the node to the right, keeping the
        // input handle (and the incoming edge) fixed in place
        transform: 'translate(0, -50%)',
        // constant padding so the left handle never shifts when the node expands
        padding: '16px',
        minHeight: data.isCollapsed ? '48px' : 'auto',
        width: '100%',
        transition: `all ${ANIMATION_DURATION}ms ease-in-out`,
      }}
    >
      <div className="flex gap-6 relative">
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

        <div className={`w-full ${data.type === 'python' ? (data.isCollapsed ? 'min-w-[440px]' : 'min-w-[760px]') : 'min-w-[300px]'}`} style={{ transition: `width ${ANIMATION_DURATION}ms ease-in-out` }}>
          <div className={`flex flex-col gap-2 ${!data.isCollapsed ? '-mx-4 -mt-4 px-4 pt-4 pb-3 mb-4 border-b-4 border-black' : ''}`}>
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
                {!['result', 'source', 'preview', 'image'].includes(data.type) && (
                  <button
                    onClick={data.type === 'python' ? handleRun : handlePlay}
                    disabled={data.isRunning}
                    className={`p-1.5 ${ACCENT} text-black border-2 border-black rounded-lg transition-colors ${SOFT_SHADOW} ${data.isRunning ? 'opacity-70' : ''}`}
                    title={data.type === 'python' ? 'Run Python' : 'Send text to connected nodes'}
                  >
                    {data.isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {data.description && (
              <p className={`text-sm ${style.dark ? 'text-gray-400' : 'text-gray-500'}`}>{data.description}</p>
            )}

            {data.type === 'python' && data.isCollapsed && pythonSignature && (
              <code className="font-mono text-xs bg-white border-2 border-black rounded-md px-2 py-1 truncate">
                {pythonSignature}
              </code>
            )}

            {data.type === 'python' && data.isCollapsed && (data.isRunning || data.computedOutput || data.runError) && (
              <>
                {data.isRunning ? (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" /> running…
                  </div>
                ) : data.runError ? (
                  <pre
                    className="font-mono text-xs bg-red-50 text-red-700 border-2 border-red-500 rounded-md px-2 py-1 whitespace-pre-wrap overflow-auto"
                    style={{ maxHeight: 120 }}
                  >
                    {data.runError}
                  </pre>
                ) : isImageValue(data.computedOutput) ? (
                  <span className="text-xs text-gray-500">✓ image data ready</span>
                ) : (
                  <pre
                    className="font-mono text-xs bg-gray-900 text-lime-300 border-2 border-black rounded-md px-2 py-1 whitespace-pre-wrap overflow-auto"
                    style={{ maxHeight: 120 }}
                  >
                    {data.computedOutput}
                  </pre>
                )}
              </>
            )}
          </div>

          {!data.isCollapsed && (
            <>
              {data.type === 'image' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-600 flex items-center justify-between">
                    <span>Image</span>
                    {isImageLoader && (
                      <button
                        onClick={handleClearImage}
                        className="flex items-center gap-1 text-[10px] normal-case font-semibold px-1.5 py-0.5 bg-white border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
                        title="Clear image"
                      >
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                  {hasIncomingEdge ? (
                    isImageValue(incomingImage) ? (
                      <img
                        src={incomingImage}
                        alt="image"
                        className="w-full rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 p-4 border-2 border-dashed border-gray-400 rounded-lg text-center">
                        Waiting for image…
                      </div>
                    )
                  ) : isImageLoader ? (
                    <img
                      src={data.text}
                      alt="image"
                      className="w-full rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <label className="nodrag flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-black rounded-lg cursor-pointer hover:bg-gray-50 text-gray-600">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-semibold">Choose an image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              ) : data.type === 'preview' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-600">Preview</div>
                  {isImageValue(data.text) ? (
                    <img
                      src={data.text}
                      alt="preview"
                      className="w-full rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <textarea
                      value={data.text}
                      readOnly
                      className="w-full p-2 border-2 border-black rounded-lg bg-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
                      rows={8}
                      placeholder="Connected input will appear here..."
                    />
                  )}
                </div>
              ) : data.type === 'result' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-400">Result</div>
                  {isImageValue(data.text) ? (
                    <img
                      src={data.text}
                      alt="result"
                      className="w-full rounded-lg border-2 border-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <textarea
                      value={data.text}
                      readOnly
                      className="w-full p-2 border-2 border-gray-700 rounded-lg bg-gray-900 text-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
                      rows={8}
                      placeholder="Connected input will appear here..."
                    />
                  )}
                </div>
              ) : data.type === 'source' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-600">
                    {isImageValue(localText) ? 'Source Image' : 'Source Text'}
                  </div>
                  {isImageValue(localText) ? (
                    <img
                      src={localText}
                      alt="source"
                      className="w-full rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <textarea
                      value={localText}
                      onChange={handleChange}
                      className="w-full p-2 border-2 border-black rounded-lg resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      rows={8}
                      placeholder="Enter your source text here..."
                    />
                  )}
                </div>
              ) : (
                <>
                <div className="flex w-full gap-4">
                  {!['result', 'source', 'preview'].includes(data.type) && (
                    <>
                      {!data.showInputs ? (
                        <div className="w-8 flex flex-col justify-center items-center border-r-2 border-black">
                          <div className="space-y-2">
                            <button
                              onClick={addInput}
                              className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Add input"
                              disabled={data.inputs >= 5}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleRemoveLastInput}
                              className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Remove last input"
                              disabled={data.inputs <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={toggleInputs}
                              className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Show inputs"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-1/3 border-r-2 border-black pr-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold uppercase text-gray-600">Inputs</div>
                            <div className="flex gap-2">
                              <button
                                onClick={addInput}
                                className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                title="Add input"
                                disabled={data.inputs >= 5}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={handleRemoveLastInput}
                                className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                title="Remove last input"
                                disabled={data.inputs <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={toggleInputs}
                                className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                title="Hide inputs"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-xs font-semibold uppercase text-gray-500 px-2">Key</div>
                            <div className="text-xs font-semibold uppercase text-gray-500 px-2">Value</div>
                            {data.inputHandles.map(handle => (
                              <React.Fragment key={handle.id}>
                                <div className="p-2 border-2 border-black rounded-lg bg-gray-50 text-gray-600 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  {handle.label}
                                </div>
                                <div className="p-2 border-2 border-black rounded-lg bg-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden whitespace-nowrap text-ellipsis">
                                  {data.inputValues[handle.id] || 'value'}
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Available: {data.inputHandles.map(h => `{${h.label}}`).join(', ')}
                          </div>
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="text-xs font-bold mb-2 uppercase text-gray-600">
                          {data.type === 'python' ? 'Python' : 'Transform'}
                        </div>
                        {data.type === 'python' ? (
                          <div
                            className="nodrag border-2 border-black rounded-lg overflow-auto bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            style={{ height: 340 }}
                          >
                            <CodeEditor
                              value={localText}
                              language="python"
                              onChange={handleChange}
                              placeholder={'def node_name(input_1: str) -> str:\n    return result'}
                              padding={12}
                              data-color-mode="light"
                              style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: 13,
                                backgroundColor: 'transparent',
                                minHeight: '100%',
                              }}
                            />
                          </div>
                        ) : (
                          <textarea
                            value={localText}
                            onChange={handleChange}
                            className="w-full p-2 border-2 border-black rounded-lg resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            rows={8}
                            placeholder="Enter your transform text here... Use {input_1} to reference inputs"
                          />
                        )}
                      </div>

                      {data.type === 'python' ? null : !data.showOutput ? (
                        <div className="w-8 flex flex-col justify-center items-center border-l-2 border-black">
                          <button
                            onClick={toggleOutput}
                            className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            title="Show output"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-1/3 border-l-2 border-black pl-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-bold uppercase text-gray-600">Output</div>
                            <button
                              onClick={toggleOutput}
                              className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Hide output"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                          <textarea
                            value={processedText}
                            readOnly
                            className="w-full p-2 border-2 border-black rounded-lg resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            rows={8}
                            placeholder="Transformed text will appear here..."
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {data.type === 'python' && (
                  <div className="mt-4">
                    <div className="text-xs font-bold mb-2 uppercase text-gray-600 flex items-center gap-2">
                      Output
                      {data.isRunning && (
                        <span className="flex items-center gap-1 text-gray-500 normal-case font-normal">
                          <Loader2 className="w-3 h-3 animate-spin" /> running…
                        </span>
                      )}
                    </div>
                    {data.runError ? (
                      <pre
                        className="w-full p-2 border-2 border-red-500 rounded-lg bg-red-50 text-red-700 text-xs whitespace-pre-wrap overflow-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        style={{ maxHeight: 220 }}
                      >
                        <span className="flex items-center gap-1 font-bold mb-1">
                          <AlertTriangle className="w-3 h-3" /> Error
                        </span>
                        {data.runError}
                      </pre>
                    ) : isImageValue(data.computedOutput) ? (
                      <div className="text-sm text-gray-600 border-2 border-black rounded-lg p-2 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        ✓ produced image data — connect an image node to view it
                      </div>
                    ) : (
                      <pre
                        className="w-full p-2 border-2 border-black rounded-lg bg-gray-900 text-lime-300 text-xs font-mono whitespace-pre-wrap overflow-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        style={{ maxHeight: 220, minHeight: 48 }}
                      >
                        {data.computedOutput || 'Click ▶ Run to execute this node.'}
                      </pre>
                    )}
                  </div>
                )}
                </>
              )}
            </>
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
    </div>
  );
}