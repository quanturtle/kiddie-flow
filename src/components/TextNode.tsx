import React, { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { Play, ChevronLeft, ChevronRight, Plus, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
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

export function TextNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeConfig = useStore(state => state.updateNodeConfig);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.inputs, data.outputs, data.inputHandles.length, data.outputHandles.length, updateNodeInternals]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    data.onChange(newText);
  };

  const handlePlay = () => {
    data.onChange(data.text);
  };

  const toggleInputs = () => {
    updateNodeConfig(id, { showInputs: !data.showInputs });
  };

  const toggleOutput = () => {
    updateNodeConfig(id, { showOutput: !data.showOutput });
  };

  const toggleCollapse = () => {
    updateNodeConfig(id, { 
      isCollapsed: !data.isCollapsed,
      showInputs: false,
      showOutput: false
    });
  };

  const toggleDescription = () => {
    updateNodeConfig(id, { showDescription: !data.showDescription });
  };

  const addInput = () => {
    if (data.inputs < 5) {
      updateNodeConfig(id, { 
        inputs: data.inputs + 1,
        showInputs: true 
      });
    }
  };

  const calculateHandlePositions = (count: number) => {
    const positions: number[] = [];
    const step = 100 / (count + 1);
    for (let i = 1; i <= count; i++) {
      positions.push(step * i);
    }
    return positions;
  };

  const inputPositions = calculateHandlePositions(data.inputHandles.length);
  const outputPositions = calculateHandlePositions(data.outputHandles.length);

  const processedText = React.useMemo(() => {
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
      className={`rounded-lg border-4 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${typeColors[data.type]} ${data.isCollapsed ? 'p-2' : 'p-4'}`}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div className="flex gap-6 relative">
        <div className="absolute left-0 h-full" style={{ width: '20px', transform: 'translateX(-32px)' }}>
          {data.inputHandles.map((handle, i) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="target"
              position={Position.Left}
              className="w-3 h-3 !bg-black"
              style={{ top: data.isCollapsed ? '50%' : `${inputPositions[i]}%` }}
            />
          ))}
        </div>

        <div className="w-full min-w-[300px]">
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
                    value={data.text}
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
                          value={data.text}
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

        <div className="absolute right-0 h-full" style={{ width: '20px', transform: 'translateX(32px)' }}>
          {data.outputHandles.map((handle, i) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="source"
              position={Position.Right}
              className="w-3 h-3 !bg-black"
              style={{ top: data.isCollapsed ? '50%' : `${outputPositions[i]}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}