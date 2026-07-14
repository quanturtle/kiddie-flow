import { Plus, Play, Sparkles, Type, FileOutput } from 'lucide-react';

// Iteration 01 — Classic Pop
// Bright saturated accents on white, crisp 4px black frames, hard offset shadows,
// generous rounding. The friendly, playful reading of neobrutalism.

const hardShadow = 'shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]';

export function ClassicPop() {
  return (
    <div
      className="w-full h-full min-h-[540px] p-8 relative"
      style={{
        backgroundColor: '#f5f5f4',
        backgroundImage: 'radial-gradient(#00000018 1.5px, transparent 1.5px)',
        backgroundSize: '22px 22px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* toolbar */}
      <div className={`inline-flex items-center gap-2 bg-white border-4 border-black rounded-xl px-2 py-2 ${hardShadow}`}>
        <button className="flex items-center gap-1.5 bg-lime-300 border-2 border-black rounded-lg px-3 py-1.5 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
          <Plus className="w-4 h-4" /> Add node
        </button>
        <div className="h-6 w-0.5 bg-black/20" />
        <span className="px-2 text-sm font-bold text-gray-700">untitled flow</span>
      </div>

      {/* connector lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <line x1="270" y1="230" x2="380" y2="230" stroke="#000" strokeWidth="3" />
        <line x1="640" y1="230" x2="750" y2="230" stroke="#000" strokeWidth="3" />
        <polygon points="380,230 370,225 370,235" fill="#000" />
        <polygon points="750,230 740,225 740,235" fill="#000" />
      </svg>

      {/* nodes */}
      <div className="relative flex items-center gap-[110px] mt-16" style={{ zIndex: 1 }}>
        <ClassicNode accent="bg-zinc-200" icon={<Sparkles className="w-4 h-4" />} type="source" title="Source">
          <textarea
            readOnly
            value={'A haiku about the sea'}
            className="w-full p-2 border-2 border-black rounded-lg bg-white text-sm resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            rows={3}
          />
        </ClassicNode>

        <ClassicNode accent="bg-blue-300" icon={<Type className="w-4 h-4" />} type="text" title="Rewrite" playable>
          <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Transform</div>
          <textarea
            readOnly
            value={'Make {input_1} more poetic'}
            className="w-full p-2 border-2 border-black rounded-lg bg-white text-sm resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            rows={3}
          />
        </ClassicNode>

        <ClassicNode accent="bg-black text-white" icon={<FileOutput className="w-4 h-4" />} type="result" title="Result">
          <textarea
            readOnly
            value={'Salt wind on the tide…'}
            className="w-full p-2 border-2 border-gray-600 rounded-lg bg-gray-900 text-white text-sm resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            rows={3}
          />
        </ClassicNode>
      </div>

      {/* palette footnote */}
      <div className="absolute bottom-6 left-8 flex gap-2">
        {['#bef264', '#93c5fd', '#f9a8d4', '#fcd34d', '#000000'].map(c => (
          <div key={c} className="w-7 h-7 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

function ClassicNode({
  accent,
  icon,
  type,
  title,
  children,
  playable = false,
}: {
  accent: string;
  icon: JSX.Element;
  type: string;
  title: string;
  children: React.ReactNode;
  playable?: boolean;
}) {
  const dark = accent.includes('text-white');
  return (
    <div className={`w-[270px] border-4 border-black rounded-2xl ${hardShadow} ${accent}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b-4 border-black">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 flex items-center justify-center bg-white text-black border-2 border-black rounded-lg shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className={`text-[9px] font-bold uppercase ${dark ? 'text-gray-300' : 'text-gray-500'}`}>{type}</div>
            <div className="font-extrabold leading-none truncate">{title}</div>
          </div>
        </div>
        {playable && (
          <button className="w-7 h-7 flex items-center justify-center bg-lime-300 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <Play className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
