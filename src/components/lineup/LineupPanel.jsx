import { useState } from 'react';
import { POSITIONS } from '../../data/positions';

export default function LineupPanel({ lineups, activeLineupId, players, dispatch }) {
  const [assigning, setAssigning] = useState(null); // slot number being assigned
  const activeLineup = lineups.find(l => l.id === activeLineupId);

  const handleNewLineup = () => {
    const name = `Lineup ${lineups.length + 1}`;
    dispatch({ type: 'ADD_LINEUP', name });
  };

  const handleDeleteLineup = (id) => {
    dispatch({ type: 'DELETE_LINEUP', id });
  };

  const handleAssign = (slot, playerId) => {
    dispatch({ type: 'ASSIGN_SLOT', slot, playerId });
    setAssigning(null);
  };

  const handleSetLibero = (playerId) => {
    dispatch({ type: 'SET_LIBERO', playerId });
  };

  const getPlayerById = (id) => players.find(p => p.id === id);
  const slotLabels = { 1: '1 (RB)', 2: '2 (RF)', 3: '3 (CF)', 4: '4 (LF)', 5: '5 (LB)', 6: '6 (CB)' };

  // Players already assigned to slots in active lineup
  const assignedIds = activeLineup
    ? new Set(Object.values(activeLineup.slots).filter(Boolean))
    : new Set();

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Lineup selector */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5 overflow-x-auto">
        {lineups.map(l => (
          <button
            key={l.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_LINEUP', id: l.id })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              l.id === activeLineupId
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            {l.name}
          </button>
        ))}
        <button
          onClick={handleNewLineup}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-surface-3)] text-gray-300 whitespace-nowrap"
        >
          + New
        </button>
      </div>

      {activeLineup ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Slot assignments */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-2">Starting 6 (Rotation 1)</h3>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map(slot => {
                const playerId = activeLineup.slots[slot];
                const player = playerId ? getPlayerById(playerId) : null;
                const posInfo = player ? (POSITIONS[player.position] || POSITIONS.ds) : null;

                return (
                  <div
                    key={slot}
                    onClick={() => setAssigning(slot)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-white text-xs font-bold">
                      {slot}
                    </div>
                    <div className="text-xs text-gray-500 w-12">{slotLabels[slot]}</div>
                    {player ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: posInfo?.color }}
                        >
                          {player.number}
                        </div>
                        <span className="text-white text-sm">{player.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Tap to assign</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Libero */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-2">Libero</h3>
            <div className="space-y-1">
              {players.filter(p => p.position === 'libero').map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSetLibero(p.id)}
                  className={`flex items-center gap-2 w-full p-3 rounded-xl text-left ${
                    activeLineup.liberoId === p.id
                      ? 'bg-[var(--color-libero)]/20 border border-[var(--color-libero)]/30'
                      : 'bg-[var(--color-surface-2)] border border-white/5'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: POSITIONS.libero.color }}>
                    {p.number}
                  </div>
                  <span className="text-white text-sm">{p.name}</span>
                  {activeLineup.liberoId === p.id && <span className="ml-auto text-xs text-[var(--color-libero)]">Active</span>}
                </button>
              ))}
              {players.filter(p => p.position === 'libero').length === 0 && (
                <div className="text-gray-500 text-xs p-3">Add a libero to the roster first</div>
              )}
            </div>
          </div>

          {/* Delete lineup */}
          {lineups.length > 1 && (
            <button
              onClick={() => handleDeleteLineup(activeLineup.id)}
              className="w-full py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-medium"
            >
              Delete this lineup
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Create a lineup to get started
        </div>
      )}

      {/* Player picker modal for slot assignment */}
      {assigning !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setAssigning(null)}>
          <div
            className="w-full max-w-lg mx-auto bg-[var(--color-surface-2)] rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold mb-3">Assign to Position {assigning}</h3>
            <div className="space-y-1.5">
              {/* Unassign option */}
              <button
                onClick={() => handleAssign(assigning, null)}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-[var(--color-surface-3)] text-gray-400 text-sm"
              >
                — Empty —
              </button>
              {players.filter(p => p.position !== 'libero').map(p => {
                const pos = POSITIONS[p.position] || POSITIONS.ds;
                const alreadyUsed = assignedIds.has(p.id) && activeLineup.slots[assigning] !== p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAssign(assigning, p.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl ${
                      alreadyUsed ? 'opacity-40' : ''
                    } bg-[var(--color-surface-3)] text-left`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: pos.color }}>
                      {p.number}
                    </div>
                    <div>
                      <div className="text-white text-sm">{p.name}</div>
                      <div className="text-gray-400 text-xs">{pos.label}{alreadyUsed ? ' (assigned elsewhere)' : ''}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
