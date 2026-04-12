import { useCallback } from 'react';
import FairnessIndicator from './FairnessIndicator';
import SetCard from './SetCard';

export default function NightPlanBuilder({
  plan,
  players,
  lineups,
  dispatch,
  onBack,
  onGoLive,
}) {
  const matches = plan?.matches || [];

  const handleOpponentChange = useCallback(
    (matchIndex, opponent) => {
      dispatch({ type: 'SET_SET_OPPONENT', matchIndex, opponent });
    },
    [dispatch],
  );

  const handleGoLive = useCallback(
    (matchIndex, setIndex) => {
      dispatch({ type: 'START_SET', matchIndex, setIndex });
      onGoLive?.(matchIndex, setIndex);
    },
    [dispatch, onGoLive],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg
                     bg-(--color-surface-2) text-gray-400 active:bg-(--color-surface-3)
                     transition-colors"
          aria-label="Back to plans"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4L6 9l5 5" />
          </svg>
        </button>
        <div className="flex flex-col min-w-0">
          <h2 className="text-lg font-semibold text-gray-100 truncate">
            {plan?.name || 'Night Plan'}
          </h2>
          <span className="text-xs text-gray-500">{plan?.date}</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Fairness indicator */}
        <FairnessIndicator plan={plan} players={players} />

        {/* Match cards */}
        {matches.map((match, mi) => (
          <div
            key={mi}
            className="rounded-xl bg-(--color-surface) border border-white/10 overflow-hidden"
          >
            {/* Match header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-(--color-surface-2)">
              <span className="text-xs font-bold text-gray-500 uppercase">
                Match {mi + 1}
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={match.opponent || ''}
                  onChange={(e) => handleOpponentChange(mi, e.target.value)}
                  placeholder="Opponent name..."
                  className="w-full bg-transparent border-b border-white/10 focus:border-(--color-accent)
                             text-sm text-gray-200 placeholder-gray-600 py-1 outline-none
                             transition-colors"
                />
              </div>
            </div>

            {/* Set cards */}
            <div className="p-3 space-y-2">
              {(match.sets || []).map((set) => (
                <SetCard
                  key={set.setIndex}
                  set={set}
                  matchIndex={mi}
                  players={players}
                  lineups={lineups}
                  dispatch={dispatch}
                  onGoLive={handleGoLive}
                />
              ))}
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No matches configured in this plan.
          </div>
        )}
      </div>
    </div>
  );
}
