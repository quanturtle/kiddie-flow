import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { Play, ChevronLeft, ChevronRight, Plus, Eye, EyeOff, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { useStore, NodeType } from '../store/flowStore';

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

const typeColors = {
  text: 'bg-blue-200 border-blue-400',
  image: 'bg-red-200 border-red-400',
  voice: 'bg-yellow-200 border-yellow-400',
  javascript: 'bg-purple-200 border-purple-400',
  python: 'bg-green-200 border-green-400',
  result: 'bg-black border-gray-700 text-white',
  source: 'bg-zinc-200 border-zinc-400',
  preview: 'bg-amber-100 border-amber-300',
};

const ANIMATION_DURATION = 200;
const DEBOUNCE_DELAY = 2000; // 2 seconds delay for text updates

export function TextNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeConfig = useStore(state => state.updateNodeConfig);
  const removeLastInput = useStore(state => state.removeLastInput);
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
    updateNodeConfig(id, { 
      isCollapsed: !data.isCollapsed,
      showInputs: false,
      showOutput: false
    });
  };

  const toggleDescription = () => {
    startTransition();
    updateNodeConfig(id, { showDescription: !data.showDescription });
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

  return (
    <div 
      ref={nodeRef}
      className={`rounded-lg border-4 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${typeColors[data.type]}`}
      style={{ 
        transform: 'translate(-50%, -50%)',
        padding: data.isCollapsed ? '8px' : '16px',
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
            transform: 'translateX(-32px)',
            transition: `height ${ANIMATION_DURATION}ms ease-in-out`
          }}
        >
          {data.inputHandles.map((handle, i) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="target"
              position={Position.Left}
              className="w-3 h-3 !bg-black"
              style={{ 
                top: `${inputPositions[i]}%`
              }}
            />
          ))}
        </div>

        <div className="w-full min-w-[300px]" style={{ transition: `width ${ANIMATION_DURATION}ms ease-in-out` }}>
          <div className={`flex flex-col gap-1 ${!data.isCollapsed && 'mb-4'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`text-xs uppercase ${data.type === 'result' ? 'bg-white text-black' : 'bg-black text-white'} px-1.5 py-0.5 rounded shrink-0`}>
                  {data.type}
                </span>
                <h3 className="font-bold truncate">{data.title || `Node ${id}`}</h3>
              </div>
              <div className="flex gap-1.5 ml-3 shrink-0">
                <button
                  onClick={toggleCollapse}
                  className={`p-1 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${data.type === 'result' ? 'text-black' : ''}`}
                  title={data.isCollapsed ? "Expand node" : "Collapse node"}
                >
                  {data.isCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {!['result', 'source', 'preview'].includes(data.type) && (
                  <button
                    onClick={handlePlay}
                    className="p-1 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    title="Send text to connected nodes"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {(data.description || data.isCollapsed) && (
              <div className="flex items-start gap-1.5">
                <button
                  onClick={toggleDescription}
                  className="p-0.5 mt-0.5 hover:bg-black/5 rounded"
                  title={data.showDescription ? "Hide description" : "Show description"}
                >
                  {data.showDescription ? (
                    <ChevronUp className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  )}
                </button>
                {data.showDescription && (
                  <p className="text-sm text-gray-500 flex-1 line-clamp-2">{data.description}</p>
                )}
              </div>
            )}
          </div>

          {!data.isCollapsed && (
            <>
              {data.type === 'preview' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-600">Preview</div>
                  <textarea
                    value={data.text}
                    readOnly
                    className="w-full p-2 border-2 border-black rounded bg-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
                    rows={8}
                    placeholder="Connected input will appear here..."
                  />
                </div>
              ) : data.type === 'result' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-400">Result</div>
                  <textarea
                    value={data.text}
                    readOnly
                    className="w-full p-2 border-2 border-gray-700 rounded bg-gray-900 text-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
                    rows={8}
                    placeholder="Connected input will appear here..."
                  />
                </div>
              ) : data.type === 'source' ? (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-600">Source Text</div>
                  <textarea
                    value={localText}
                    onChange={handleChange}
                    className="w-full p-2 border-2 border-black rounded resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    rows={8}
                    placeholder="Enter your source text here..."
                  />
                </div>
              ) : (
                <div className="flex w-full gap-4">
                  {!['result', 'source', 'preview'].includes(data.type) && (
                    <>
                      {!data.showInputs ? (
                        <div className="w-8 flex flex-col justify-center items-center border-r-2 border-black">
                          <div className="space-y-2">
                            <button
                              onClick={addInput}
                              className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Add input"
                              disabled={data.inputs >= 5}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleRemoveLastInput}
                              className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Remove last input"
                              disabled={data.inputs <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={toggleInputs}
                              className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
                                className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                title="Add input"
                                disabled={data.inputs >= 5}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={handleRemoveLastInput}
                                className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                title="Remove last input"
                                disabled={data.inputs <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={toggleInputs}
                                className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
                                <div className="p-2 border-2 border-black rounded bg-gray-50 text-gray-600 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  {handle.label}
                                </div>
                                <div className="p-2 border-2 border-black rounded bg-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden whitespace-nowrap text-ellipsis">
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
                        <div className="text-xs font-bold mb-2 uppercase text-gray-600">Transform</div>
                        <textarea
                          value={localText}
                          onChange={handleChange}
                          className="w-full p-2 border-2 border-black rounded resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          rows={8}
                          placeholder="Enter your transform text here... Use {input_1} to reference inputs"
                        />
                      </div>

                      {!data.showOutput ? (
                        <div className="w-8 flex flex-col justify-center items-center border-l-2 border-black">
                          <button
                            onClick={toggleOutput}
                            className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
                              className="p-0.5 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              title="Hide output"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                          <textarea
                            value={processedText}
                            readOnly
                            className="w-full p-2 border-2 border-black rounded resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            rows={8}
                            placeholder="Transformed text will appear here..."
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div 
          className="absolute right-0 h-full flex flex-col justify-center" 
          style={{ 
            width: '20px', 
            transform: 'translateX(32px)',
            transition: `height ${ANIMATION_DURATION}ms ease-in-out`
          }}
        >
          {data.outputHandles.map((handle, i) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={Position.Right}
              className="w-3 h-3 !bg-black"
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