import { useMemo } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { NodeBodyProps } from './types';
import { InputsPanel } from './InputsPanel';
import { previewOutput } from './format';

const pythonSignatureOf = (text: string): string => {
  const line = text.split('\n').find(l => l.trim().startsWith('def '));
  return line ? line.trim().replace(/:\s*$/, '') : '';
};

// python: inputs on the left, a code editor in the middle, and the run output stacked below
export function PythonBody({
  data,
  localText,
  onTextChange,
  onAddInput,
  onRemoveLastInput,
  onToggleInputs,
}: NodeBodyProps) {
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
          <div className="shrink-0 text-xs font-bold mb-2 uppercase text-gray-600">Python</div>
          <div
            className="nodrag flex-1 min-h-0 border-2 border-black rounded-lg overflow-auto bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            style={{ minHeight: 340 }}
          >
            <CodeEditor
              value={localText}
              language="python"
              onChange={onTextChange}
              placeholder={'def node_name(input_1: str) -> str:\n    return result'}
              padding={12}
              data-color-mode="light"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                backgroundColor: 'transparent',
                minHeight: '100%',
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 shrink-0">
        <div className="text-xs font-bold mb-2 uppercase text-gray-600 flex items-center gap-2">
          Output
          {data.isRunning && (
            <span className="flex items-center gap-1 text-gray-500 normal-case font-normal">
              <Loader2 className="w-3 h-3 animate-spin" /> running…
            </span>
          )}
        </div>
        {data.runError ? (
          <pre
            className="w-full p-2 border-2 border-red-500 rounded-lg bg-red-50 text-red-700 text-xs whitespace-pre-wrap overflow-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            style={{ maxHeight: 220 }}
          >
            <span className="flex items-center gap-1 font-bold mb-1">
              <AlertTriangle className="w-3 h-3" /> Error
            </span>
            {data.runError}
          </pre>
        ) : (
          <pre
            className="w-full p-2 border-2 border-black rounded-lg bg-gray-900 text-lime-300 text-xs font-mono whitespace-pre-wrap overflow-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            style={{ maxHeight: 220, minHeight: 48 }}
          >
            {data.computedOutput ? previewOutput(data.computedOutput) : 'Click ▶ Run to execute this node.'}
          </pre>
        )}
      </div>
    </div>
  );
}

// while collapsed, a python node shows its function signature and last run's output under the title
export function PythonCollapsedExtras({ data }: NodeBodyProps) {
  const pythonSignature = useMemo(() => pythonSignatureOf(data.text), [data.text]);

  return (
    <>
      {pythonSignature && (
        <code className="font-mono text-xs bg-white border-2 border-black rounded-md px-2 py-1 truncate">
          {pythonSignature}
        </code>
      )}

      {(data.isRunning || data.computedOutput || data.runError) && (
        <>
          {data.isRunning ? (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" /> running…
            </div>
          ) : data.runError ? (
            <pre
              className="font-mono text-xs bg-red-50 text-red-700 border-2 border-red-500 rounded-md px-2 py-1 whitespace-pre-wrap overflow-auto"
              style={{ maxHeight: 120 }}
            >
              {data.runError}
            </pre>
          ) : (
            <pre
              className="font-mono text-xs bg-gray-900 text-lime-300 border-2 border-black rounded-md px-2 py-1 whitespace-pre-wrap overflow-auto"
              style={{ maxHeight: 120 }}
            >
              {previewOutput(data.computedOutput ?? '')}
            </pre>
          )}
        </>
      )}
    </>
  );
}
