import { useStore, NodeType } from '../store/flowStore';
import { X, Plus, Minus } from 'lucide-react';

export function Sidebar() {
  const selectedNode = useStore(state => state.selectedNode);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const setSelectedNode = useStore(state => state.setSelectedNode);
  const updateNodeConfig = useStore(state => state.updateNodeConfig);
  const updateHandleLabel = useStore(state => state.updateHandleLabel);

  if (!selectedNode) return null;

  const node = nodes.find(n => n.id === selectedNode);
  if (!node) return null;

  const parentConnections = edges
    .filter(edge => edge.target === selectedNode)
    .map(edge => ({
      edge,
      node: nodes.find(n => n.id === edge.source),
    }))
    .filter(conn => conn.node);

  const childConnections = edges
    .filter(edge => edge.source === selectedNode)
    .map(edge => ({
      edge,
      node: nodes.find(n => n.id === edge.target),
    }))
    .filter(conn => conn.node);

  const createdAt = new Date(node.data.createdAt).toLocaleString();

  const handleTypeChange = (type: NodeType) => {
    updateNodeConfig(selectedNode, { type });
  };

  const handleInputsChange = (change: number) => {
    const newValue = Math.max(1, Math.min(5, node.data.inputs + change));
    updateNodeConfig(selectedNode, { inputs: newValue });
  };

  const handleOutputsChange = (change: number) => {
    const newValue = Math.max(0, Math.min(5, node.data.outputs + change));
    updateNodeConfig(selectedNode, { outputs: newValue });
  };

  const handleLabelChange = (handleId: string, newLabel: string, isInput: boolean) => {
    updateHandleLabel(selectedNode, handleId, newLabel, isInput);
  };

  const handleTitleChange = (title: string) => {
    updateNodeConfig(selectedNode, { title });
  };

  const handleTextChange = (text: string) => {
    updateNodeConfig(selectedNode, { text });
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white border-l-4 border-black p-6 overflow-y-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold uppercase">Node Config</h2>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded hover:bg-gray-100 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-bold text-sm uppercase">Node Title</label>
          <input
            type="text"
            value={node.data.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full p-2 border-2 border-black rounded bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            placeholder="Enter node title..."
          />
        </div>

        <div className="space-y-2">
          <label className="font-bold text-sm uppercase">Node Type</label>
          <select
            value={node.data.type}
            onChange={(e) => handleTypeChange(e.target.value as NodeType)}
            className="w-full p-2 border-2 border-black rounded bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="voice">Voice</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="source">Source</option>
            <option value="result">Result</option>
          </select>
        </div>

        <div className="border-2 border-black rounded p-4 space-y-4 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm uppercase">Number of Inputs</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleInputsChange(-1)}
                className="p-1 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                disabled={node.data.inputs <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold">{node.data.inputs}</span>
              <button
                onClick={() => handleInputsChange(1)}
                className="p-1 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                disabled={node.data.inputs >= 5}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Input Labels</label>
            <div className="space-y-2">
              {node.data.inputHandles.map((handle) => (
                <input
                  key={handle.id}
                  type="text"
                  value={handle.label}
                  onChange={(e) => handleLabelChange(handle.id, e.target.value, true)}
                  className="w-full p-2 border-2 border-black rounded bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder={`Label for ${handle.id}`}
                />
              ))}
            </div>
          </div>
        </div>

        {node.data.type !== 'result' && (
          <div className="border-2 border-black rounded p-4 space-y-4 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sm uppercase">Number of Outputs</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOutputsChange(-1)}
                  className="p-1 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  disabled={node.data.outputs <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">{node.data.outputs}</span>
                <button
                  onClick={() => handleOutputsChange(1)}
                  className="p-1 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  disabled={node.data.outputs >= 5}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Output Labels</label>
              <div className="space-y-2">
                {node.data.outputHandles.map((handle) => (
                  <input
                    key={handle.id}
                    type="text"
                    value={handle.label}
                    onChange={(e) => handleLabelChange(handle.id, e.target.value, false)}
                    className="w-full p-2 border-2 border-black rounded bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    placeholder={`Label for ${handle.id}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="font-bold text-sm uppercase">Created At</label>
          <div className="p-2 border-2 border-black rounded bg-gray-50">{createdAt}</div>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-sm uppercase">Parent Nodes</label>
          {parentConnections.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {parentConnections.map(({ edge, node }) => (
                <li 
                  key={`parent-${edge.id}-${node.id}`} 
                  className="text-sm cursor-pointer hover:text-blue-600"
                  onClick={() => setSelectedNode(node.id)}
                >
                  {node.data.title} ({node.data.type})
                  <div className="text-xs text-gray-500 mt-1">
                    Connected to: {node.data.outputHandles.find(h => h.id === edge.sourceHandle)?.label || edge.sourceHandle}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 border-2 border-black rounded bg-gray-50">No parent nodes</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="font-bold text-sm uppercase">Child Nodes</label>
          {childConnections.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {childConnections.map(({ edge, node }) => (
                <li 
                  key={`child-${edge.id}-${node.id}`} 
                  className="text-sm cursor-pointer hover:text-blue-600"
                  onClick={() => setSelectedNode(node.id)}
                >
                  {node.data.title} ({node.data.type})
                  <div className="text-xs text-gray-500 mt-1">
                    Connected to: {node.data.inputHandles.find(h => h.id === edge.targetHandle)?.label || edge.targetHandle}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 border-2 border-black rounded bg-gray-50">No child nodes</div>
          )}
        </div>
      </div>
    </div>
  );
}