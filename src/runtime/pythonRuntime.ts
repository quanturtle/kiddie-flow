// Adapter around Pyodide (CPython compiled to WebAssembly). This is the single
// seam where the app touches a real Python interpreter — everything else stays pure.
// Pyodide is loaded lazily from the CDN on first run so the initial bundle stays small.

const PYODIDE_VERSION = '0.27.7';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export type PythonRunResult =
  | { ok: true; output: string }
  | { ok: false; error: string; output: string };

// available in every node without importing; upstream nodes prepend their own definitions
const RUNTIME_PRELUDE = 'from dataclasses import dataclass, field\n';

// Pyodide ships no bundled types here; the surface we use is narrow.
type PyNamespace = { get: (key: string) => unknown; destroy: () => void };
type Pyodide = {
  runPython: (code: string, options?: { globals?: PyNamespace }) => unknown;
  toPy: (value: unknown) => PyNamespace;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  loadPackagesFromImports: (code: string) => Promise<unknown>;
};

// user code defines a function named after the node; call it with the node's inputs.
// values move between nodes as python literals: tuples/numbers round-trip directly, and a
// node can move a richer type by defining a @dataclass above its function (repr() out here,
// reconstructed by eval() in the receiving node where the same dataclass is defined).
const CALL_EPILOGUE = `
def __kf_decode(__s):
    try:
        return eval(__s, globals())
    except Exception:
        return __s

__kf_target = globals().get(__kf_name)
if __kf_target is None:
    __kf_fns = [v for k, v in globals().items()
                if callable(v) and not isinstance(v, type) and not k.startswith("__")]
    __kf_target = __kf_fns[-1] if __kf_fns else None
if __kf_target is None:
    raise NameError("define a function named '" + __kf_name + "'")

__kf_ret = __kf_target(*[__kf_decode(__a) for __a in __kf_args])
__kf_output = "" if __kf_ret is None else (__kf_ret if isinstance(__kf_ret, str) else repr(__kf_ret))
`;

let pyodidePromise: Promise<Pyodide> | null = null;

const injectScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

const bootPyodide = async (): Promise<Pyodide> => {
  await injectScript(`${PYODIDE_BASE}pyodide.js`);
  const loadPyodide = (globalThis as Record<string, unknown>).loadPyodide as (
    options: { indexURL: string }
  ) => Promise<Pyodide>;
  return loadPyodide({ indexURL: PYODIDE_BASE });
};

export const isPyodideLoaded = (): boolean => pyodidePromise !== null;

export const getPythonRuntime = (): Promise<Pyodide> => {
  if (!pyodidePromise) {
    pyodidePromise = bootPyodide();
  }
  return pyodidePromise;
};

export const runPython = async (
  code: string,
  functionName: string,
  args: string[]
): Promise<PythonRunResult> => {
  const pyodide = await getPythonRuntime();

  // capture anything the function prints, for debugging
  const lines: string[] = [];
  pyodide.setStdout({ batched: (text: string) => lines.push(text) });
  pyodide.setStderr({ batched: (text: string) => lines.push(text) });

  // pull in any bundled packages the code imports (e.g. Pillow for image work)
  const fullCode = RUNTIME_PRELUDE + code + '\n' + CALL_EPILOGUE;
  await pyodide.loadPackagesFromImports(code);

  // run in a fresh namespace so nodes never leak state into one another
  const namespace = pyodide.toPy({ __kf_args: args, __kf_name: functionName });
  try {
    pyodide.runPython(fullCode, { globals: namespace });
    const returned = String(namespace.get('__kf_output') ?? '');
    const printed = lines.join('\n');
    return { ok: true, output: returned || printed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, output: lines.join('\n') };
  } finally {
    namespace.destroy();
  }
};
