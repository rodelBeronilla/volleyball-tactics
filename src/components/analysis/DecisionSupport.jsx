import { useMemo, useState } from 'react';
import { suggestLineupChanges, identifyDevelopmentAreas } from '../../utils/decisionEngine';

export default function DecisionSupport({ players, playerProfiles, activeLineup, statEntries, experimentNotes = [], dispatch }) {
  const [noteText, setNoteText] = useState('');

  const suggestions = useMemo(() => {
    if (!activeLineup || Object.keys(playerProfiles).length === 0) return [];
    return suggestLineupChanges(players, playerProfiles, activeLineup);
  }, [players, playerProfiles, activeLineup]);

  const devAreas = useMemo(() => {
    if (Object.keys(playerProfiles).length === 0) return [];
    return identifyDevelopmentAreas(players, playerProfiles);
  }, [players, playerProfiles]);

  const hasData = statEntries.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 px-4">
        <p className="text-center text-sm">Accumulate match data to receive evidence-based recommendations</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Lineup Recommendations */}
      {suggestions.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Recommendations</div>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <div key={i} className={`p-3 rounded-xl border ${
                s.impact === 'high' ? 'bg-red-900/10 border-red-800/20' :
                s.impact === 'medium' ? 'bg-yellow-900/10 border-yellow-800/20' :
                'bg-blue-900/10 border-blue-800/20'
              }`}>
                <div className="text-xs text-white font-medium">{s.description}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.evidence}</div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                  s.impact === 'high' ? 'bg-red-900/30 text-red-400' :
                  s.impact === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {s.impact} impact
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Development Areas */}
      {devAreas.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Development Tracker</div>
          <div className="space-y-1.5">
            {devAreas.slice(0, 8).map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                <div className="flex-1">
                  <div className="text-xs text-white font-medium">{d.playerName}</div>
                  <div className="text-xs text-gray-400">{d.suggestion}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">{d.area}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-400 tabular-nums">{d.current}</span>
                    <span className="text-[8px] text-gray-500">/ {d.baseline}</span>
                    <span className={`text-xs ${
                      d.trend === 'improving' ? 'text-green-400' :
                      d.trend === 'declining' ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {d.trend === 'improving' ? '▲' : d.trend === 'declining' ? '▼' : '–'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiment Log */}
      <div>
        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Experiment Log</div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] text-white text-xs border border-white/10 focus:border-[var(--color-accent)] outline-none"
            placeholder="What change did you make? (e.g., swapped OH1 to slot 4)"
          />
          <button
            onClick={() => {
              if (!noteText.trim()) return;
              dispatch({ type: 'ADD_EXPERIMENT_NOTE', text: noteText.trim() });
              setNoteText('');
            }}
            className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold active:scale-95 shrink-0"
          >
            Log
          </button>
        </div>
        {/* Saved notes */}
        {experimentNotes.length > 0 ? (
          <div className="space-y-1 mt-2">
            {[...experimentNotes].reverse().map(n => (
              <div key={n.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                <div>
                  <div className="text-xs text-white">{n.text}</div>
                  <div className="text-xs text-gray-500">{n.date}</div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_EXPERIMENT_NOTE', noteId: n.id })}
                  className="text-gray-600 text-xs px-1 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mt-1">
            No experiments logged yet. Track what changes you make and correlate with stat trends.
          </div>
        )}
      </div>

      {/* No recommendations state */}
      {suggestions.length === 0 && devAreas.length === 0 && (
        <div className="text-center text-gray-500 py-4 text-sm">
          No issues detected. Continue recording match data for deeper analysis.
        </div>
      )}
    </div>
  );
}
