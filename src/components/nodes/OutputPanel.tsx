import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OutputPanelProps {
  showOutput: boolean | undefined;
  processedText: string;
  onToggleOutput: () => void;
}

// the right column of a transform body: a collapse rail, or the read-only templated result
export function OutputPanel({ showOutput, processedText, onToggleOutput }: OutputPanelProps) {
  if (!showOutput) {
    return (
      <div className="w-8 flex flex-col justify-center items-center border-l-2 border-black">
        <button
          onClick={onToggleOutput}
          className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          title="Show output"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-1/3 border-l-2 border-black pl-4 flex flex-col min-h-0">
      <div className="shrink-0 flex items-center justify-between mb-1">
        <div className="text-xs font-bold uppercase text-gray-600">Output</div>
        <button
          onClick={onToggleOutput}
          className="p-0.5 bg-white border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          title="Hide output"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <textarea
        value={processedText}
        readOnly
        className="w-full flex-1 min-h-0 p-2 border-2 border-black rounded-lg resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        rows={8}
        placeholder="Transformed text will appear here..."
      />
    </div>
  );
}
