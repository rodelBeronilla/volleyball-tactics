import { useState, useMemo, useCallback } from 'react';
import { DRILLS } from '../../data/drills';
import DrillBlockCard from './DrillBlockCard';
import DrillLibrary from './DrillLibrary';
import PlanSummary from './PlanSummary';

export default function PracticePlanBuilder({ plan, players, dispatch, onBack, playerProfiles }) {
  const [showLibrary, setShowLibrary] = useState(false);

  const drillMap = useMemo(() => {
    const map = {};
    DRILLS.forEach((d) => { map[d.id] = d; });
    return map;
  }, []);

  const totalDuration = useMemo(() => {
    return (plan.blocks || []).reduce((sum, b) => sum + (b.duration || 0), 0);
  }, [plan.blocks]);

  const handleAddDrill = useCallback(
    (drill) => {
      dispatch({
        type: 'ADD_DRILL_TO_PLAN',
        payload: {
          planId: plan.id,
          drillId: drill.id,
          duration: drill.defaultDuration,
        },
      });
      setShowLibrary(false);
    },
    [dispatch, plan.id]
  );

  const handleNameChange = (name) => {
    dispatch({
      type: 'UPDATE_PRACTICE_PLAN',
      payload: { planId: plan.id, updates: { name } },
    });
  };

  const handleDateChange = (date) => {
    dispatch({
      type: 'UPDATE_PRACTICE_PLAN',
      payload: { planId: plan.id, updates: { date } },
    });
  };

  // Compute running start times
  const startMinutes = useMemo(() => {
    const starts = [];
    let t = 0;
    (plan.blocks || []).forEach((block) => {
      starts.push(t);
      t += block.duration || 0;
    });
    return starts;
  }, [plan.blocks]);

  if (showLibrary) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b border-white/5">
          <button
            onClick={() => setShowLibrary(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-semibold text-gray-200">Drill Library</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <DrillLibrary onAddDrill={handleAddDrill} activePlanId={plan.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={plan.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-transparent text-base font-bold text-gray-100 focus:outline-none border-b border-transparent focus:border-accent/40 pb-0.5"
              placeholder="Plan name..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pl-10">
          <input
            type="date"
            value={plan.date || ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-surface-2 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
          />
          <span className="text-xs text-gray-500 tabular-nums">
            {(plan.blocks || []).length} drill{(plan.blocks || []).length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs font-semibold text-accent tabular-nums">
            {totalDuration} min
          </span>
        </div>
      </div>

      {/* Drill blocks timeline */}
      <div className="flex-1 overflow-y-auto">
        {(!plan.blocks || plan.blocks.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-1">No drills yet</p>
            <p className="text-xs text-gray-600 mb-4">
              Add drills from the library to build your practice plan.
            </p>
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/90 hover:bg-accent text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Browse Drills
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {/* Timeline rail */}
            {plan.blocks.map((block, i) => (
              <div key={block.id} className="relative">
                {/* Connector line */}
                {i < plan.blocks.length - 1 && (
                  <div className="absolute left-[27px] top-full w-0.5 h-2 bg-white/5 z-0" />
                )}
                <DrillBlockCard
                  block={block}
                  drill={drillMap[block.drillId]}
                  index={i}
                  totalBlocks={plan.blocks.length}
                  startMinute={startMinutes[i]}
                  players={players}
                  dispatch={dispatch}
                />
              </div>
            ))}

            {/* Add drill button */}
            <button
              onClick={() => setShowLibrary(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-white/10 hover:border-accent/30 rounded-xl text-sm text-gray-500 hover:text-accent transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Add Drill
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <PlanSummary plan={plan} players={players} />
    </div>
  );
}
