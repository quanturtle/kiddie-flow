import { isImageValue } from '../../store/nodeUtils';
import { NodeBodyProps } from './types';

// result shows the final value on a dark terminal ground, as an image or plain text
export function ResultBody({ data }: NodeBodyProps) {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 text-xs font-bold mb-2 uppercase text-gray-400">Result</div>
      {isImageValue(data.text) ? (
        <img
          src={data.text}
          alt="result"
          className="w-full flex-1 min-h-0 object-contain rounded-lg border-2 border-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        />
      ) : (
        <textarea
          value={data.text}
          readOnly
          className="w-full flex-1 min-h-0 p-2 border-2 border-gray-700 rounded-lg bg-gray-900 text-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
          rows={8}
          placeholder="Connected input will appear here..."
        />
      )}
    </div>
  );
}
