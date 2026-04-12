import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import PlayerStrategyCard from './components/court/PlayerStrategyCard';
import RotationControls from './components/controls/RotationControls';
import BottomNav from './components/controls/BottomNav';
import StatsPanel from './components/stats/StatsPanel';
import TeamPanel from './components/team/TeamPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import GameDayPanel from './components/gameday/GameDayPanel';
import PracticePanel from './components/practice/PracticePanel';
import FilmReviewPanel from './components/film/FilmReviewPanel';
import { deriveRotation as deriveRot } from './utils/rotations';
import { generateRallySteps } from './data/rallyFlow';

export default function App() {
  const { state, dispatch, activeLineup, activeMatch, placements, playerProfiles } = useAppState();
  const [stepIdx, setStepIdx] = useState(0);

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);
  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

  // Generate rotation-specific rally steps
  const rallySteps = useMemo(
    () => generateRallySteps(state.currentRotation),
    [state.currentRotation]
  );

  const safeIdx = Math.min(stepIdx, rallySteps.length - 1);
  const currentStep = rallySteps[safeIdx >= 0 ? safeIdx : 0];

  // Sync court phase to useAppState when step changes
  const derivedPhase = useMemo(() => {
    if (!currentStep?.formationId) return 'serve';
    const map = { 'serve': 'serve', 'sr-5-1': 'receive', 'pass': 'pass', 'offense': 'attack', 'def-perimeter': 'defense', 'transition': 'transition' };
    return map[currentStep.formationId] || 'serve';
  }, [currentStep]);

  useEffect(() => {
    if (derivedPhase !== state.courtPhase) {
      dispatch({ type: 'SET_COURT_PHASE', phase: derivedPhase });
    }
  }, [derivedPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextStep = useCallback(() => {
    if (stepIdx >= rallySteps.length - 1) {
      // End of rally → next rotation
      const nextRot = state.currentRotation === 6 ? 1 : state.currentRotation + 1;
      dispatch({ type: 'SET_ROTATION', rotation: nextRot });
      setStepIdx(0);
    } else {
      setStepIdx(i => i + 1);
    }
  }, [stepIdx, rallySteps.length, state.currentRotation, dispatch]);

  const handlePrevStep = useCallback(() => {
    if (stepIdx <= 0) {
      // Start of rally → prev rotation, last step
      const prevRot = state.currentRotation === 1 ? 6 : state.currentRotation - 1;
      dispatch({ type: 'SET_ROTATION', rotation: prevRot });
      // Will be set to last step after re-render
      setStepIdx(999); // Will be clamped
    } else {
      setStepIdx(i => i - 1);
    }
  }, [stepIdx, state.currentRotation, dispatch]);

  // (stepIdx is clamped via safeIdx above)

  // Heatmap data
  const heatmapData = useMemo(() => {
    if (!state.showHeatmap || state.statEntries.length === 0 || !activeLineup) return null;
    const zones = {};
    const POSITIVE = new Set(['kill', 'attackTip', 'attackTooled', 'ace', 'blockSolo', 'blockAssist', 'dig', 'passPerfect', 'passGood', 'assist', 'freeBall', 'coverDig']);
    for (const e of state.statEntries) {
      if (!e.rotation || e.playerId === '__team__') continue;
      const slots = deriveRot(activeLineup.slots, e.rotation);
      let zone = null;
      for (let pos = 1; pos <= 6; pos++) {
        if (slots[pos] === e.playerId) { zone = pos; break; }
      }
      if (!zone && activeLineup.liberoId === e.playerId) {
        for (let pos of [1, 5, 6]) {
          const p = state.players.find(pl => pl.id === slots[pos]);
          if (p?.position === 'middle') { zone = pos; break; }
        }
      }
      if (!zone) continue;
      if (!zones[zone]) zones[zone] = { total: 0, positive: 0 };
      zones[zone].total++;
      if (POSITIVE.has(e.stat)) zones[zone].positive++;
    }
    for (const z of Object.values(zones)) z.positiveRate = z.total > 0 ? z.positive / z.total : 0;
    return zones;
  }, [state.showHeatmap, state.statEntries, activeLineup, state.players]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* ── Court Tab ── */}
        {state.activeTab === 'court' && (
          <>
            {/* Step controls */}
            <div className="flex items-center px-2 py-1.5 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
              <button onClick={handlePrevStep}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-surface-3)] text-white text-lg font-bold active:scale-90 shrink-0">‹</button>

              <div className="flex-1 flex flex-col items-center mx-2 min-w-0">
                <div className="text-sm font-bold text-white truncate max-w-full">{currentStep?.label || 'Serve'}</div>
                <div className="flex gap-0.5 mt-0.5">
                  {rallySteps.map((s, i) => (
                    <button key={s.id} onClick={() => setStepIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === safeIdx ? 'bg-[var(--color-accent)] scale-150'
                          : i < safeIdx ? 'bg-[var(--color-accent)]/40'
                          : 'bg-white/15'
                      }`} />
                  ))}
                </div>
              </div>

              <button onClick={handleNextStep}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-surface-3)] text-white text-lg font-bold active:scale-90 shrink-0">›</button>
            </div>

            {/* Step description + toggles */}
            <div className="flex items-center justify-between px-3 py-1 bg-[var(--color-surface)] border-b border-white/5 shrink-0">
              <span className="text-xs text-gray-400 flex-1 min-w-0 truncate">{currentStep?.description || ''}</span>
              <div className="flex gap-1 ml-2 shrink-0">
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

            {/* Court */}
            <div className="flex-1 flex items-center justify-center p-1 min-h-0 bg-[var(--color-surface)]">
              {activeLineup ? (
                <Court
                  placements={placements} dispatch={dispatch}
                  onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}
                  selectedSlot={state.selectedSlot}
                  showRoutes={currentStep?.showRoutes || state.showRoutes}
                  rotation={state.currentRotation}
                  heatmapData={state.showHeatmap ? heatmapData : null}
                  heatmapMode="quality" playerProfiles={playerProfiles}
                  showCoverage={currentStep?.showCoverage || state.showCoverage}
                  courtPhase={state.courtPhase}
                  rallyStep={currentStep}
                />
              ) : (
                <div className="text-gray-500 text-center px-6">
                  <p className="text-lg mb-2 text-white font-bold">Set Up Your Team</p>
                  <p className="text-sm mb-4">Create a lineup to see the playbook.</p>
                  <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'more' })}
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95">
                    Go to Team
                  </button>
                </div>
              )}
            </div>

            <RotationControls currentRotation={state.currentRotation} dispatch={dispatch}
              onRotationChange={() => setStepIdx(0)} />

            {state.selectedSlot != null && (
              <PlayerStrategyCard selectedSlot={state.selectedSlot} rotation={state.currentRotation}
                placements={placements} onClose={handleCloseCard} />
            )}
          </>
        )}

        {state.activeTab === 'gameday' && (
          <GameDayPanel state={state} dispatch={dispatch} placements={placements} playerProfiles={playerProfiles} />
        )}
        {state.activeTab === 'stats' && (
          <StatsPanel state={state} dispatch={dispatch} activeMatch={activeMatch}
            activeLineup={activeLineup} playerProfiles={playerProfiles} placements={placements} />
        )}
        {state.activeTab === 'practice' && (
          <PracticePanel state={state} dispatch={dispatch} playerProfiles={playerProfiles} />
        )}
        {state.activeTab === 'film' && (
          <FilmReviewPanel state={state} dispatch={dispatch} placements={placements} playerProfiles={playerProfiles} />
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
