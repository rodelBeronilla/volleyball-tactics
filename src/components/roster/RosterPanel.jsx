import { useState } from 'react';
import { POSITIONS } from '../../data/positions';
import { ARCHETYPES, getTopAttributes, ATTRIBUTE_LABELS } from '../../data/archetypes';
import { getEffectiveRatings } from '../../utils/statRatings';
import PlayerForm from './PlayerForm';

export default function RosterPanel({ players, dispatch, activeLineup, statEntries = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);

  const handleEdit = (player) => {
    setEditPlayer(player);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditPlayer(null);
    setShowForm(true);
  };

  const handleSave = (player) => {
    if (editPlayer) {
      dispatch({ type: 'UPDATE_PLAYER', player: { ...editPlayer, ...player } });
    } else {
      dispatch({ type: 'ADD_PLAYER', player });
    }
    setShowForm(false);
    setEditPlayer(null);
  };

  const handleDelete = (id) => {
    const player = players.find(p => p.id === id);
    const name = player?.name || 'this player';
    if (!window.confirm(`Delete ${name}? This will also remove them from any lineups.`)) return;
    dispatch({ type: 'DELETE_PLAYER', id });
  };

  // Which players are in the active lineup
  const assignedIds = activeLineup ? new Set([...Object.values(activeLineup.slots), activeLineup.liberoId].filter(Boolean)) : new Set();

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
        <h2 className="text-lg font-bold text-white">Roster</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95 transition-transform"
        >
          + Add Player
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {players.map(p => {
          const pos = POSITIONS[p.position] || POSITIONS.ds;
          const inLineup = assignedIds.has(p.id);
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: pos.color }}
              >
                {p.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{p.name}</div>
                <div className="text-xs text-gray-400">
                  {pos.label}
                  {p.archetype && ARCHETYPES[p.archetype] ? ` • ${ARCHETYPES[p.archetype].label}` : ''}
                  {inLineup ? ' • In lineup' : ''}
                </div>
                {(() => {
                  const eff = getEffectiveRatings(p, statEntries);
                  if (eff.hasStats) {
                    // Show stat-adjusted top attributes with delta
                    const top = getTopAttributes({ ratings: eff.ratings });
                    return (
                      <div className="flex gap-1 mt-0.5">
                        {top.map(({ attr, value }) => {
                          const delta = Math.round((value - eff.baseline[attr]) * 10) / 10;
                          return (
                            <span key={attr} className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 text-[10px]">
                              {ATTRIBUTE_LABELS[attr]} {value}
                              {delta !== 0 && <span className={delta > 0 ? 'text-green-400 ml-0.5' : 'text-red-400 ml-0.5'}>{delta > 0 ? '+' : ''}{delta}</span>}
                            </span>
                          );
                        })}
                      </div>
                    );
                  }
                  if (p.archetype && ARCHETYPES[p.archetype]) {
                    return (
                      <div className="flex gap-1 mt-0.5">
                        {getTopAttributes(ARCHETYPES[p.archetype]).map(({ attr, value }) => (
                          <span key={attr} className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 text-[10px]">
                            {ATTRIBUTE_LABELS[attr]} {value}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(p)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-3)] text-gray-300 text-xs active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs active:scale-95"
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}
        {players.length === 0 && (
          <div className="text-center text-gray-500 py-8">No players yet. Tap "+ Add Player" to get started.</div>
        )}
      </div>

      {showForm && (
        <PlayerForm
          player={editPlayer}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditPlayer(null); }}
        />
      )}
    </div>
  );
}
