import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { ClassicPop } from './variants/ClassicPop';
import { TerminalBrutalist } from './variants/TerminalBrutalist';

type IterationId = 'classic' | 'terminal';

const iterations: Array<{ id: IterationId; name: string; blurb: string }> = [
  { id: 'classic', name: '01 · Classic Pop', blurb: 'Bright pop accents, crisp black frames, hard shadows.' },
  { id: 'terminal', name: '02 · Terminal Brutalist', blurb: 'Dark canvas, monospace, neon glow-hard edges.' },
];

const variants: Record<IterationId, () => JSX.Element> = {
  classic: ClassicPop,
  terminal: TerminalBrutalist,
};

export function Labs() {
  const [active, setActive] = useState<IterationId>('classic');
  const ActiveVariant = variants[active];

  return (
    <div className="w-screen min-h-screen bg-gray-100 flex flex-col">
      {/* top bar */}
      <header className="border-b-4 border-black bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 bg-white border-2 border-black rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="Back to editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Design Labs</h1>
            <p className="text-sm text-gray-500">Three neobrutalist directions for the same UI.</p>
          </div>
        </div>
      </header>

      {/* iteration switcher */}
      <nav className="px-6 py-4 flex flex-wrap gap-3">
        {iterations.map(it => (
          <button
            key={it.id}
            onClick={() => setActive(it.id)}
            className={`text-left px-4 py-3 border-2 border-black rounded transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${
              active === it.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            <div className="font-bold text-sm">{it.name}</div>
            <div className={`text-xs ${active === it.id ? 'text-gray-300' : 'text-gray-500'}`}>{it.blurb}</div>
          </button>
        ))}
      </nav>

      {/* stage */}
      <main className="flex-1 px-6 pb-8">
        <div className="w-full h-full border-4 border-black rounded-lg overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <ActiveVariant />
        </div>
      </main>
    </div>
  );
}
