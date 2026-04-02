import { useCallback, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import PlayerStrategyCard from './components/court/PlayerStrategyCard';
import RotationSummary from './components/court/RotationSummary';
import RotationControls from './components/controls/RotationControls';
import FormationSelector from './components/controls/FormationSelector';
import ResponsibilitySelector from './components/controls/ResponsibilitySelector';
import BottomNav from './components/controls/BottomNav';
import StatsPanel from './components/stats/StatsPanel';
import TeamPanel from './components/team/TeamPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import { deriveRotation as deriveRot } from './utils/rotations';
import { getResponsibilities } from './data/responsibilities';

export default function App() {
  const { state, dispatch, activeLineup, activeMatch, placements, playerProfiles } = useAppState();

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);

  const responsibilities = state.activeResponsibilityId
    ? getResponsibilities(state.activeResponsibilityId, state.currentRotation)
    : null;

  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

  // Heatmap: map stats to court zones via player's rotational position
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
      {/* ── Court Tab ── */}
      {state.activeTab === 'court' && (
        <>
          {/* Compact toolbar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--color-surface-2)] border-b border-white/5 overflow-x-auto shrink-0">
            <FormationSelector activeFormationId={state.activeFormationId} dispatch={dispatch} compact />
            <div className="w-px h-5 bg-white/10 shrink-0" />
            <button
              onClick={() => dispatch({ type: 'TOGGLE_ROUTES' })}
              className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${
                state.showRoutes ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              Routes
            </button>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_HEATMAP' })}
              className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${
                state.showHeatmap ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              Heat
            </button>
            <ResponsibilitySelector activeResponsibilityId={state.activeResponsibilityId} dispatch={dispatch} compact />
          </div>

          {/* Court */}
          <div className="flex-1 flex items-center justify-center p-1 min-h-0 bg-[var(--color-surface)]">
            {activeLineup ? (
              <Court
                placements={placements}
                dispatch={dispatch}
                onSwipeLeft={onSwipeLeft}
                onSwipeRight={onSwipeRight}
                responsibilities={responsibilities}
                selectedSlot={state.selectedSlot}
                showRoutes={state.showRoutes}
                rotation={state.currentRotation}
                heatmapData={state.showHeatmap ? heatmapData : null}
                heatmapMode="quality"
                playerProfiles={playerProfiles}
              />
            ) : (
              <div className="text-gray-500 text-center px-6">
                <p className="text-lg mb-2 text-white font-bold">Set Up Your Team</p>
                <p className="text-sm mb-4">Create a lineup to see your court visualization.</p>
                <button
                  onClick={() => dispatch({ type: 'SET_TAB', tab: 'team' })}
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95"
                >
                  Go to Team
                </button>
              </div>
            )}
          </div>

          {/* Rotation summary + controls */}
          {activeLineup && (
            <RotationSummary rotation={state.currentRotation} placements={placements} />
          )}
          <RotationControls currentRotation={state.currentRotation} dispatch={dispatch} />

          {/* Strategy card overlay */}
          {state.selectedSlot != null && (
            <PlayerStrategyCard
              selectedSlot={state.selectedSlot}
              rotation={state.currentRotation}
              placements={placements}
              onClose={handleCloseCard}
            />
          )}
        </>
      )}

      {/* ── Stats Tab (includes Record, Matches, Players, Analysis) ── */}
      {state.activeTab === 'stats' && (
        <StatsPanel
          state={state}
          dispatch={dispatch}
          activeMatch={activeMatch}
          activeLineup={activeLineup}
          playerProfiles={playerProfiles}
        />
      )}

      {/* ── Team Tab (Roster + Lineups) ── */}
      {state.activeTab === 'team' && (
        <TeamPanel
          state={state}
          dispatch={dispatch}
          activeLineup={activeLineup}
        />
      )}

      {/* ── More Tab (Settings) ── */}
      {state.activeTab === 'more' && (
        <SettingsPanel state={state} dispatch={dispatch} />
      )}

      <BottomNav activeTab={state.activeTab} dispatch={dispatch} />
    </div>
  );
}
