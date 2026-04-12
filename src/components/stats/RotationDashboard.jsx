import { useMemo, useState } from 'react';
import { getRotationTeamStats } from '../../utils/statAnalysis';

export default function RotationDashboard({ statEntries, matchId, currentRotation, onClose }) {
  const [filter, setFilter] = useState('match'); // 'match' | 'set'

  const rotationStats = useMemo(() => {
    const matchEntries = statEntries.filter(e => e.matchId === matchId);
    return getRotationTeamStats(matchEntries);
  }, [statEntries, matchId]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[var(--color-surface-2)] rounded-t-2xl border-t border-white/10 shadow-2xl max-h-[70vh] flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <h3 className="text-sm font-bold text-white">Rotation Report</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['match', 'set'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  filter === f ? 'bg-[var(--color-accent)] text-white' : 'text-gray-500'
                }`}>{f === 'match' ? 'Full Match' : 'This Set'}</button>
            ))}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] text-gray-400 flex items-center justify-center text-sm">✕</button>
        </div>
      </div>

      {/* Rotation cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {[1, 2, 3, 4, 5, 6].map(r => {
          const stats = rotationStats[r] || {};
          const totalRallies = (stats.ralliesWon || 0) + (stats.ralliesLost || 0);
          const winRate = totalRallies > 0 ? stats.ralliesWon / totalRallies : null;
          const net = (stats.kills || 0) + (stats.aces || 0) + (stats.blocks || 0) - (stats.errors || 0);
          const isCurrent = r === currentRotation;
          const isBleeding = winRate !== null && winRate < 0.40;

          let borderColor = 'border-white/5';
          if (isCurrent) borderColor = 'border-[var(--color-accent)]/50';
          if (isBleeding) borderColor = 'border-red-500/40';

          return (
            <div key={r} className={`rounded-xl p-3 bg-[var(--color-surface)] border ${borderColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">R{r}</span>
                  {isCurrent && <span className="text-[10px] bg-[var(--color-accent)]/20 text-[var(--color-accent)] px-1.5 py-0.5 rounded-full font-medium">CURRENT</span>}
                  {isBleeding && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">BLEEDING</span>}
                </div>
                {winRate !== null ? (
                  <span className={`text-sm font-bold ${winRate > 0.55 ? 'text-green-400' : winRate < 0.45 ? 'text-red-400' : 'text-amber-400'}`}>
                    {Math.round(winRate * 100)}% W
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">No data</span>
                )}
              </div>

              {totalRallies > 0 && (
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500">W-L</div>
                    <div className="text-sm font-bold text-white">{stats.ralliesWon || 0}-{stats.ralliesLost || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Kills</div>
                    <div className="text-sm font-bold text-green-400">{stats.kills || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Aces</div>
                    <div className="text-sm font-bold text-blue-400">{stats.aces || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Errs</div>
                    <div className="text-sm font-bold text-red-400">{stats.errors || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Net</div>
                    <div className={`text-sm font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{net >= 0 ? '+' : ''}{net}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
