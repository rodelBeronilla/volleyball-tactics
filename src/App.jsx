import { useCallback, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import PlayerStrategyCard from './components/court/PlayerStrategyCard';
import RotationSummary from './components/court/RotationSummary';
import RotationControls from './components/controls/RotationControls';
import BottomNav from './components/controls/BottomNav';
import StatsPanel from './components/stats/StatsPanel';
import TeamPanel from './components/team/TeamPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import { deriveRotation as deriveRot } from './utils/rotations';
import { getResponsibilities } from './data/responsibilities';

const PHASES = [
  { id: 'receive', label: 'Receive', icon: '↓' },
  { id: 'offense', label: 'Offense', icon: '↗' },
  { id: 'defense', label: 'Defense', icon: '↙' },
];

export default function App() {
  const { state, dispatch, activeLineup, activeMatch, placements, playerProfiles } = useAppState();

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);

  // Phase-appropriate responsibilities
  const responsibilities = useMemo(() => {
    const respMap = { receive: null, offense: 'offense', defense: 'defense' };
    const respId = respMap[state.courtPhase];
    return respId ? getResponsibilities(respId, state.currentRotation) : null;
  }, [state.courtPhase, state.currentRotation]);

  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    if (!state.showHeatmap || state.statEntries.length === 0 || !activeLineup) return null;
    const zones = {};
    const POSITIVE_STATS = new Set(['kill', 'attackTip', 'attackTooled', 'ace', 'blockSolo', 'blockAssist', 'dig', 'passPerfect', 'passGood', 'assist', 'freeBall', 'coverDig']);
    for (const e of state.statEntries) {
      if (!e.rotation || e.playerId === '__team__') continue;
      const slots = deriveRot(activeLineup.slots, e.rotation);
      let zone = null;
      for (let pos = 1; pos <= 6; pos++) {
        if (slots[pos] === e.playerId) { zone = pos; break; }
      }
      if (!zone && activeLineup.liberoId === e.playerId) {
        for (let pos of [1, 5, 6]) {
          const originalPlayer = state.players.find(p => p.id === slots[pos]);
          if (originalPlayer?.position === 'middle') { zone = pos; break; }
        }
      }
      if (!zone) continue;
      if (!zones[zone]) zones[zone] = { total: 0, positive: 0 };
      zones[zone].total++;
      if (POSITIVE_STATS.has(e.stat)) zones[zone].positive++;
    }
    for (const z of Object.values(zones)) {
      z.positiveRate = z.total > 0 ? z.positive / z.total : 0;
    }
    return zones;
  }, [state.showHeatmap, state.statEntries, activeLineup, state.players]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* ── Court Tab ── */}
        {state.activeTab === 'court' && (
          <>
            {/* Phase selector + overlay toggles */}
            <div className="flex items-center px-2 py-1.5 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
              {/* Phase buttons */}
              <div className="flex gap-1 flex-1">
                {PHASES.map(p => (
                  <button key={p.id}
                    onClick={() => dispatch({ type: 'SET_COURT_PHASE', phase: p.id })}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      state.courtPhase === p.id
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-surface-3)] text-gray-400'
                    }`}>
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Overlay toggle icons */}
              <div className="flex gap-1 ml-2">
                <button onClick={() => dispatch({ type: 'TOGGLE_ROUTES' })}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    state.showRoutes ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'
                  }`} aria-label="Routes" title="Movement routes">
                  →
                </button>
                <button onClick={() => dispatch({ type: 'TOGGLE_COVERAGE' })}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    state.showCoverage ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'
                  }`} aria-label="Coverage" title="Coverage zones">
                  ◇
                </button>
                <button onClick={() => dispatch({ type: 'TOGGLE_HEATMAP' })}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    state.showHeatmap ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'
                  }`} aria-label="Heatmap" title="Stat heatmap">
                  ▦
                </button>
              </div>
            </div>

            {/* Court */}
            <div className="flex-1 flex items-center justify-center p-1 min-h-0 bg-[var(--color-surface)]">
              {activeLineup ? (
                <Court
                  placements={placements} dispatch={dispatch}
                  onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}
                  responsibilities={responsibilities} selectedSlot={state.selectedSlot}
                  showRoutes={state.showRoutes && state.courtPhase !== 'defense'}
                  rotation={state.currentRotation}
                  heatmapData={state.showHeatmap ? heatmapData : null}
                  heatmapMode="quality" playerProfiles={playerProfiles}
                  showCoverage={state.showCoverage && state.courtPhase === 'defense'}
                />
              ) : (
                <div className="text-gray-500 text-center px-6">
                  <p className="text-lg mb-2 text-white font-bold">Set Up Your Team</p>
                  <p className="text-sm mb-4">Create a lineup to see your court.</p>
                  <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'team' })}
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95">
                    Go to Team
                  </button>
                </div>
              )}
            </div>

            {/* Summary + Rotation controls */}
            {activeLineup && <RotationSummary rotation={state.currentRotation} placements={placements} />}
            <RotationControls currentRotation={state.currentRotation} dispatch={dispatch} />

            {state.selectedSlot != null && (
              <PlayerStrategyCard selectedSlot={state.selectedSlot} rotation={state.currentRotation}
                placements={placements} onClose={handleCloseCard} />
            )}
          </>
        )}

        {/* ── Other Tabs ── */}
        {state.activeTab === 'stats' && (
          <StatsPanel state={state} dispatch={dispatch} activeMatch={activeMatch}
            activeLineup={activeLineup} playerProfiles={playerProfiles} />
        )}
        {state.activeTab === 'team' && (
          <TeamPanel state={state} dispatch={dispatch} activeLineup={activeLineup} />
        )}
        {state.activeTab === 'more' && (
          <SettingsPanel state={state} dispatch={dispatch} />
        )}
      </div>

      <BottomNav activeTab={state.activeTab} dispatch={dispatch} />
    </div>
  );
}
