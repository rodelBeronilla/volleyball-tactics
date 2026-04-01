import { useCallback } from 'react';
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
import CompositionPanel from './components/lineup/CompositionPanel';
import { getResponsibilities } from './data/responsibilities';

export default function App() {
  const { state, dispatch, activeLineup, placements } = useAppState();

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);

  const responsibilities = state.activeResponsibilityId
    ? getResponsibilities(state.activeResponsibilityId, state.currentRotation)
    : null;

  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

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

          {/* Show Routes toggle */}
          <div className="flex items-center justify-between px-3 py-1 bg-[var(--color-surface)]">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_ROUTES' })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                state.showRoutes
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              {state.showRoutes ? 'Routes ON' : 'Show Routes'}
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
              />
            ) : (
              <div className="text-gray-500 text-center px-4">
                <p className="text-lg mb-2">No lineup selected</p>
                <p className="text-sm">Go to Lineups tab to create one</p>
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

      {state.activeTab === 'roster' && (
        <RosterPanel
          players={state.players}
          dispatch={dispatch}
          activeLineup={activeLineup}
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
        <div className="flex-1 flex flex-col bg-[var(--color-surface)] overflow-hidden">
          <div className="px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Lineup Analysis</h2>
            <p className="text-xs text-gray-400">Composition fit and archetype breakdown</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CompositionPanel
              players={state.players}
              activeLineup={activeLineup}
            />
          </div>
        </div>
      )}

      <BottomNav activeTab={state.activeTab} dispatch={dispatch} />
    </div>
  );
}
