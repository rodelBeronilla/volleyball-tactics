import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { POSITIONS } from '../../data/positions';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { deriveRotation, isBackRow } from '../../utils/rotations';

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${min}:${sec.toString().padStart(2, '0')}.${tenths}`;
}

export default function VideoReviewEntry({ match, players, lineups, dispatch, currentRotation, activeSetNumber }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rallyActions, setRallyActions] = useState([]);
  const startTimeRef = useRef(null);
  const animRef = useRef(null);

  const lineup = lineups.find(l => l.id === match.lineupId);

  // Timer loop
  useEffect(() => {
    if (timerRunning) {
      if (!startTimeRef.current) startTimeRef.current = performance.now() - elapsed;
      const tick = () => {
        setElapsed(performance.now() - startTimeRef.current);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animRef.current);
    }
    return undefined;
  }, [timerRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartPause = () => {
    if (timerRunning) {
      // Pause
      cancelAnimationFrame(animRef.current);
      setTimerRunning(false);
    } else {
      // Start/resume
      startTimeRef.current = performance.now() - elapsed;
      setTimerRunning(true);
    }
  };

  const handleReset = () => {
    cancelAnimationFrame(animRef.current);
    setTimerRunning(false);
    setElapsed(0);
    startTimeRef.current = null;
  };

  // On-court players for current rotation
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

  const handleRecordStat = useCallback((statKey) => {
    if (!selectedPlayer && statKey !== 'rallyWon' && statKey !== 'rallyLost') return;

    // For rally outcomes, record and also submit any pending rally actions
    if (statKey === 'rallyWon' || statKey === 'rallyLost') {
      // Submit rally with all accumulated actions
      dispatch({
        type: 'ADD_RALLY',
        matchId: match.id,
        setNumber: activeSetNumber,
        rallyNumber: 0, // auto-assigned
        rotation: currentRotation,
        ourScore: 0,
        theirScore: 0,
        servingTeam: 'us', // unknown during video review
        outcome: statKey === 'rallyWon' ? 'won' : 'lost',
        actions: rallyActions,
      });
      setRallyActions([]);
      return;
    }

    // Add to current rally's actions with video timestamp
    setRallyActions(prev => [...prev, {
      playerId: selectedPlayer,
      stat: statKey,
      order: prev.length + 1,
      videoTimestamp: Math.round(elapsed),
    }]);

    // Also record as individual stat entry with timestamp
    dispatch({
      type: 'RECORD_STAT',
      matchId: match.id,
      setNumber: activeSetNumber,
      playerId: selectedPlayer,
      rotation: currentRotation,
      stat: statKey,
      videoTimestamp: Math.round(elapsed),
    });
  }, [selectedPlayer, dispatch, match.id, activeSetNumber, currentRotation, elapsed, rallyActions]);

  const handleUndoAction = () => {
    setRallyActions(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Timer header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-white font-mono text-2xl font-bold tabular-nums">
            {formatTime(elapsed)}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleStartPause}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform ${
                timerRunning
                  ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/40'
                  : 'bg-green-900/40 text-green-400 border border-green-700/40'
              }`}
            >
              {timerRunning ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-surface-3)] text-gray-400 active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 text-right">
          <div>vs {match.opponent}</div>
          <div>Set {activeSetNumber} · R{currentRotation}</div>
        </div>
      </div>

      {/* Set and rotation controls */}
      <div className="flex gap-1 px-3 py-1.5 bg-[var(--color-surface)] border-b border-white/5">
        {/* Set selector */}
        <div className="flex gap-1 mr-2">
          {match.sets.map(s => (
            <button
              key={s.number}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SET', setNumber: s.number })}
              className={`px-2 py-1 rounded text-xs font-bold ${
                s.number === activeSetNumber
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-3)] text-gray-400'
              }`}
            >
              S{s.number}
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: 'ADD_SET', matchId: match.id })}
            className="px-2 py-1 rounded text-xs font-bold bg-[var(--color-surface-3)] text-gray-400"
          >
            +
          </button>
        </div>
        {/* Rotation selector */}
        {[1,2,3,4,5,6].map(r => (
          <button
            key={r}
            onClick={() => dispatch({ type: 'SET_ROTATION', rotation: r })}
            className={`flex-1 py-1 rounded text-xs font-bold ${
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
      {rallyActions.length > 0 && (
        <div className="px-3 py-1.5 bg-[var(--color-surface)] border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Rally actions:</span>
            <button onClick={handleUndoAction} className="text-xs text-gray-500 hover:text-red-400">Undo last</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {rallyActions.map((a, i) => {
              const player = players.find(p => p.id === a.playerId);
              const stat = STATS[a.stat];
              return (
                <span key={i} className={`px-2 py-0.5 rounded text-xs ${
                  stat?.positive ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}>
                  {formatTime(a.videoTimestamp)} {player?.name?.slice(0, 6)} {stat?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat buttons */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
          <div className="text-center text-gray-500 py-4 text-sm">
            Start the timer, then select a player to record stats while watching video
          </div>
        )}
      </div>

      {/* Rally outcome buttons */}
      <div className="flex gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-t border-white/5">
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
    </div>
  );
}
