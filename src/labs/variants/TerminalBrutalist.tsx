import { Plus, Play, Terminal } from 'lucide-react';

// Iteration 02 — Terminal Brutalist
// Near-black canvas, monospace uppercase type, zero corner radius, neon outlines,
// hard *colored* offset shadows. The raw, technical reading of neobrutalism.

const ink = '#0a0a0b';
const lime = '#a3e635';
const cyan = '#22d3ee';
const magenta = '#f472b6';

export function TerminalBrutalist() {
  return (
    <div
      className="w-full h-full min-h-[540px] p-8 relative font-mono"
      style={{
        backgroundColor: ink,
        backgroundImage:
          'linear-gradient(#ffffff0d 1px, transparent 1px), linear-gradient(90deg, #ffffff0d 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        color: '#e5e7eb',
      }}
    >
      {/* toolbar */}
      <div
        className="inline-flex items-center gap-3 border-2 px-3 py-2"
        style={{ borderColor: lime, boxShadow: `4px 4px 0 0 ${lime}` }}
      >
        <Terminal className="w-4 h-4" style={{ color: lime }} />
        <span className="text-xs tracking-widest" style={{ color: lime }}>
          KIDDIE://FLOW
        </span>
        <button
          className="flex items-center gap-1 border-2 px-2 py-1 text-xs uppercase tracking-wider bg-transparent"
          style={{ borderColor: cyan, color: cyan, boxShadow: `3px 3px 0 0 ${cyan}` }}
        >
          <Plus className="w-3 h-3" /> node
        </button>
      </div>

      {/* connectors */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <line x1="290" y1="235" x2="380" y2="235" stroke={cyan} strokeWidth="2" strokeDasharray="6 4" />
        <line x1="660" y1="235" x2="750" y2="235" stroke={magenta} strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="380" cy="235" r="4" fill={cyan} />
        <circle cx="750" cy="235" r="4" fill={magenta} />
      </svg>

      {/* nodes */}
      <div className="relative flex items-center gap-[90px] mt-16" style={{ zIndex: 1 }}>
        <TerminalNode color={lime} tag="SRC" title="source.txt">
          <div className="text-xs" style={{ color: lime }}>
            &gt; a haiku about the sea
            <span className="inline-block w-2 h-4 ml-0.5 align-middle animate-pulse" style={{ backgroundColor: lime }} />
          </div>
        </TerminalNode>

        <TerminalNode color={cyan} tag="FN" title="rewrite()" playable>
          <div className="text-xs text-gray-400">
            <span style={{ color: cyan }}>const</span> out = poetic(
            <span style={{ color: magenta }}>{'{input_1}'}</span>)
          </div>
        </TerminalNode>

        <TerminalNode color={magenta} tag="OUT" title="result.log">
          <div className="text-xs text-gray-300">salt wind on the tide,<br />the horizon holds its breath…</div>
        </TerminalNode>
      </div>

      {/* status line */}
      <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
        <span>● run 3 nodes · 0 errors</span>
        <span style={{ color: lime }}>ready _</span>
      </div>
    </div>
  );
}

function TerminalNode({
  color,
  tag,
  title,
  children,
  playable = false,
}: {
  color: string;
  tag: string;
  title: string;
  children: React.ReactNode;
  playable?: boolean;
}) {
  return (
    <div className="w-[270px] border-2" style={{ borderColor: color, boxShadow: `5px 5px 0 0 ${color}`, backgroundColor: '#000000' }}>
      <div className="flex items-center justify-between px-2 py-1.5 border-b-2" style={{ borderColor: color }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] px-1.5 py-0.5 font-bold" style={{ backgroundColor: color, color: '#000' }}>
            {tag}
          </span>
          <span className="text-xs tracking-wider truncate" style={{ color }}>
            {title}
          </span>
        </div>
        {playable && (
          <button className="w-5 h-5 flex items-center justify-center border" style={{ borderColor: color, color }}>
            <Play className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
