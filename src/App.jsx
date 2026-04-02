import { useCallback, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import PlayerStrategyCard from './components/court/PlayerStrategyCard';
import RotationSummary from './components/court/RotationSummary';
import RotationControls from './components/controls/RotationControls';
import FormationSelector from './components/controls/FormationSelector';
import ResponsibilitySelector from './components/controls/ResponsibilitySelector';
import BottomNav from './components/controls/BottomNav';
import RosterPanel from './components/roster/RosterPanel';
import LineupPanel from './components/lineup/LineupPanel';
import StatsPanel from './components/stats/StatsPanel';
import AnalysisPanel from './components/analysis/AnalysisPanel';
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

  // Compute heatmap data: aggregate stat density per court zone.
  // For each stat entry, determine which rotational position (= court zone 1-6)
  // the player was in by looking up their slot in the lineup at that rotation.
  const heatmapData = useMemo(() => {
    if (!state.showHeatmap || state.statEntries.length === 0 || !activeLineup) return null;
    const zones = {};
    const POSITIVE_STATS = new Set(['kill', 'attackTip', 'attackTooled', 'ace', 'blockSolo', 'blockAssist', 'dig', 'passPerfect', 'passGood', 'assist', 'freeBall', 'coverDig']);

    for (const e of state.statEntries) {
      if (!e.rotation || e.playerId === '__team__') continue;

      // Derive which slot this player occupied in this rotation
      const slots = deriveRot(activeLineup.slots, e.rotation);
      let zone = null;
      for (let pos = 1; pos <= 6; pos++) {
        if (slots[pos] === e.playerId) { zone = pos; break; }
      }
      // Check libero — libero replaces middle in back row
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
      {state.activeTab === 'court' && (
        <>
          <FormationSelector
            activeFormationId={state.activeFormationId}
            dispatch={dispatch}
          />
          <ResponsibilitySelector
            activeResponsibilityId={state.activeResponsibilityId}
            dispatch={dispatch}
          />

          {/* Court overlay toggles */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-surface)]">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_ROUTES' })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                state.showRoutes
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              {state.showRoutes ? 'Routes ON' : 'Routes'}
            </button>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_HEATMAP' })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                state.showHeatmap
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              {state.showHeatmap ? 'Heatmap ON' : 'Heatmap'}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 min-h-0 bg-[var(--color-surface)]">
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
              <div className="text-gray-500 text-center px-4">
                <p className="text-lg mb-2">No lineup selected</p>
                <button
                  onClick={() => dispatch({ type: 'SET_TAB', tab: 'lineups' })}
                  className="text-sm text-[var(--color-accent)] underline"
                >
                  Go to Lineups to create one
                </button>
              </div>
            )}
          </div>

          {/* Rotation Summary — between court and controls */}
          {activeLineup && (
            <RotationSummary
              rotation={state.currentRotation}
              placements={placements}
            />
          )}

          <RotationControls
            currentRotation={state.currentRotation}
            dispatch={dispatch}
          />

          {/* Strategy Card overlay */}
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

      {state.activeTab === 'stats' && (
        <StatsPanel
          state={state}
          dispatch={dispatch}
          activeMatch={activeMatch}
        />
      )}

      {state.activeTab === 'roster' && (
        <RosterPanel
          players={state.players}
          dispatch={dispatch}
          activeLineup={activeLineup}
          statEntries={state.statEntries}
        />
      )}

      {state.activeTab === 'lineups' && (
        <LineupPanel
          lineups={state.lineups}
          activeLineupId={state.activeLineupId}
          players={state.players}
          dispatch={dispatch}
        />
      )}

      {state.activeTab === 'analysis' && (
        <AnalysisPanel
          state={state}
          dispatch={dispatch}
          activeLineup={activeLineup}
          playerProfiles={playerProfiles}
        />
      )}

      {state.activeTab === 'settings' && (
        <SettingsPanel state={state} dispatch={dispatch} />
      )}

      <BottomNav activeTab={state.activeTab} dispatch={dispatch} />
    </div>
  );
}
