import { useMemo } from 'react';
import { getRotationTeamStats } from '../../utils/statAnalysis';

export default function RotationMiniDashboard({ statEntries, matchId, currentRotation, onExpandRotation }) {
  const rotationStats = useMemo(() => {
    const matchEntries = statEntries.filter(e => e.matchId === matchId);
    return getRotationTeamStats(matchEntries);
  }, [statEntries, matchId]);

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-surface)] border-b border-white/5 shrink-0 overflow-x-auto">
      <span className="text-xs text-gray-600 shrink-0 mr-1">Rot:</span>
      {[1, 2, 3, 4, 5, 6].map(r => {
        const stats = rotationStats[r];
        const totalRallies = (stats?.ralliesWon || 0) + (stats?.ralliesLost || 0);
        const winRate = totalRallies > 0 ? stats.ralliesWon / totalRallies : null;

        let bgColor = 'bg-[var(--color-surface-3)]';
        let textColor = 'text-gray-500';
        if (winRate !== null) {
          if (winRate > 0.55) { bgColor = 'bg-green-900/40'; textColor = 'text-green-400'; }
          else if (winRate < 0.45) { bgColor = 'bg-red-900/40'; textColor = 'text-red-400'; }
          else { bgColor = 'bg-amber-900/30'; textColor = 'text-amber-400'; }
        }

        const isCurrent = r === currentRotation;
        return (
          <button
            key={r}
            onClick={() => onExpandRotation?.(r)}
            className={`flex flex-col items-center px-2 py-1 rounded-lg shrink-0 ${bgColor} ${
              isCurrent ? 'ring-1 ring-white/30' : ''
            }`}
          >
            <span className={`text-xs font-bold ${textColor}`}>R{r}</span>
            {totalRallies > 0 ? (
              <span className={`text-[10px] ${textColor}`}>
                {stats.ralliesWon}-{stats.ralliesLost}
              </span>
            ) : (
              <span className="text-[10px] text-gray-600">—</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
