import { useState } from 'react';
import RosterPanel from '../roster/RosterPanel';
import LineupPanel from '../lineup/LineupPanel';

export default function TeamPanel({ state, dispatch, activeLineup }) {
  const [view, setView] = useState('roster');

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Toggle: Roster / Lineups */}
      <div className="flex bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
        <button
          onClick={() => setView('roster')}
          className={`flex-1 py-2.5 text-sm font-bold text-center transition-colors ${
            view === 'roster' ? 'text-white border-b-2 border-[var(--color-accent)]' : 'text-gray-500'
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => setView('lineups')}
          className={`flex-1 py-2.5 text-sm font-bold text-center transition-colors ${
            view === 'lineups' ? 'text-white border-b-2 border-[var(--color-accent)]' : 'text-gray-500'
          }`}
        >
          Lineups
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'roster' ? (
          <RosterPanel
            players={state.players}
            dispatch={dispatch}
            activeLineup={activeLineup}
            statEntries={state.statEntries}
          />
        ) : (
          <LineupPanel
            lineups={state.lineups}
            activeLineupId={state.activeLineupId}
            players={state.players}
            dispatch={dispatch}
          />
        )}
      </div>
    </div>
  );
}
