import { useMemo } from 'react';
import { DRILLS } from '../../data/drills';
import PracticePlanBuilder from './PracticePlanBuilder';

function formatDate(dateStr) {
  if (!dateStr) return 'No date';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function PracticePanel({ state, dispatch, playerProfiles }) {
  const drillMap = useMemo(() => {
    const map = {};
    DRILLS.forEach((d) => { map[d.id] = d; });
    return map;
  }, []);

  const plans = state.practicePlans || [];
  const activePlan = plans.find((p) => p.id === state.activePracticePlanId) || null;
  const players = state.players || [];

  const handleNewPlan = () => {
    const id = 'plan-' + Date.now();
    const today = new Date().toISOString().slice(0, 10);
    dispatch({
      type: 'CREATE_PRACTICE_PLAN',
      payload: {
        id,
        name: 'New Practice Plan',
        date: today,
        createdAt: new Date().toISOString(),
        blocks: [],
      },
    });
    dispatch({
      type: 'SET_ACTIVE_PRACTICE_PLAN',
      payload: { planId: id },
    });
  };

  const handleSelectPlan = (planId) => {
    dispatch({
      type: 'SET_ACTIVE_PRACTICE_PLAN',
      payload: { planId },
    });
  };

  const handleDeletePlan = (e, planId) => {
    e.stopPropagation();
    dispatch({
      type: 'DELETE_PRACTICE_PLAN',
      payload: { planId },
    });
  };

  const handleBack = () => {
    dispatch({
      type: 'SET_ACTIVE_PRACTICE_PLAN',
      payload: { planId: null },
    });
  };

  // Show builder when a plan is active
  if (activePlan) {
    return (
      <PracticePlanBuilder
        plan={activePlan}
        players={players}
        dispatch={dispatch}
        onBack={handleBack}
        playerProfiles={playerProfiles}
      />
    );
  }

  // Plan list view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h2 className="text-base font-bold text-gray-100">Practice Plans</h2>
        <button
          onClick={handleNewPlan}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/90 hover:bg-accent text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14m-7-7h14" />
          </svg>
          New Plan
        </button>
      </div>

      {/* Plan cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-1">No practice plans yet</p>
            <p className="text-xs text-gray-600 mb-4">
              Create your first plan to start organizing drills.
            </p>
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/90 hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Create First Plan
            </button>
          </div>
        ) : (
          plans.map((plan) => {
            const blocks = plan.blocks || [];
            const totalDuration = blocks.reduce((sum, b) => sum + (b.duration || 0), 0);
            const drillCount = blocks.length;

            // Collect unique skill tags
            const skills = new Set();
            blocks.forEach((b) => {
              const drill = drillMap[b.drillId];
              if (drill) drill.skillFocus.forEach((s) => skills.add(s));
            });

            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full text-left bg-surface-2 hover:bg-surface-3/70 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-100 truncate">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(plan.date)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeletePlan(e, plan.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {totalDuration} min
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                    </svg>
                    {drillCount} drill{drillCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {skills.size > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...skills].slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 capitalize"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.size > 5 && (
                      <span className="text-[9px] text-gray-600">
                        +{skills.size - 5}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
