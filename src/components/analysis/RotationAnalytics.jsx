import { useMemo } from 'react';
import { getRotationTeamStats } from '../../utils/statAnalysis';
import ImpactRing from '../stats/ImpactRing';

export default function RotationAnalytics({ statEntries }) {
  const rotStats = useMemo(() => getRotationTeamStats(statEntries), [statEntries]);

  const hasData = Object.values(rotStats).some(r => r.totalRallies > 0);

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 px-4">
        <p className="text-center text-sm">Record match data with rally outcomes to unlock rotation analysis</p>
      </div>
    );
  }

  // Find best/worst
  const withRallies = Object.entries(rotStats).filter(([, r]) => r.totalRallies > 0);
  const sorted = [...withRallies].sort((a, b) => (b[1].winRate || 0) - (a[1].winRate || 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="p-3 space-y-3">
      {/* Best/Worst callout */}
      {best && worst && best[0] !== worst[0] && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-green-900/15 border border-green-800/20">
            <div className="text-xs uppercase text-green-400/70 font-semibold">Strongest</div>
            <div className="text-white font-bold">R{best[0]}</div>
            <div className="text-xs text-green-400">{best[1].winRate !== null ? `${(best[1].winRate * 100).toFixed(0)}% win rate` : ''}</div>
            <div className="text-xs text-gray-400">{best[1].points} points, {best[1].totalRallies} rallies</div>
          </div>
          <div className="p-3 rounded-xl bg-red-900/15 border border-red-800/20">
            <div className="text-xs uppercase text-red-400/70 font-semibold">Needs Work</div>
            <div className="text-white font-bold">R{worst[0]}</div>
            <div className="text-xs text-red-400">{worst[1].winRate !== null ? `${(worst[1].winRate * 100).toFixed(0)}% win rate` : ''}</div>
            <div className="text-xs text-gray-400">{worst[1].points} points, {worst[1].totalRallies} rallies</div>
          </div>
        </div>
      )}

      {/* R1-R6 cards */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map(r => {
          const rs = rotStats[r];
          if (!rs || rs.totalRallies === 0) {
            return (
              <div key={r} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 opacity-50">
                <span className="text-gray-400 text-sm font-bold">R{r}</span>
                <span className="text-gray-500 text-xs ml-2">No data</span>
              </div>
            );
          }
          const score = Math.round((rs.winRate || 0) * 100);
          return (
            <div key={r} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
              <ImpactRing score={score} size={44} />
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Rotation {r}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {rs.sideOutRate !== null && (
                    <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-300">
                      SO: {(rs.sideOutRate * 100).toFixed(0)}%
                    </span>
                  )}
                  {rs.breakPointRate !== null && (
                    <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-300">
                      BP: {(rs.breakPointRate * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-xs bg-green-900/20 text-green-400">
                    {rs.kills}K {rs.blocks}B {rs.aces}A
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-red-900/20 text-red-400">
                    {rs.errors} err
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">{rs.ralliesWon}W-{rs.ralliesLost}L</div>
                <div className="text-xs text-gray-500">{rs.totalRallies} rallies</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
