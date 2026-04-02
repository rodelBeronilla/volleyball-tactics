import { useState } from 'react';
import { POSITIONS, ZONE_CENTERS } from '../../data/positions';
import { ATTRIBUTES } from '../../data/archetypes';

// Standard 5-1 slot expectations (Rotation 1)
const SLOT_EXPECTED = {
  1: 'setter', 2: 'opposite', 3: 'middle', 4: 'outside', 5: 'middle', 6: 'outside',
};
const SLOT_ROLE = {
  1: 'S', 2: 'OPP', 3: 'MB1', 4: 'OH1', 5: 'MB2', 6: 'OH2',
};

function getBestAvailable(position, players, usedIds) {
  return players
    .filter(p => p.position === position && !usedIds.has(p.id))
    .sort((a, b) => {
      const sumA = ATTRIBUTES.reduce((s, attr) => s + ((a.baseRatings || {})[attr] || 5), 0);
      const sumB = ATTRIBUTES.reduce((s, attr) => s + ((b.baseRatings || {})[attr] || 5), 0);
      return sumB - sumA;
    });
}

export default function LineupPanel({ lineups, activeLineupId, players, dispatch }) {
  const [assigning, setAssigning] = useState(null);
  const activeLineup = lineups.find(l => l.id === activeLineupId);

  const getPlayer = (id) => players.find(p => p.id === id);

  // Bench = all rostered non-libero players not in starting 6
  const starters = activeLineup ? Object.values(activeLineup.slots).filter(Boolean) : [];
  const bench = players.filter(p => p.position !== 'libero' && !starters.includes(p.id));

  const handleAssign = (slot, playerId) => {
    dispatch({ type: 'ASSIGN_SLOT', slot, playerId });
    setAssigning(null);
  };

  const handleAutoFill = () => {
    if (!activeLineup) return;
    const used = new Set(Object.values(activeLineup.slots).filter(Boolean));
    for (let slot = 1; slot <= 6; slot++) {
      if (activeLineup.slots[slot]) continue;
      const best = getBestAvailable(SLOT_EXPECTED[slot], players, used);
      if (best.length > 0) {
        dispatch({ type: 'ASSIGN_SLOT', slot, playerId: best[0].id });
        used.add(best[0].id);
      }
    }
    if (!activeLineup.liberoId) {
      const lib = players.find(p => p.position === 'libero' && !used.has(p.id));
      if (lib) dispatch({ type: 'SET_LIBERO', playerId: lib.id });
    }
  };

  const emptySlots = activeLineup ? [1,2,3,4,5,6].filter(s => !activeLineup.slots[s]).length : 6;

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Lineup selector */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5 overflow-x-auto shrink-0">
        {lineups.map(l => (
          <button key={l.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_LINEUP', id: l.id })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              l.id === activeLineupId ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >{l.name}</button>
        ))}
        <button onClick={() => dispatch({ type: 'ADD_LINEUP', name: `Lineup ${lineups.length + 1}` })}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-surface-3)] text-gray-300 whitespace-nowrap">
          + New
        </button>
      </div>

      {activeLineup ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Court visual + Auto-fill */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">Starting 6</span>
            {emptySlots > 0 && (
              <button onClick={handleAutoFill}
                className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                Auto-Fill
              </button>
            )}
          </div>

          {/* SVG mini court */}
          <svg viewBox="-5 -10 100 110" className="w-full" style={{ maxHeight: '260px' }}>
            <rect x="0" y="0" width="90" height="90" fill="#2d6b30" rx="3" />
            <rect x="0" y="0" width="90" height="90" fill="none" stroke="#fff" strokeWidth="0.6" rx="3" />
            <line x1="0" y1="0.5" x2="90" y2="0.5" stroke="#aaa" strokeWidth="1.5" />
            <text x="45" y="-3" textAnchor="middle" fill="#777" fontSize="3.5">NET</text>
            <line x1="0" y1="30" x2="90" y2="30" stroke="#fff" strokeWidth="0.3" strokeDasharray="2 1" opacity="0.5" />

            {[1,2,3,4,5,6].map(slot => {
              const z = ZONE_CENTERS[slot];
              const pid = activeLineup.slots[slot];
              const player = pid ? getPlayer(pid) : null;
              const posInfo = player ? (POSITIONS[player.position] || POSITIONS.ds) : null;
              const expected = SLOT_EXPECTED[slot];
              const expColor = POSITIONS[expected]?.color || '#666';

              return (
                <g key={slot} transform={`translate(${z.x}, ${z.y})`}
                  onClick={() => setAssigning(slot)} style={{ cursor: 'pointer' }}>

                  {player ? (
                    <>
                      <circle r="9" fill={posInfo.color} stroke="#fff" strokeWidth="0.6" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#fff"
                        fontSize="5.5" fontWeight="700" style={{ pointerEvents: 'none' }}>
                        {player.number}
                      </text>
                      <text y="13" textAnchor="middle" fill="#fff" fontSize="3" fontWeight="500"
                        style={{ pointerEvents: 'none' }}>
                        {player.name.length > 7 ? player.name.slice(0, 6) + '…' : player.name}
                      </text>
                    </>
                  ) : (
                    <>
                      <circle r="9" fill="rgba(255,255,255,0.03)" stroke={expColor} strokeWidth="0.8"
                        strokeDasharray="2 1.5" />
                      <text textAnchor="middle" dominantBaseline="central" fill={expColor}
                        fontSize="3.5" fontWeight="600" opacity="0.8" style={{ pointerEvents: 'none' }}>
                        {SLOT_ROLE[slot]}
                      </text>
                    </>
                  )}

                  {/* Slot # */}
                  <circle cx="-7" cy="-7" r="2.5" fill="#000" opacity="0.6" />
                  <text x="-7" y="-7" textAnchor="middle" dominantBaseline="central"
                    fill="#fff" fontSize="2.5" fontWeight="600" style={{ pointerEvents: 'none' }}>
                    {slot}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Libero */}
          <div>
            <span className="text-xs font-bold text-gray-300">Libero</span>
            <div className="mt-1 space-y-1">
              {players.filter(p => p.position === 'libero').map(p => (
                <button key={p.id}
                  onClick={() => dispatch({ type: 'SET_LIBERO', playerId: p.id })}
                  className={`flex items-center gap-2 w-full p-2.5 rounded-xl text-left ${
                    activeLineup.liberoId === p.id
                      ? 'bg-orange-900/20 border border-orange-700/30'
                      : 'bg-[var(--color-surface-2)] border border-white/5'
                  }`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: POSITIONS.libero.color }}>{p.number}</div>
                  <span className="text-white text-sm flex-1">{p.name}</span>
                  {activeLineup.liberoId === p.id && <span className="text-xs text-orange-400">Active</span>}
                </button>
              ))}
              {players.filter(p => p.position === 'libero').length === 0 && (
                <div className="text-gray-500 text-xs p-2">Add a libero in Roster first</div>
              )}
            </div>
          </div>

          {/* Bench */}
          <div>
            <span className="text-xs font-bold text-gray-300">Bench ({bench.length})</span>
            {bench.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {bench.map(p => {
                  const pos = POSITIONS[p.position] || POSITIONS.ds;
                  return (
                    <div key={p.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: pos.color }}>{p.number}</div>
                      <span className="text-xs text-gray-300">{p.name}</span>
                      <span className="text-xs text-gray-500">{pos.abbr}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-xs mt-1">All eligible players are starting</div>
            )}
          </div>

          {/* Substitution rules */}
          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
            <div className="text-xs font-bold text-gray-300 mb-1.5">Substitution Rules</div>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                  style={{ background: POSITIONS.libero.color + '33', color: POSITIONS.libero.color }}>L</span>
                <div>
                  <span className="text-gray-300 font-medium">Libero</span> replaces middle blockers in back row automatically.
                  {activeLineup.liberoId && getPlayer(activeLineup.liberoId) && (
                    <span className="text-orange-400"> ({getPlayer(activeLineup.liberoId).name} active)</span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white/10 text-white text-[10px] font-bold">↔</span>
                <div>
                  <span className="text-gray-300 font-medium">Substitutions:</span> Each team gets {' '}
                  <span className="text-white font-medium">6 subs per set</span>. A player who is subbed out can only return for the player who replaced them.
                </div>
              </div>
              {(() => {
                // Show which MBs will be replaced by libero and in which rotations
                const mbSlots = [1,2,3,4,5,6].filter(s => {
                  const p = activeLineup.slots[s] ? getPlayer(activeLineup.slots[s]) : null;
                  return p?.position === 'middle';
                });
                if (mbSlots.length === 0 || !activeLineup.liberoId) return null;
                const libero = getPlayer(activeLineup.liberoId);
                return (
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-green-900/30 text-green-400 text-[10px] font-bold">!</span>
                    <div>
                      <span className="text-gray-300 font-medium">Auto-sub trigger:</span>{' '}
                      {mbSlots.map(s => {
                        const mb = getPlayer(activeLineup.slots[s]);
                        return mb ? `${mb.name} (slot ${s})` : null;
                      }).filter(Boolean).join(' and ')}{' '}
                      → {libero?.name} when in back row (positions 1, 5, 6)
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 5-1 warnings */}
          {(() => {
            const posCount = {};
            for (let s = 1; s <= 6; s++) {
              const p = activeLineup.slots[s] ? getPlayer(activeLineup.slots[s]) : null;
              if (p) posCount[p.position] = (posCount[p.position] || 0) + 1;
            }
            const issues = [];
            if ((posCount.setter || 0) !== 1) issues.push('Need exactly 1 setter');
            if ((posCount.outside || 0) < 2) issues.push('Need 2 outside hitters');
            if ((posCount.middle || 0) < 2) issues.push('Need 2 middle blockers');
            if ((posCount.opposite || 0) !== 1) issues.push('Need 1 opposite');
            if (issues.length === 0) return null;
            return (
              <div className="p-3 rounded-xl bg-yellow-900/10 border border-yellow-800/20">
                <div className="text-xs font-bold text-yellow-400 mb-1">5-1 System Issues</div>
                {issues.map((issue, i) => <div key={i} className="text-xs text-yellow-400/80">{issue}</div>)}
              </div>
            );
          })()}

          {/* Delete */}
          {lineups.length > 1 && (
            <button
              onClick={() => { if (window.confirm(`Delete "${activeLineup.name}"?`)) dispatch({ type: 'DELETE_LINEUP', id: activeLineup.id }); }}
              className="w-full py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-medium">
              Delete Lineup
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-6">
          <p className="text-lg mb-2 text-white font-bold">Create a Lineup</p>
          <p className="text-sm mb-4 text-center">Tap court positions to assign players.</p>
          <button onClick={() => dispatch({ type: 'ADD_LINEUP', name: 'Lineup 1' })}
            className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95">
            + New Lineup
          </button>
        </div>
      )}

      {/* Player picker modal */}
      {assigning !== null && activeLineup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setAssigning(null)}>
          <div className="w-full max-w-lg mx-auto bg-[var(--color-surface-2)] rounded-t-2xl p-4 max-h-[65vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Slot {assigning} — {SLOT_ROLE[assigning]}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: POSITIONS[SLOT_EXPECTED[assigning]]?.color + '33', color: POSITIONS[SLOT_EXPECTED[assigning]]?.color }}>
                {POSITIONS[SLOT_EXPECTED[assigning]]?.label}
              </span>
            </div>

            <div className="space-y-1.5">
              <button onClick={() => handleAssign(assigning, null)}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-gray-400 text-sm">
                — Remove —
              </button>

              {/* Recommended (matching position) */}
              {(() => {
                const expected = SLOT_EXPECTED[assigning];
                const slotsUsed = new Set(Object.values(activeLineup.slots).filter(Boolean));
                const recommended = players.filter(p => p.position === expected && p.position !== 'libero');
                const others = players.filter(p => p.position !== expected && p.position !== 'libero');

                return (
                  <>
                    {recommended.length > 0 && <div className="text-xs text-green-400 font-semibold mt-2 mb-1">Best Fit</div>}
                    {recommended.map(p => {
                      const pos = POSITIONS[p.position] || POSITIONS.ds;
                      const used = slotsUsed.has(p.id) && activeLineup.slots[assigning] !== p.id;
                      return (
                        <button key={p.id} onClick={() => handleAssign(assigning, p.id)}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-left ${used ? 'opacity-30' : ''}`}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: pos.color }}>{p.number}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm">{p.name}</div>
                            <div className="text-gray-400 text-xs">{pos.label}{used ? ' — already starting' : ''}</div>
                          </div>
                        </button>
                      );
                    })}

                    {others.length > 0 && <div className="text-xs text-gray-500 font-semibold mt-2 mb-1">Other</div>}
                    {others.map(p => {
                      const pos = POSITIONS[p.position] || POSITIONS.ds;
                      const used = slotsUsed.has(p.id) && activeLineup.slots[assigning] !== p.id;
                      return (
                        <button key={p.id} onClick={() => handleAssign(assigning, p.id)}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-left ${used ? 'opacity-30' : ''}`}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: pos.color }}>{p.number}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm">{p.name}</div>
                            <div className="text-gray-400 text-xs">{pos.label}{used ? ' — already starting' : ''}</div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
