import { useCallback, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import PlayerStrategyCard from './components/court/PlayerStrategyCard';
import RotationControls from './components/controls/RotationControls';
import BottomNav from './components/controls/BottomNav';
import StatsPanel from './components/stats/StatsPanel';
import TeamPanel from './components/team/TeamPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import { deriveRotation as deriveRot } from './utils/rotations';
import { RALLY_PHASES } from './data/formations';

const PHASE_IDS = RALLY_PHASES.map(p => p.id);

export default function App() {
  const { state, dispatch, activeLineup, activeMatch, placements, playerProfiles } = useAppState();

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);
  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

  // Step through rally phases
  const currentPhaseIdx = PHASE_IDS.indexOf(state.courtPhase);
  const currentPhase = RALLY_PHASES[currentPhaseIdx >= 0 ? currentPhaseIdx : 0];

  const handleNextPhase = useCallback(() => {
    const next = (currentPhaseIdx + 1) % RALLY_PHASES.length;
    dispatch({ type: 'SET_COURT_PHASE', phase: RALLY_PHASES[next].id });
  }, [currentPhaseIdx, dispatch]);

  const handlePrevPhase = useCallback(() => {
    const prev = (currentPhaseIdx - 1 + RALLY_PHASES.length) % RALLY_PHASES.length;
    dispatch({ type: 'SET_COURT_PHASE', phase: RALLY_PHASES[prev].id });
  }, [currentPhaseIdx, dispatch]);

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
            {/* Phase step-through bar */}
            <div className="flex items-center px-2 py-1.5 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
              {/* Prev phase */}
              <button onClick={handlePrevPhase}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface-3)] text-white text-sm font-bold active:scale-90 shrink-0"
                aria-label="Previous phase">‹</button>

              {/* Phase indicators */}
              <div className="flex-1 flex items-center justify-center gap-1 mx-2 overflow-x-auto">
                {RALLY_PHASES.map((p, i) => (
                  <button key={p.id}
                    onClick={() => dispatch({ type: 'SET_COURT_PHASE', phase: p.id })}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      p.id === state.courtPhase
                        ? 'bg-[var(--color-accent)] text-white scale-105'
                        : i < currentPhaseIdx
                          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                          : 'bg-[var(--color-surface-3)] text-gray-500'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Next phase */}
              <button onClick={handleNextPhase}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface-3)] text-white text-sm font-bold active:scale-90 shrink-0"
                aria-label="Next phase">›</button>
            </div>

            {/* Phase description + overlay toggles */}
            <div className="flex items-center justify-between px-3 py-1 bg-[var(--color-surface)] border-b border-white/5 shrink-0">
              <span className="text-xs text-gray-400">{currentPhase.description}</span>
              <div className="flex gap-1">
                <button onClick={() => dispatch({ type: 'TOGGLE_ROUTES' })}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    state.showRoutes ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-600'
                  }`} title="Routes">→</button>
                <button onClick={() => dispatch({ type: 'TOGGLE_COVERAGE' })}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    state.showCoverage ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'
                  }`} title="Zones">◇</button>
                <button onClick={() => dispatch({ type: 'TOGGLE_HEATMAP' })}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    state.showHeatmap ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-600'
                  }`} title="Heatmap">▦</button>
              </div>
            </div>

            {/* Court SVG */}
            <div className="flex-1 flex items-center justify-center p-1 min-h-0 bg-[var(--color-surface)]">
              {activeLineup ? (
                <Court
                  placements={placements} dispatch={dispatch}
                  onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}
                  selectedSlot={state.selectedSlot}
                  showRoutes={state.showRoutes && (state.courtPhase === 'receive' || state.courtPhase === 'offense' || state.courtPhase === 'transition')}
                  rotation={state.currentRotation}
                  heatmapData={state.showHeatmap ? heatmapData : null}
                  heatmapMode="quality" playerProfiles={playerProfiles}
                  showCoverage={state.showCoverage && (state.courtPhase === 'defense')}
                />
              ) : (
                <div className="text-gray-500 text-center px-6">
                  <p className="text-lg mb-2 text-white font-bold">Set Up Your Team</p>
                  <p className="text-sm mb-4">Create a lineup to see the playbook.</p>
                  <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'team' })}
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95">
                    Go to Team
                  </button>
                </div>
              )}
            </div>

            {/* Rotation controls */}
            <RotationControls currentRotation={state.currentRotation} dispatch={dispatch} />

            {/* Strategy card overlay */}
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
