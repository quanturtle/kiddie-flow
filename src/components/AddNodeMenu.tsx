import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useStore, NodeType } from '../store/flowStore';
import { nodeStyles, ACCENT, SOFT_SHADOW } from '../theme/nodeTheme';

const menuOrder: NodeType[] = ['text', 'image', 'voice', 'javascript', 'python', 'source', 'preview', 'result'];

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
        className={`p-2 ${ACCENT} border-2 border-black rounded-lg transition-colors ${SOFT_SHADOW}`}
        title="Add node"
      >
        <Plus className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden min-w-[160px]">
          {menuOrder.map((type, i) => {
            const { icon: Icon, bg } = nodeStyles[type];
            return (
              <button
                key={type}
                onClick={() => handleAddNode(type)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left font-semibold text-sm hover:bg-gray-100 transition-colors ${
                  i < menuOrder.length - 1 ? 'border-b-2 border-black' : ''
                }`}
              >
                <span className={`w-6 h-6 flex items-center justify-center border-2 border-black rounded-md ${bg}`}>
                  <Icon className="w-3.5 h-3.5 text-black" />
                </span>
                <span className="capitalize">{type}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
