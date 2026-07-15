import { useMemo } from 'react';
import { processNodeText } from '../../store/nodeUtils';
import { NodeBodyProps } from './types';
import { InputsPanel } from './InputsPanel';
import { OutputPanel } from './OutputPanel';

// text/voice/javascript: inputs on the left, a template textarea in the middle, templated output on the right
export function TransformBody({
  data,
  localText,
  onTextChange,
  onAddInput,
  onRemoveLastInput,
  onToggleInputs,
  onToggleOutput,
}: NodeBodyProps) {
  const processedText = useMemo(
    () => processNodeText(data.text, data.inputValues, data.inputHandles),
    [data.text, data.inputValues, data.inputHandles]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex w-full gap-4 flex-1 min-h-0">
        <InputsPanel
          data={data}
          onAddInput={onAddInput}
          onRemoveLastInput={onRemoveLastInput}
          onToggleInputs={onToggleInputs}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 text-xs font-bold mb-2 uppercase text-gray-600">Transform</div>
          <textarea
            value={localText}
            onChange={onTextChange}
            className="w-full flex-1 min-h-0 p-2 border-2 border-black rounded-lg resize-none focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            rows={8}
            placeholder="Enter your transform text here... Use {input_1} to reference inputs"
          />
        </div>

        <OutputPanel showOutput={data.showOutput} processedText={processedText} onToggleOutput={onToggleOutput} />
      </div>
    </div>
  );
}
