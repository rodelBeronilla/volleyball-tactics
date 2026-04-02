import { useState } from 'react';
import { POSITIONS, ZONE_CENTERS } from '../../data/positions';
import { ARCHETYPES, ATTRIBUTES } from '../../data/archetypes';

// Expected position for each slot in a standard 5-1 (Rotation 1)
const SLOT_EXPECTED = {
  1: 'setter',    // RB - Setter
  2: 'opposite',  // RF - Opposite
  3: 'middle',    // CF - Middle 1
  4: 'outside',   // LF - Outside 1
  5: 'middle',    // LB - Middle 2
  6: 'outside',   // CB - Outside 2
};

const SLOT_ROLE_LABELS = {
  1: 'Setter', 2: 'Opposite', 3: 'Middle', 4: 'Outside', 5: 'Middle', 6: 'Outside',
};

function getRecommendation(slot, players, assignedIds) {
  const expected = SLOT_EXPECTED[slot];
  if (!expected) return null;
  const available = players.filter(p =>
    p.position === expected && !assignedIds.has(p.id)
  );
  if (available.length === 0) return null;
  // Sort by best base ratings sum
  available.sort((a, b) => {
    const sumA = ATTRIBUTES.reduce((s, attr) => s + ((a.baseRatings || {})[attr] || 5), 0);
    const sumB = ATTRIBUTES.reduce((s, attr) => s + ((b.baseRatings || {})[attr] || 5), 0);
    return sumB - sumA;
  });
  return available[0];
}

export default function LineupPanel({ lineups, activeLineupId, players, dispatch }) {
  const [assigning, setAssigning] = useState(null);
  const activeLineup = lineups.find(l => l.id === activeLineupId);

  const handleNewLineup = () => {
    dispatch({ type: 'ADD_LINEUP', name: `Lineup ${lineups.length + 1}` });
  };

  const handleAssign = (slot, playerId) => {
    dispatch({ type: 'ASSIGN_SLOT', slot, playerId });
    setAssigning(null);
  };

  const handleSetLibero = (playerId) => {
    dispatch({ type: 'SET_LIBERO', playerId });
  };

  const getPlayerById = (id) => players.find(p => p.id === id);

  const assignedIds = activeLineup
    ? new Set(Object.values(activeLineup.slots).filter(Boolean))
    : new Set();

  // Auto-fill recommendation
  const handleAutoFill = () => {
    if (!activeLineup) return;
    const used = new Set(Object.values(activeLineup.slots).filter(Boolean));
    for (let slot = 1; slot <= 6; slot++) {
      if (activeLineup.slots[slot]) continue;
      const rec = getRecommendation(slot, players, used);
      if (rec) {
        dispatch({ type: 'ASSIGN_SLOT', slot, playerId: rec.id });
        used.add(rec.id);
      }
    }
    // Auto-assign libero
    if (!activeLineup.liberoId) {
      const liberos = players.filter(p => p.position === 'libero' && !used.has(p.id));
      if (liberos.length > 0) dispatch({ type: 'SET_LIBERO', playerId: liberos[0].id });
    }
  };

  const emptySlots = activeLineup ? [1,2,3,4,5,6].filter(s => !activeLineup.slots[s]).length : 6;

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Lineup selector */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5 overflow-x-auto shrink-0">
        {lineups.map(l => (
          <button
            key={l.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_LINEUP', id: l.id })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              l.id === activeLineupId ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            {l.name}
          </button>
        ))}
        <button onClick={handleNewLineup} className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-surface-3)] text-gray-300 whitespace-nowrap">
          + New
        </button>
      </div>

      {activeLineup ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Visual court layout */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-300">Court Positions (R1)</h3>
              {emptySlots > 0 && (
                <button onClick={handleAutoFill} className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                  Auto-Fill
                </button>
              )}
            </div>

            {/* SVG mini court */}
            <svg viewBox="-2 -8 94 105" className="w-full max-w-sm mx-auto" style={{ maxHeight: '280px' }}>
              {/* Court background */}
              <rect x="0" y="0" width="90" height="90" fill="#2d6b30" rx="2" />
              <rect x="0" y="0" width="90" height="90" fill="none" stroke="#fff" strokeWidth="0.5" rx="2" />
              {/* Net */}
              <line x1="0" y1="0" x2="90" y2="0" stroke="#555" strokeWidth="2" />
              <text x="45" y="-3" textAnchor="middle" fill="#888" fontSize="3.5" fontWeight="500">NET</text>
              {/* Attack line */}
              <line x1="0" y1="30" x2="90" y2="30" stroke="#fff" strokeWidth="0.3" strokeDasharray="2 1" />
              {/* Row labels */}
              <text x="45" y="17" textAnchor="middle" fill="#fff" opacity="0.15" fontSize="2.5">FRONT</text>
              <text x="45" y="75" textAnchor="middle" fill="#fff" opacity="0.15" fontSize="2.5">BACK</text>

              {/* Position slots */}
              {[1, 2, 3, 4, 5, 6].map(slot => {
                const zone = ZONE_CENTERS[slot];
                const playerId = activeLineup.slots[slot];
                const player = playerId ? getPlayerById(playerId) : null;
                const posInfo = player ? (POSITIONS[player.position] || POSITIONS.ds) : null;
                const expectedPos = SLOT_EXPECTED[slot];
                const expectedColor = POSITIONS[expectedPos]?.color || '#666';
                const rec = !player ? getRecommendation(slot, players, assignedIds) : null;

                return (
                  <g key={slot} transform={`translate(${zone.x}, ${zone.y})`}
                    onClick={() => setAssigning(slot)} style={{ cursor: 'pointer' }}>
                    {/* Slot circle */}
                    {player ? (
                      <>
                        <circle r="8" fill={posInfo.color} stroke="#fff" strokeWidth="0.5" />
                        <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="5" fontWeight="700" style={{ pointerEvents: 'none' }}>
                          {player.number}
                        </text>
                        <text y="12" textAnchor="middle" fill="#fff" fontSize="2.8" fontWeight="500" style={{ pointerEvents: 'none' }}>
                          {player.name.length > 8 ? player.name.slice(0, 7) + '…' : player.name}
                        </text>
                      </>
                    ) : (
                      <>
                        <circle r="8" fill="none" stroke={expectedColor} strokeWidth="1" strokeDasharray="2 1" opacity="0.6" />
                        <text textAnchor="middle" dominantBaseline="central" fill={expectedColor} fontSize="3" fontWeight="600" opacity="0.7" style={{ pointerEvents: 'none' }}>
                          {SLOT_ROLE_LABELS[slot]}
                        </text>
                        {rec && (
                          <text y="12" textAnchor="middle" fill="#888" fontSize="2.2" style={{ pointerEvents: 'none' }}>
                            {rec.name}?
                          </text>
                        )}
                      </>
                    )}
                    {/* Slot number badge */}
                    <g transform="translate(-6, -6)">
                      <circle r="2.5" fill="#000" opacity="0.5" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="2.5" fontWeight="600" style={{ pointerEvents: 'none' }}>
                        {slot}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Libero */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-1.5">Libero</h3>
            <div className="space-y-1">
              {players.filter(p => p.position === 'libero').map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSetLibero(p.id)}
                  className={`flex items-center gap-2 w-full p-3 rounded-xl text-left ${
                    activeLineup.liberoId === p.id
                      ? 'bg-orange-900/20 border border-orange-700/30'
                      : 'bg-[var(--color-surface-2)] border border-white/5'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: POSITIONS.libero.color }}>
                    {p.number}
                  </div>
                  <span className="text-white text-sm">{p.name}</span>
                  {activeLineup.liberoId === p.id && <span className="ml-auto text-xs text-orange-400">Active</span>}
                </button>
              ))}
              {players.filter(p => p.position === 'libero').length === 0 && (
                <div className="text-gray-500 text-xs p-3">Add a libero to the roster first</div>
              )}
            </div>
          </div>

          {/* 5-1 recommendations */}
          {(() => {
            const posCount = {};
            for (let s = 1; s <= 6; s++) {
              const pid = activeLineup.slots[s];
              const p = pid ? getPlayerById(pid) : null;
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
                <div className="text-xs font-bold text-yellow-400 mb-1">5-1 System</div>
                {issues.map((issue, i) => (
                  <div key={i} className="text-xs text-yellow-400/80">{issue}</div>
                ))}
              </div>
            );
          })()}

          {/* Delete */}
          {lineups.length > 1 && (
            <button
              onClick={() => { if (window.confirm(`Delete "${activeLineup.name}"?`)) dispatch({ type: 'DELETE_LINEUP', id: activeLineup.id }); }}
              className="w-full py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-medium"
            >
              Delete this lineup
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-6">
          <p className="text-lg mb-2 text-white font-bold">Create a Lineup</p>
          <p className="text-sm mb-4 text-center">Build your starting 6 by tapping court positions.</p>
          <button onClick={handleNewLineup} className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95">
            + New Lineup
          </button>
        </div>
      )}

      {/* Player picker modal */}
      {assigning !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setAssigning(null)}>
          <div
            className="w-full max-w-lg mx-auto bg-[var(--color-surface-2)] rounded-t-2xl p-4 max-h-[65vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">Position {assigning} — {SLOT_ROLE_LABELS[assigning]}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: POSITIONS[SLOT_EXPECTED[assigning]]?.color + '33', color: POSITIONS[SLOT_EXPECTED[assigning]]?.color }}>
                {POSITIONS[SLOT_EXPECTED[assigning]]?.label || ''}
              </span>
            </div>

            {/* Recommended players first */}
            {(() => {
              const expected = SLOT_EXPECTED[assigning];
              const recommended = players.filter(p => p.position === expected && p.position !== 'libero');
              const others = players.filter(p => p.position !== expected && p.position !== 'libero');

              return (
                <div className="space-y-1.5">
                  <button onClick={() => handleAssign(assigning, null)} className="flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-gray-400 text-sm">
                    — Empty —
                  </button>

                  {recommended.length > 0 && (
                    <div className="text-xs text-gray-500 font-semibold mt-2 mb-1">Recommended ({POSITIONS[expected]?.label})</div>
                  )}
                  {recommended.map(p => {
                    const pos = POSITIONS[p.position] || POSITIONS.ds;
                    const used = assignedIds.has(p.id) && activeLineup.slots[assigning] !== p.id;
                    return (
                      <button key={p.id} onClick={() => handleAssign(assigning, p.id)}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-left ${used ? 'opacity-40' : ''}`}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: pos.color }}>
                          {p.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm">{p.name}</div>
                          <div className="text-gray-400 text-xs">{pos.label}{used ? ' (in use)' : ''}</div>
                        </div>
                      </button>
                    );
                  })}

                  {others.length > 0 && (
                    <div className="text-xs text-gray-500 font-semibold mt-2 mb-1">Other Players</div>
                  )}
                  {others.map(p => {
                    const pos = POSITIONS[p.position] || POSITIONS.ds;
                    const used = assignedIds.has(p.id) && activeLineup.slots[assigning] !== p.id;
                    return (
                      <button key={p.id} onClick={() => handleAssign(assigning, p.id)}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-left ${used ? 'opacity-40' : ''}`}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: pos.color }}>
                          {p.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm">{p.name}</div>
                          <div className="text-gray-400 text-xs">{pos.label}{used ? ' (in use)' : ''}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
