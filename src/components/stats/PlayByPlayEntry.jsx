import { useState, useMemo, useCallback } from 'react';
import { POSITIONS } from '../../data/positions';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { deriveRotation, isBackRow } from '../../utils/rotations';

const QUICK_STATS = {
  setter: ['assist', 'setError', 'ballHandlingError', 'dig', 'blockAssist'],
  outside: ['kill', 'attackError', 'attackBlocked', 'passPerfect', 'passGood', 'passPoor', 'passError', 'dig'],
  middle: ['kill', 'attackError', 'blockSolo', 'blockAssist', 'blockError'],
  opposite: ['kill', 'attackError', 'attackBlocked', 'blockSolo', 'ace', 'serviceError'],
  libero: ['passPerfect', 'passGood', 'passPoor', 'passError', 'dig', 'defenseError'],
  ds: ['passPerfect', 'passGood', 'passPoor', 'dig', 'defenseError', 'ace'],
};

export default function PlayByPlayEntry({ match, players, lineups, rallies, dispatch, currentRotation }) {
  const [actions, setActions] = useState([]);
  // servingTeam is auto-derived from effectiveRotation, not manually set
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [mode, setMode] = useState('full'); // 'full' | 'quick'

  const lineup = lineups.find(l => l.id === match.lineupId);

  // Get rallies for this match
  const matchRallies = useMemo(
    () => rallies.filter(r => r.matchId === match.id),
    [rallies, match.id]
  );

  // Derive current score from rallies
  const currentSetRallies = useMemo(
    () => matchRallies.filter(r => r.setNumber === match.sets[match.sets.length - 1]?.number),
    [matchRallies, match.sets]
  );

  const currentScore = useMemo(() => {
    let our = 0, their = 0;
    for (const r of currentSetRallies) {
      if (r.outcome === 'won') our++;
      else their++;
    }
    return { our, their };
  }, [currentSetRallies]);

  // Derive rotation state from rallies
  const effectiveRotation = useMemo(() => {
    let rot = currentRotation;
    let serving = 'them'; // assume we receive first in each set
    for (const r of currentSetRallies) {
      serving = r.servingTeam;
      rot = r.rotation;
      // After rally: if receiving team won (side-out), rotation advances for the team that gains serve
      if (r.outcome === 'won' && r.servingTeam === 'them') {
        // We won while receiving → we rotate and now serve
        rot = rot === 6 ? 1 : rot + 1;
        serving = 'us';
      } else if (r.outcome === 'lost' && r.servingTeam === 'us') {
        // We lost while serving → they gain serve, no rotation for us
        serving = 'them';
      } else if (r.outcome === 'won' && r.servingTeam === 'us') {
        // We won while serving → keep serving, no rotation
        serving = 'us';
      } else {
        // We lost while receiving → no rotation
        serving = 'them';
      }
    }
    return { rotation: rot, servingTeam: serving };
  }, [currentSetRallies, currentRotation]);

  // Who is on court
  const onCourt = useMemo(() => {
    if (!lineup) return [];
    const slots = deriveRotation(lineup.slots, effectiveRotation.rotation);
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
  }, [lineup, players, effectiveRotation.rotation]);

  const handleAddAction = useCallback((statKey) => {
    if (!selectedPlayer) return;
    setActions(prev => [...prev, { playerId: selectedPlayer, stat: statKey, order: prev.length + 1 }]);
  }, [selectedPlayer]);

  const handleRemoveAction = (index) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRally = (outcome) => {
    const setNumber = match.sets[match.sets.length - 1]?.number || 1;
    dispatch({
      type: 'ADD_RALLY',
      matchId: match.id,
      setNumber,
      rallyNumber: currentSetRallies.length + 1,
      rotation: effectiveRotation.rotation,
      ourScore: currentScore.our,
      theirScore: currentScore.their,
      servingTeam: effectiveRotation.servingTeam,
      outcome,
      actions,
    });
    setActions([]);
    setSelectedPlayer(null);
  };

  const handleUndo = () => {
    if (matchRallies.length === 0) return;
    dispatch({ type: 'UNDO_LAST_RALLY', matchId: match.id });
  };

  // Get quick stats for selected player
  const selectedPlayerObj = selectedPlayer ? onCourt.find(p => p.id === selectedPlayer) : null;
  const quickStatKeys = selectedPlayerObj ? (QUICK_STATS[selectedPlayerObj.isLibero ? 'libero' : selectedPlayerObj.position] || []) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header: score + rotation + serving */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-white font-bold text-lg tabular-nums">{currentScore.our} - {currentScore.their}</div>
            <div className="text-xs text-gray-400">Set {match.sets[match.sets.length - 1]?.number || 1}</div>
          </div>
          <div className="text-xs text-gray-400">
            <div>R{effectiveRotation.rotation}</div>
            <div className={effectiveRotation.servingTeam === 'us' ? 'text-amber-400' : 'text-gray-500'}>
              {effectiveRotation.servingTeam === 'us' ? 'Serving' : 'Receiving'}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode(mode === 'full' ? 'quick' : 'full')}
            className={`px-2 py-1 rounded text-xs font-bold ${
              mode === 'quick' ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            {mode === 'quick' ? 'Quick' : 'Full'}
          </button>
          <button onClick={handleUndo} className="px-2 py-1 rounded bg-[var(--color-surface-3)] text-gray-400 text-xs font-bold">
            Undo
          </button>
        </div>
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: posInfo.color }}
              >
                {p.number}
              </div>
              <span className="text-xs text-gray-300 mt-0.5 truncate w-12 text-center">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Current rally actions */}
      {actions.length > 0 && (
        <div className="px-3 py-1.5 bg-[var(--color-surface)] border-b border-white/5">
          <div className="text-xs text-gray-500 mb-1">Rally actions:</div>
          <div className="flex flex-wrap gap-1">
            {actions.map((a, i) => {
              const player = players.find(p => p.id === a.playerId);
              const stat = STATS[a.stat];
              return (
                <button
                  key={i}
                  onClick={() => handleRemoveAction(i)}
                  className={`px-2 py-0.5 rounded text-xs ${
                    stat?.positive ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                  }`}
                >
                  {player?.name?.slice(0, 6)} {stat?.label} ✕
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat buttons */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {selectedPlayer ? (
          mode === 'quick' ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 px-1">Quick Stats</div>
              <div className="grid grid-cols-3 gap-1.5">
                {quickStatKeys.map(statKey => {
                  const stat = STATS[statKey];
                  if (!stat) return null;
                  return (
                    <button
                      key={statKey}
                      onClick={() => handleAddAction(statKey)}
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
          ) : (
            PLAYER_STAT_GROUPS.map(group => (
              <div key={group.id}>
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 px-1">{group.label}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {group.stats.map(statKey => {
                    const stat = STATS[statKey];
                    return (
                      <button
                        key={statKey}
                        onClick={() => handleAddAction(statKey)}
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
          )
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">
            Select a player to add actions, then submit the rally outcome
          </div>
        )}
      </div>

      {/* Rally outcome buttons — always visible at bottom */}
      <div className="flex gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-t border-white/5">
        <button
          onClick={() => handleSubmitRally('won')}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-green-900/40 text-green-400 border border-green-700/40 active:scale-95 transition-transform"
        >
          Rally Won (+1)
        </button>
        <button
          onClick={() => handleSubmitRally('lost')}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-red-900/40 text-red-400 border border-red-700/40 active:scale-95 transition-transform"
        >
          Rally Lost (+1)
        </button>
      </div>

      {/* Rally timeline */}
      {currentSetRallies.length > 0 && (
        <div className="max-h-24 overflow-y-auto px-3 py-1.5 bg-[var(--color-surface)] border-t border-white/5">
          <div className="text-xs text-gray-500 mb-0.5">Rally log ({currentSetRallies.length})</div>
          <div className="flex flex-wrap gap-1">
            {currentSetRallies.map((r, i) => (
              <span
                key={r.id}
                className={`px-1.5 py-0.5 rounded text-xs tabular-nums ${
                  r.outcome === 'won' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}
              >
                {i + 1}. {r.ourScore}-{r.theirScore} R{r.rotation} {r.outcome === 'won' ? 'W' : 'L'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
