import { useCallback } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import RotationControls from './components/controls/RotationControls';
import FormationSelector from './components/controls/FormationSelector';
import ResponsibilitySelector from './components/controls/ResponsibilitySelector';
import BottomNav from './components/controls/BottomNav';
import RosterPanel from './components/roster/RosterPanel';
import LineupPanel from './components/lineup/LineupPanel';
import CompositionPanel from './components/lineup/CompositionPanel';
import { getResponsibilities } from './data/responsibilities';

export default function App() {
  const { state, dispatch, activeLineup, currentSlots, placements, getPlayer } = useAppState();

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);

  // Get responsibilities for the current rotation if a responsibility set is active
  const responsibilities = state.activeResponsibilityId
    ? getResponsibilities(state.activeResponsibilityId, state.currentRotation)
    : null;

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
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 bg-[var(--color-surface)]">
            {activeLineup ? (
              <Court
                placements={placements}
                dispatch={dispatch}
                onSwipeLeft={onSwipeLeft}
                onSwipeRight={onSwipeRight}
                responsibilities={responsibilities}
              />
            ) : (
              <div className="text-gray-500 text-center px-4">
                <p className="text-lg mb-2">No lineup selected</p>
                <p className="text-sm">Go to Lineups tab to create one</p>
              </div>
            )}
          </div>
          <RotationControls
            currentRotation={state.currentRotation}
            dispatch={dispatch}
          />
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
