import { useState, useMemo } from 'react';
import { POSITIONS } from '../../data/positions';
import { getSetterHitterSynergy, getFrontRowCombinations, getBackRowCombinations } from '../../utils/synergyAnalysis';

export default function SynergyView({ statEntries, players, activeLineup }) {
  const [view, setView] = useState('setter');

  const setters = players.filter(p => p.position === 'setter');

  const setterSynergy = useMemo(() => {
    if (!activeLineup || setters.length === 0) return [];
    return setters.map(s => ({
      setter: s,
      hitters: getSetterHitterSynergy(statEntries, activeLineup, s.id, players),
    }));
  }, [statEntries, activeLineup, setters, players]);

  const frontCombos = useMemo(() => {
    if (!activeLineup) return [];
    return getFrontRowCombinations(statEntries, activeLineup, players);
  }, [statEntries, activeLineup, players]);

  const backCombos = useMemo(() => {
    if (!activeLineup) return [];
    return getBackRowCombinations(statEntries, activeLineup, players);
  }, [statEntries, activeLineup, players]);

  if (!activeLineup) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a lineup first</div>;
  }

  const hasData = statEntries.length > 0;
  if (!hasData) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-4 text-center">Record match data to see pairing analysis</div>;
  }

  return (
    <div className="p-3 space-y-3">
      {/* Sub-view toggle */}
      <div className="flex gap-1">
        {[{ id: 'setter', label: 'Setter-Hitter' }, { id: 'front', label: 'Front Row' }, { id: 'back', label: 'Back Row' }].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              v.id === view ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Setter-Hitter Matrix */}
      {view === 'setter' && setterSynergy.map(({ setter, hitters }) => (
        <div key={setter.id}>
          <div className="text-xs font-bold text-gray-300 mb-1.5">
            With {setter.name} (#{setter.number})
          </div>
          {hitters.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">No attack data available</div>
          ) : (
            <div className="space-y-1">
              {hitters.map(h => (
                <div key={h.hitterId} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                  <div className="flex-1">
                    <span className="text-white text-xs font-medium">{h.hitterName}</span>
                    <span className="text-gray-400 text-xs ml-1">R{h.rotations.join(',')}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      (h.hitPct || 0) >= 0.25 ? 'bg-green-900/20 text-green-400' :
                      (h.hitPct || 0) >= 0.15 ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-red-900/20 text-red-400'
                    }`}>
                      {h.hitPct !== null ? `${(h.hitPct * 100).toFixed(0)}%` : '–'}
                    </span>
                    <span className="text-gray-400">{h.kills}K / {h.attempts}att</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Front Row Combos */}
      {view === 'front' && (
        <div>
          <div className="text-xs font-bold text-gray-300 mb-1.5">Front-Row Power Rankings</div>
          {frontCombos.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">No data</div>
          ) : (
            <div className="space-y-1.5">
              {frontCombos.map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-bold">R{c.rotation}</span>
                    <div className="flex gap-1.5 text-xs">
                      <span className="text-green-400">{c.kills}K</span>
                      <span className="text-blue-400">{c.blocks}B</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {c.players.map(p => {
                      const pos = POSITIONS[p.position] || POSITIONS.ds;
                      return (
                        <span key={p.id} className="px-2 py-0.5 rounded text-xs text-white" style={{ background: pos.color + '44' }}>
                          {p.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back Row Combos */}
      {view === 'back' && (
        <div>
          <div className="text-xs font-bold text-gray-300 mb-1.5">Back-Row Stability Rankings</div>
          {backCombos.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">No data</div>
          ) : (
            <div className="space-y-1.5">
              {backCombos.map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-bold">R{c.rotation}</span>
                    <div className="flex gap-1.5 text-xs">
                      {c.passAvg !== null && <span className="text-amber-400">Pass {c.passAvg.toFixed(1)}</span>}
                      <span className="text-blue-400">{c.digs} digs</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {c.players.map(p => {
                      const pos = POSITIONS[p.position] || POSITIONS.ds;
                      return (
                        <span key={p.id} className="px-2 py-0.5 rounded text-xs text-white" style={{ background: pos.color + '44' }}>
                          {p.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
