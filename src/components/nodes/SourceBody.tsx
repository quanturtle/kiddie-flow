import { isImageValue } from '../../store/nodeUtils';
import { NodeBodyProps } from './types';

// source is the editable root: an uploaded image is previewed, otherwise its text is editable
export function SourceBody({ localText, onTextChange }: NodeBodyProps) {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 text-xs font-bold mb-2 uppercase text-gray-600">
        {isImageValue(localText) ? 'Source Image' : 'Source Text'}
      </div>
      {isImageValue(localText) ? (
        <img
          src={localText}
          alt="source"
          className="w-full flex-1 min-h-0 object-contain rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        />
      ) : (
        <textarea
          value={localText}
          onChange={onTextChange}
          className="w-full flex-1 min-h-0 p-2 border-2 border-black rounded-lg resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          rows={8}
          placeholder="Enter your source text here..."
        />
      )}
    </div>
  );
}
