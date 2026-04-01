import { useState } from 'react';
import { analyzeRotation } from '../../utils/rotationAnalysis';

export default function RotationSummary({ rotation, placements }) {
  const [expanded, setExpanded] = useState(false);

  if (!placements || placements.length === 0) return null;

  const analysis = analyzeRotation(rotation, placements);

  return (
    <div className="mx-2 mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5 hover:border-white/10 transition-colors"
      >
        <span className="text-sm font-semibold text-white truncate">{analysis.headline}</span>
        <span className="text-gray-400 text-xs ml-2 shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5 space-y-2 text-xs">
          {/* Front/Back Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Front Row</div>
              {analysis.frontRow.map(p => (
                <div key={p.slot} className="text-gray-300">
                  <span className="text-gray-500">{p.slot}.</span> {p.playerName}
                  <span className="text-gray-500 ml-1">({p.roleLabel})</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Back Row</div>
              {analysis.backRow.map(p => (
                <div key={p.slot} className="text-gray-300">
                  <span className="text-gray-500">{p.slot}.</span> {p.playerName}
                  <span className="text-gray-500 ml-1">({p.roleLabel})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Options */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Attack Options</div>
            <div className="flex flex-wrap gap-1">
              {analysis.attackOptions.map((opt, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300 text-[11px]">
                  {opt}
                </span>
              ))}
            </div>
          </div>

          {/* Serve Receive */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Serve Receive</div>
            <div className="text-gray-300">{analysis.serveReceive}</div>
          </div>
        </div>
      )}
    </div>
  );
}
