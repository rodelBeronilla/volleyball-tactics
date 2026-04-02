import { useState, useMemo } from 'react';
import { POSITIONS } from '../../data/positions';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { deriveRotation, isBackRow } from '../../utils/rotations';

export default function LiveEntry({ match, players, lineups, statEntries, dispatch, currentRotation, activeSetNumber }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const lineup = lineups.find(l => l.id === match.lineupId);

  // Derive who is on court in this rotation
  const onCourt = useMemo(() => {
    if (!lineup) return [];
    const slots = deriveRotation(lineup.slots, currentRotation);
    const result = [];
    for (let pos = 1; pos <= 6; pos++) {
      let playerId = slots[pos];
      let isLibero = false;
      if (playerId && lineup.liberoId && isBackRow(pos)) {
        const player = players.find(p => p.id === playerId);
        if (player && player.position === 'middle') {
          playerId = lineup.liberoId;
          isLibero = true;
        }
      }
      const player = players.find(p => p.id === playerId);
      if (player) result.push({ ...player, slot: pos, isLibero });
    }
    return result;
  }, [lineup, players, currentRotation]);

  // Recent entries for this match (last 15)
  const recentEntries = useMemo(() => {
    return statEntries
      .filter(e => e.matchId === match.id)
      .slice(-15)
      .reverse();
  }, [statEntries, match.id]);

  const handleRecordStat = (statKey) => {
    if (!selectedPlayer) return;
    dispatch({
      type: 'RECORD_STAT',
      matchId: match.id,
      setNumber: activeSetNumber,
      playerId: selectedPlayer,
      rotation: currentRotation,
      stat: statKey,
    });
  };

  const handleUndo = (statId) => {
    dispatch({ type: 'UNDO_STAT', statId });
  };

  const handleNewSet = () => {
    dispatch({ type: 'ADD_SET', matchId: match.id });
  };

  const handleEndMatch = () => {
    if (!window.confirm('End this match?')) return;
    dispatch({ type: 'END_MATCH', matchId: match.id });
  };

  const currentSet = match.sets.find(s => s.number === activeSetNumber);

  return (
    <div className="flex flex-col h-full">
      {/* Match header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5">
        <div className="min-w-0">
          <div className="text-white font-bold text-sm truncate">vs {match.opponent}</div>
          <div className="text-[10px] text-gray-400">Set {activeSetNumber} · R{currentRotation}</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Set score quick inputs */}
          <div className="flex items-center gap-1 text-xs">
            <input
              type="number"
              min="0"
              value={currentSet?.ourScore || 0}
              onChange={e => dispatch({ type: 'UPDATE_SET_SCORE', matchId: match.id, setNumber: activeSetNumber, ourScore: parseInt(e.target.value) || 0, theirScore: currentSet?.theirScore || 0 })}
              className="w-10 px-1 py-1 rounded bg-[var(--color-surface)] text-white text-center border border-white/10"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              value={currentSet?.theirScore || 0}
              onChange={e => dispatch({ type: 'UPDATE_SET_SCORE', matchId: match.id, setNumber: activeSetNumber, ourScore: currentSet?.ourScore || 0, theirScore: parseInt(e.target.value) || 0 })}
              className="w-10 px-1 py-1 rounded bg-[var(--color-surface)] text-white text-center border border-white/10"
            />
          </div>
          <button onClick={handleNewSet} className="px-2 py-1 rounded bg-[var(--color-surface-3)] text-gray-300 text-[10px] font-bold">
            +Set
          </button>
          <button onClick={handleEndMatch} className="px-2 py-1 rounded bg-red-900/30 text-red-400 text-[10px] font-bold">
            End
          </button>
        </div>
      </div>

      {/* Set tabs */}
      {match.sets.length > 1 && (
        <div className="flex gap-1 px-3 py-1.5 bg-[var(--color-surface)] border-b border-white/5 overflow-x-auto">
          {match.sets.map(s => (
            <button
              key={s.number}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SET', setNumber: s.number })}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                s.number === activeSetNumber
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-3)] text-gray-400'
              }`}
            >
              S{s.number}{s.ourScore || s.theirScore ? ` ${s.ourScore}-${s.theirScore}` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Rotation quick-select */}
      <div className="flex gap-1 px-3 py-1.5 bg-[var(--color-surface)] border-b border-white/5">
        {[1,2,3,4,5,6].map(r => (
          <button
            key={r}
            onClick={() => dispatch({ type: 'SET_ROTATION', rotation: r })}
            className={`flex-1 py-1 rounded text-[10px] font-bold ${
              r === currentRotation
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            R{r}
          </button>
        ))}
      </div>

      {/* Player quick-select */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-[var(--color-surface)] border-b border-white/5">
        {onCourt.map(p => {
          const posInfo = p.isLibero ? POSITIONS.libero : (POSITIONS[p.position] || POSITIONS.ds);
          const isActive = selectedPlayer === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(isActive ? null : p.id)}
              className={`flex flex-col items-center shrink-0 px-2 py-1.5 rounded-lg transition-all ${
                isActive ? 'ring-2 ring-white/40 scale-105' : 'opacity-70'
              }`}
              style={{ background: isActive ? posInfo.color + '33' : 'transparent' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: posInfo.color }}
              >
                {p.number}
              </div>
              <span className="text-[10px] text-gray-300 mt-0.5 truncate max-w-[3rem]">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Rally outcome buttons — always visible */}
      <div className="flex gap-2 px-3 py-2 bg-[var(--color-surface)] border-b border-white/5">
        <button
          onClick={() => handleRecordStat('rallyWon')}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-green-900/40 text-green-400 border border-green-700/40 active:scale-95 transition-transform"
        >
          Rally Won
        </button>
        <button
          onClick={() => handleRecordStat('rallyLost')}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-red-900/40 text-red-400 border border-red-700/40 active:scale-95 transition-transform"
        >
          Rally Lost
        </button>
      </div>

      {/* Stat buttons — scrollable area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {selectedPlayer ? (
          PLAYER_STAT_GROUPS.map(group => (
            <div key={group.id}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 px-1">{group.label}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {group.stats.map(statKey => {
                  const stat = STATS[statKey];
                  return (
                    <button
                      key={statKey}
                      onClick={() => handleRecordStat(statKey)}
                      className={`py-3 rounded-lg text-xs font-bold active:scale-95 transition-transform ${
                        stat.positive
                          ? 'bg-green-900/30 text-green-400 border border-green-800/30'
                          : 'bg-red-900/30 text-red-400 border border-red-800/30'
                      }`}
                    >
                      {stat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            Select a player above to record stats
          </div>
        )}
      </div>

      {/* Recent entries feed */}
      {recentEntries.length > 0 && (
        <div className="border-t border-white/5 bg-[var(--color-surface-2)] max-h-28 overflow-y-auto">
          <div className="px-3 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Recent</div>
            {recentEntries.map(e => {
              const player = players.find(p => p.id === e.playerId);
              const stat = STATS[e.stat];
              return (
                <div key={e.id} className="flex items-center justify-between py-0.5">
                  <span className="text-[11px] text-gray-300">
                    <span className="text-gray-500">R{e.rotation} S{e.setNumber}</span>
                    {' '}{player?.name || '?'} — <span className={stat?.positive ? 'text-green-400' : 'text-red-400'}>{stat?.label || e.stat}</span>
                  </span>
                  <button
                    onClick={() => handleUndo(e.id)}
                    className="text-gray-600 hover:text-red-400 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
