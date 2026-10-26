import { useState, useCallback, useMemo } from 'react';
import NightPlanBuilder from './NightPlanBuilder';
import LiveSetTracker from './LiveSetTracker';

// ------------------------------------------------------------------
// GameDayPanel: plan list → plan builder (a plan is active) → live set
// "New plan" lives in the page header and just dispatches CREATE_NIGHT_PLAN,
// which makes the new plan active and so opens the builder.
// ------------------------------------------------------------------
export default function GameDayPanel({ state, dispatch }) {
  const { nightPlans = [], activeNightPlanId, players, lineups } = state;

  const [liveMatch, setLiveMatch] = useState(null); // { matchIndex, setIndex }

  // Derive active plan from state
  const activePlan = useMemo(
    () => nightPlans.find((p) => p.id === activeNightPlanId) ?? null,
    [nightPlans, activeNightPlanId],
  );

  // ---- handlers ----------------------------------------------------

  const handleSelectPlan = useCallback(
    (id) => {
      dispatch({ type: 'SET_ACTIVE_NIGHT_PLAN', planId: id });
    },
    [dispatch],
  );

  const handleBackToList = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_NIGHT_PLAN', planId: null });
  }, [dispatch]);

  const handleGoLive = useCallback(
    (matchIndex, setIndex) => {
      setLiveMatch({ matchIndex, setIndex });
    },
    [],
  );

  const handleEndLive = useCallback(() => {
    setLiveMatch(null);
  }, []);

  const handleDeletePlan = useCallback(
    (id) => {
      dispatch({ type: 'DELETE_NIGHT_PLAN', planId: id });
      if (id === activeNightPlanId) {
        dispatch({ type: 'SET_ACTIVE_NIGHT_PLAN', planId: null });
      }
    },
    [dispatch, activeNightPlanId],
  );

  // ---- render helpers ----------------------------------------------

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const countConfiguredMatches = (plan) => {
    if (!plan?.matches) return 0;
    return plan.matches.filter(
      (m) => m.opponent || m.sets?.some((s) => s.system),
    ).length;
  };

  // ---- views -------------------------------------------------------

  // Live view
  if (activePlan && liveMatch) {
    return (
      <LiveSetTracker
        plan={activePlan}
        matchIndex={liveMatch.matchIndex}
        setIndex={liveMatch.setIndex}
        players={players}
        dispatch={dispatch}
        onEnd={handleEndLive}
      />
    );
  }

  // Builder view
  if (activePlan) {
    return (
      <NightPlanBuilder
        plan={activePlan}
        players={players}
        lineups={lineups}
        dispatch={dispatch}
        onBack={handleBackToList}
        onGoLive={handleGoLive}
      />
    );
  }

  // ---- default: plan list ------------------------------------------

  return (
    <div>
      {/* Plan list */}
      <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {nightPlans.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 text-sm gap-3 rounded-2xl border border-dashed border-[var(--color-line)]">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="text-gray-700"
            >
              <rect
                x="8"
                y="6"
                width="32"
                height="36"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 6V2M32 6V2M8 16h32"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 26h8M24 22v8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>No game plans yet.</span>
            <span className="text-gray-600">
              Use "New plan" to plan your night.
            </span>
          </div>
        )}

        {nightPlans.map((plan) => {
          const configured = countConfiguredMatches(plan);
          const hasLive = plan.matches?.some((m) =>
            m.sets?.some((s) => s.live?.active),
          );

          return (
            <div
              key={plan.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                         bg-(--color-surface-2) active:bg-(--color-surface-3)
                         transition-colors cursor-pointer border
                         ${hasLive ? 'border-yellow-500/30' : 'border-transparent'}`}
              onClick={() => handleSelectPlan(plan.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectPlan(plan.id);
                }
              }}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-100 truncate">
                    {plan.name}
                  </span>
                  {hasLive && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                                     bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {formatDate(plan.date)}
                  </span>
                  <span className="text-xs text-gray-600">
                    {configured}/{plan.matches?.length || 0} matches
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlan(plan.id);
                }}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg
                           text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                aria-label={`Delete ${plan.name}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M5 4.5 5.5 13h5L11 4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
