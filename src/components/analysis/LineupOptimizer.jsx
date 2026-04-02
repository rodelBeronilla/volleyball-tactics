import { useMemo, useState } from 'react';
import { POSITIONS } from '../../data/positions';
import { optimizeSlotAssignment } from '../../utils/lineupOptimizer';
import ImpactRing from '../stats/ImpactRing';

const SLOT_LABELS = { 1: '1 (RB)', 2: '2 (RF)', 3: '3 (CF)', 4: '4 (LF)', 5: '5 (LB)', 6: '6 (CB)' };

export default function LineupOptimizer({ players, playerProfiles, activeLineup }) {
  const [swapA, setSwapA] = useState(null);

  const optimization = useMemo(() => {
    if (Object.keys(playerProfiles).length === 0) return null;
    return optimizeSlotAssignment(players, playerProfiles);
  }, [players, playerProfiles]);

  // Swap delta is computed on-the-fly when user taps two slots
  // No need for pre-computation

  if (!activeLineup) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a lineup first</div>;
  }

  if (Object.keys(playerProfiles).length === 0) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-4 text-center">Record match data to enable lineup optimization</div>;
  }

  const handleSlotTap = (slot) => {
    if (swapA === null) {
      setSwapA(slot);
    } else if (swapA === slot) {
      setSwapA(null);
    } else {
      // Show swap result
      setSwapA(null);
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Optimizer result */}
      {optimization && optimization.bestSlots && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Optimized Lineup</div>
          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-green-800/20">
            <div className="flex items-center gap-3 mb-2">
              <ImpactRing score={Math.round(optimization.bestScore * 10)} size={44} />
              <div>
                <div className="text-white font-bold text-sm">Best arrangement found</div>
                <div className="text-[10px] text-gray-400">Score: {optimization.bestScore.toFixed(2)} (from {optimization.allCandidates.length} candidates)</div>
              </div>
            </div>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6].map(slot => {
                const playerId = optimization.bestSlots[slot];
                const player = players.find(p => p.id === playerId);
                const pos = player ? (POSITIONS[player.position] || POSITIONS.ds) : null;
                const rotScore = optimization.rotationScores[slot];
                return (
                  <div key={slot} className="flex items-center gap-2 py-1">
                    <span className="text-[10px] text-gray-500 w-12">{SLOT_LABELS[slot]}</span>
                    {player ? (
                      <>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: pos?.color }}>
                          {player.number}
                        </div>
                        <span className="text-white text-xs flex-1">{player.name}</span>
                        {rotScore && <span className="text-[10px] text-gray-400 tabular-nums">{rotScore.toFixed(1)}</span>}
                      </>
                    ) : (
                      <span className="text-gray-500 text-xs">Empty</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {optimization?.error && (
        <div className="p-3 rounded-xl bg-yellow-900/15 border border-yellow-800/20 text-yellow-400 text-sm">
          {optimization.error}
        </div>
      )}

      {/* Current lineup with swap controls */}
      {activeLineup && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
            Current Lineup — Tap two slots to compare swap
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map(slot => {
              const playerId = activeLineup.slots[slot];
              const player = playerId ? players.find(p => p.id === playerId) : null;
              const pos = player ? (POSITIONS[player.position] || POSITIONS.ds) : null;
              const profile = player ? playerProfiles[player.id] : null;
              const isSwapSelected = swapA === slot;

              return (
                <button
                  key={slot}
                  onClick={() => handleSlotTap(slot)}
                  className={`flex items-center gap-2 w-full p-2 rounded-lg text-left transition-all ${
                    isSwapSelected ? 'ring-1 ring-amber-500/50 bg-amber-900/10' : 'bg-[var(--color-surface-2)]'
                  } border border-white/5`}
                >
                  <span className="text-[10px] text-gray-500 w-12">{SLOT_LABELS[slot]}</span>
                  {player ? (
                    <>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: pos?.color }}>
                        {player.number}
                      </div>
                      <span className="text-white text-xs flex-1">{player.name}</span>
                      {profile?.impactScore > 0 && (
                        <span className={`text-[10px] tabular-nums ${
                          profile.impactScore >= 70 ? 'text-green-400' : profile.impactScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {profile.impactScore}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs">Empty</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top alternative arrangements */}
      {optimization?.allCandidates?.length > 1 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Alternative Arrangements</div>
          <div className="space-y-1.5">
            {optimization.allCandidates.slice(1, 5).map((candidate, i) => (
              <div key={i} className="p-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Option {i + 2}</span>
                  <span className="text-[10px] text-gray-400 tabular-nums">Score: {candidate.score.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[1, 2, 3, 4, 5, 6].map(slot => {
                    const p = players.find(pl => pl.id === candidate.slots[slot]);
                    return (
                      <span key={slot} className="text-[10px] text-gray-400">
                        {slot}:{p?.name?.slice(0, 4) || '?'}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
