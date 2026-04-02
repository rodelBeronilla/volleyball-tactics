import { useState } from 'react';
import { analyzeRotation } from '../../utils/rotationAnalysis';

export default function RotationSummary({ rotation, placements }) {
  const [expanded, setExpanded] = useState(false);

  if (!placements || placements.length === 0) return null;

  const analysis = analyzeRotation(rotation, placements);

  return (
    <div className="mx-2 my-0.5 shrink-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-white/5"
      >
        <span className="text-xs font-semibold text-white truncate">{analysis.headline}</span>
        <span className="text-gray-400 text-xs ml-2 shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-0.5 px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5 text-xs space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Front</div>
              {analysis.frontRow.map(p => (
                <div key={p.slot} className="text-gray-300 text-xs">
                  {p.playerName} <span className="text-gray-500">({p.roleLabel})</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Back</div>
              {analysis.backRow.map(p => (
                <div key={p.slot} className="text-gray-300 text-xs">
                  {p.playerName} <span className="text-gray-500">({p.roleLabel})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {analysis.attackOptions.map((opt, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300 text-xs">
                {opt}
              </span>
            ))}
          </div>

          <div className="text-gray-300 text-xs">{analysis.serveReceive}</div>
        </div>
      )}
    </div>
  );
}
