import { useMemo } from 'react';
import { POSITIONS } from '../../data/positions';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { aggregateByPlayer, computeStatLine, countSetsPlayed } from '../../utils/statAggregation';

export default function MatchDetail({ match, statEntries, players, onBack }) {
  const matchEntries = useMemo(
    () => statEntries.filter(e => e.matchId === match.id),
    [statEntries, match.id]
  );

  const playerStats = useMemo(() => {
    const byPlayer = aggregateByPlayer(matchEntries);
    return Object.entries(byPlayer).map(([playerId, counts]) => {
      const player = players.find(p => p.id === playerId);
      const setsPlayed = countSetsPlayed(matchEntries, playerId);
      const statLine = computeStatLine(counts, setsPlayed);
      return { player, statLine };
    }).filter(p => p.player);
  }, [matchEntries, players]);

  const setsWon = match.sets.filter(s => s.won === true).length;
  const setsLost = match.sets.filter(s => s.won === false).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-lg">‹</button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold truncate">vs {match.opponent}</div>
          <div className="text-xs text-gray-400">{match.date} · {setsWon}-{setsLost} sets</div>
        </div>
      </div>

      {/* Set scores */}
      <div className="flex gap-2 px-4 py-2 bg-[var(--color-surface)] border-b border-white/5">
        {match.sets.map(s => (
          <div key={s.number} className={`px-3 py-1.5 rounded-lg text-center text-xs font-bold ${
            s.won === true ? 'bg-green-900/20 text-green-400 border border-green-800/30' :
            s.won === false ? 'bg-red-900/20 text-red-400 border border-red-800/30' :
            'bg-white/5 text-gray-400 border border-white/5'
          }`}>
            Set {s.number}: {s.ourScore}-{s.theirScore}
          </div>
        ))}
      </div>

      {/* Player stat lines */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {playerStats.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">No stats recorded for this match</div>
        )}
        {playerStats.map(({ player, statLine }) => {
          const pos = POSITIONS[player.position] || POSITIONS.ds;
          return (
            <div key={player.id} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: pos.color }}
                >
                  {player.number}
                </div>
                <span className="text-white text-sm font-medium">{player.name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PLAYER_STAT_GROUPS.map(group =>
                  group.stats.map(statKey => {
                    const val = statLine[statKey];
                    if (!val) return null;
                    const stat = STATS[statKey];
                    return (
                      <span key={statKey} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        stat.positive
                          ? 'bg-green-900/20 text-green-400'
                          : 'bg-red-900/20 text-red-400'
                      }`}>
                        {stat.label}: {val}
                      </span>
                    );
                  })
                )}
                {statLine.hitPct !== null && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300">
                    Hit%: {(statLine.hitPct * 100).toFixed(0)}%
                  </span>
                )}
                {statLine.passAvg !== null && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300">
                    Pass: {statLine.passAvg.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
