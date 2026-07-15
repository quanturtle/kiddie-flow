import { Upload, X } from 'lucide-react';
import { isImageValue } from '../../store/nodeUtils';
import { NodeBodyProps } from './types';
import { incomingImageOf, imageLoaderActive } from './imageRole';

// an image node adapts to its role: fed by an edge it previews the incoming image; otherwise holding
// its own uploaded image makes it a loader that emits downstream, and empty it prompts for an upload
export function ImageBody({ data, hasIncomingEdge, onImageUpload, onClearImage }: NodeBodyProps) {
  const incomingImage = incomingImageOf(data);
  const isImageLoader = imageLoaderActive(data, hasIncomingEdge);

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 text-xs font-bold mb-2 uppercase text-gray-600 flex items-center justify-between">
        <span>Image</span>
        {isImageLoader && (
          <button
            onClick={onClearImage}
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
            className="w-full flex-1 min-h-0 object-contain rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
          className="w-full flex-1 min-h-0 object-contain rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        />
      ) : (
        <label className="nodrag flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-black rounded-lg cursor-pointer hover:bg-gray-50 text-gray-600">
          <Upload className="w-6 h-6" />
          <span className="text-sm font-semibold">Choose an image</span>
          <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
        </label>
      )}
    </div>
  );
}
