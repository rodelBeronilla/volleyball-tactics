import { useState } from 'react';
import CompositionPanel from '../lineup/CompositionPanel';
import RotationAnalytics from './RotationAnalytics';
import SynergyView from './SynergyView';
import LineupOptimizer from './LineupOptimizer';
import DecisionSupport from './DecisionSupport';

const VIEWS = [
  { id: 'composition', label: 'Comp' },
  { id: 'rotations', label: 'Rotations' },
  { id: 'synergy', label: 'Synergy' },
  { id: 'optimizer', label: 'Optimize' },
  { id: 'decisions', label: 'Decisions' },
];

export default function AnalysisPanel({ state, dispatch, activeLineup, playerProfiles }) {
  const [view, setView] = useState('composition');

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-surface)] overflow-hidden">
      {/* Sub-navigation */}
      <div className="flex gap-1 px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5 overflow-x-auto">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
              v.id === view
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'composition' && (
          <CompositionPanel
            players={state.players}
            activeLineup={activeLineup}
            statEntries={state.statEntries}
          />
        )}
        {view === 'rotations' && (
          <RotationAnalytics statEntries={state.statEntries} />
        )}
        {view === 'synergy' && (
          <SynergyView
            statEntries={state.statEntries}
            players={state.players}
            activeLineup={activeLineup}
          />
        )}
        {view === 'optimizer' && (
          <LineupOptimizer
            players={state.players}
            playerProfiles={playerProfiles}
            activeLineup={activeLineup}
          />
        )}
        {view === 'decisions' && (
          <DecisionSupport
            players={state.players}
            playerProfiles={playerProfiles}
            activeLineup={activeLineup}
            statEntries={state.statEntries}
            dispatch={dispatch}
          />
        )}
      </div>
    </div>
  );
}
