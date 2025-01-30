import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useStore, NodeType } from '../store/flowStore';

export function AddNodeMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const addNode = useStore(state => state.addNode);

  const handleAddNode = (type: NodeType) => {
    addNode(type);
    setIsOpen(false);
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Plus className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[120px]">
          <button
            onClick={() => handleAddNode('text')}
            className="w-full px-4 py-2 text-left hover:bg-blue-100 border-b-2 border-black"
          >
            Text
          </button>
          <button
            onClick={() => handleAddNode('image')}
            className="w-full px-4 py-2 text-left hover:bg-red-100 border-b-2 border-black"
          >
            Image
          </button>
          <button
            onClick={() => handleAddNode('voice')}
            className="w-full px-4 py-2 text-left hover:bg-yellow-100 border-b-2 border-black"
          >
            Voice
          </button>
          <button
            onClick={() => handleAddNode('javascript')}
            className="w-full px-4 py-2 text-left hover:bg-purple-100 border-b-2 border-black"
          >
            JavaScript
          </button>
          <button
            onClick={() => handleAddNode('python')}
            className="w-full px-4 py-2 text-left hover:bg-green-100 border-b-2 border-black"
          >
            Python
          </button>
          <button
            onClick={() => handleAddNode('source')}
            className="w-full px-4 py-2 text-left hover:bg-zinc-100 border-b-2 border-black"
          >
            Source
          </button>
          <button
            onClick={() => handleAddNode('preview')}
            className="w-full px-4 py-2 text-left hover:bg-amber-900/10 border-b-2 border-black"
          >
            Preview
          </button>
          <button
            onClick={() => handleAddNode('result')}
            className="w-full px-4 py-2 text-left hover:bg-black/10"
          >
            Result
          </button>
        </div>
      )}
    </div>
  );
}