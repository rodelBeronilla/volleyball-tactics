import { useCallback } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import RotationControls from './components/controls/RotationControls';
import FormationSelector from './components/controls/FormationSelector';
import BottomNav from './components/controls/BottomNav';
import RosterPanel from './components/roster/RosterPanel';
import LineupPanel from './components/lineup/LineupPanel';

export default function App() {
  const { state, dispatch, activeLineup, currentSlots, placements, getPlayer } = useAppState();

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);

  return (
    <div className="flex flex-col h-full">
      {state.activeTab === 'court' && (
        <>
          <FormationSelector
            activeFormationId={state.activeFormationId}
            dispatch={dispatch}
          />
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 bg-[var(--color-surface)]">
            {activeLineup ? (
              <Court
                placements={placements}
                dispatch={dispatch}
                onSwipeLeft={onSwipeLeft}
                onSwipeRight={onSwipeRight}
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
            currentSlots={currentSlots}
            getPlayer={getPlayer}
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

      <BottomNav activeTab={state.activeTab} dispatch={dispatch} />
    </div>
  );
}
