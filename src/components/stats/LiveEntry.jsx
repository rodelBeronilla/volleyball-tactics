import { useState, useMemo } from 'react';
import { POSITIONS } from '../../data/positions';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { deriveRotation, isBackRow } from '../../utils/rotations';
import ScoreTracker from './ScoreTracker';
import RotationMiniDashboard from './RotationMiniDashboard';
import RotationDashboard from './RotationDashboard';

export default function LiveEntry({ match, players, lineups, statEntries, dispatch, currentRotation, activeSetNumber }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showRotationDashboard, setShowRotationDashboard] = useState(false);

  const lineup = lineups.find(l => l.id === match.lineupId);

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

  const recentEntries = useMemo(() => {
    return statEntries.filter(e => e.matchId === match.id).slice(-10).reverse();
  }, [statEntries, match.id]);

  const handleRecordStat = (statKey) => {
    // Rally outcomes are team-level — don't require a selected player
    if (statKey === 'rallyWon' || statKey === 'rallyLost') {
      dispatch({
        type: 'RECORD_STAT',
        matchId: match.id,
        setNumber: activeSetNumber,
        playerId: '__team__',
        rotation: currentRotation,
        stat: statKey,
      });
      // Auto-update score
      const curSet = match.sets.find(s => s.number === activeSetNumber);
      if (statKey === 'rallyWon') {
        dispatch({ type: 'UPDATE_SET_SCORE', matchId: match.id, setNumber: activeSetNumber, ourScore: (curSet?.ourScore || 0) + 1, theirScore: curSet?.theirScore || 0 });
      } else {
        dispatch({ type: 'UPDATE_SET_SCORE', matchId: match.id, setNumber: activeSetNumber, ourScore: curSet?.ourScore || 0, theirScore: (curSet?.theirScore || 0) + 1 });
      }
      return;
    }
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

  const currentSet = match.sets.find(s => s.number === activeSetNumber);

  return (
    <div className="flex flex-col h-full">
      {/* Opponent + controls header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
        <div className="text-white font-bold text-sm truncate min-w-0 flex-1">vs {match.opponent}</div>
        <button onClick={() => dispatch({ type: 'ADD_SET', matchId: match.id })} className="px-2 py-1 rounded bg-[var(--color-surface-3)] text-gray-300 text-xs font-bold shrink-0">+Set</button>
        <button onClick={() => { if (window.confirm('End match?')) dispatch({ type: 'END_MATCH', matchId: match.id }); }} className="px-2 py-1 rounded bg-red-900/30 text-red-400 text-xs font-bold shrink-0">End</button>
      </div>

      {/* Score Tracker — large tap targets */}
      <ScoreTracker match={match} activeSetNumber={activeSetNumber} dispatch={dispatch} />

      {/* Set + Rotation bar — single compact row */}
      <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-surface)] border-b border-white/5 shrink-0 overflow-x-auto">
        {match.sets.length > 1 && match.sets.map(s => (
          <button
            key={s.number}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SET', setNumber: s.number })}
            className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${
              s.number === activeSetNumber ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            S{s.number}
          </button>
        ))}
        {match.sets.length > 1 && <div className="w-px h-4 bg-white/10 shrink-0" />}
        {[1,2,3,4,5,6].map(r => (
          <button
            key={r}
            onClick={() => dispatch({ type: 'SET_ROTATION', rotation: r })}
            className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${
              r === currentRotation ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            R{r}
          </button>
        ))}
      </div>

      {/* Rotation mini-dashboard */}
      <RotationMiniDashboard
        statEntries={statEntries}
        matchId={match.id}
        currentRotation={currentRotation}
        onExpandRotation={() => setShowRotationDashboard(true)}
      />

      {/* Player quick-select — horizontal scroll */}
      <div className="flex gap-2 px-2 py-1.5 overflow-x-auto bg-[var(--color-surface)] border-b border-white/5 shrink-0">
        {onCourt.map(p => {
          const posInfo = p.isLibero ? POSITIONS.libero : (POSITIONS[p.position] || POSITIONS.ds);
          const isActive = selectedPlayer === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(isActive ? null : p.id)}
              className={`flex flex-col items-center shrink-0 px-1.5 py-1 rounded-lg ${
                isActive ? 'ring-2 ring-white/50 bg-white/10' : 'opacity-60'
              }`}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: posInfo.color }}
              >
                {p.number}
              </div>
              <span className="text-xs text-gray-300 mt-0.5 truncate w-12 text-center">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Stat buttons — main scrollable area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {selectedPlayer ? (
          PLAYER_STAT_GROUPS.map(group => (
            <div key={group.id}>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 px-1">{group.label}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {group.stats.map(statKey => {
                  const stat = STATS[statKey];
                  return (
                    <button
                      key={statKey}
                      onClick={() => handleRecordStat(statKey)}
                      className={`py-3.5 rounded-lg text-xs font-bold active:scale-95 transition-transform ${
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
            Tap a player above to record their stats
          </div>
        )}
      </div>

      {/* Rally outcome — sticky bottom */}
      <div className="flex gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-t border-white/5 shrink-0">
        <button
          onClick={() => handleRecordStat('rallyWon')}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-green-900/40 text-green-400 border border-green-700/40 active:scale-95 transition-transform"
        >
          Point Won
        </button>
        <button
          onClick={() => handleRecordStat('rallyLost')}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-red-900/40 text-red-400 border border-red-700/40 active:scale-95 transition-transform"
        >
          Point Lost
        </button>
      </div>

      {/* Recent feed — collapsible */}
      {recentEntries.length > 0 && (
        <div className="border-t border-white/5 bg-[var(--color-surface)] max-h-20 overflow-y-auto shrink-0">
          <div className="px-3 py-1">
            {recentEntries.slice(0, 5).map(e => {
              const player = players.find(p => p.id === e.playerId);
              const stat = STATS[e.stat];
              return (
                <div key={e.id} className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-gray-400">
                    {player?.name || (e.playerId === '__team__' ? 'Team' : '?')} — <span className={stat?.positive ? 'text-green-400' : 'text-red-400'}>{stat?.label || e.stat}</span>
                  </span>
                  <button onClick={() => dispatch({ type: 'UNDO_STAT', statId: e.id })} className="text-gray-600 text-xs px-1">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rotation Dashboard modal */}
      {showRotationDashboard && (
        <RotationDashboard
          statEntries={statEntries}
          matchId={match.id}
          currentRotation={currentRotation}
          onClose={() => setShowRotationDashboard(false)}
        />
      )}
    </div>
  );
}
