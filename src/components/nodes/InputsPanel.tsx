import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { NodeData } from '../../store/types';

interface InputsPanelProps {
  data: NodeData;
  onAddInput: () => void;
  onRemoveLastInput: () => void;
  onToggleInputs: () => void;
}

// the left column of a transform/python body: a compact rail when hidden, a key/value grid when shown
export function InputsPanel({ data, onAddInput, onRemoveLastInput, onToggleInputs }: InputsPanelProps) {
  if (!data.showInputs) {
    return (
      <div className="w-8 flex flex-col justify-center items-center border-r-2 border-black">
        <div className="space-y-2">
          <button
            onClick={onAddInput}
            className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            title="Add input"
            disabled={data.inputs >= 5}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={onRemoveLastInput}
            className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            title="Remove last input"
            disabled={data.inputs <= 1}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleInputs}
            className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            title="Show inputs"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/3 border-r-2 border-black pr-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold uppercase text-gray-600">Inputs</div>
        <div className="flex gap-2">
          <button
            onClick={onAddInput}
            className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            title="Add input"
            disabled={data.inputs >= 5}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={onRemoveLastInput}
            className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            title="Remove last input"
            disabled={data.inputs <= 1}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleInputs}
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
  );
}
