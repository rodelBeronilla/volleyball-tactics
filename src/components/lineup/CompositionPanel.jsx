import { analyzeComposition, ARCHETYPES } from '../../data/archetypes';

export default function CompositionPanel({ players, activeLineup }) {
  const analysis = analyzeComposition(players, activeLineup);

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      {/* Score */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
          analysis.score >= 80 ? 'bg-green-900/40 text-green-400' :
          analysis.score >= 50 ? 'bg-yellow-900/40 text-yellow-400' :
          'bg-red-900/40 text-red-400'
        }`}>
          {analysis.score}
        </div>
        <div>
          <div className="text-white font-bold">Composition Fit</div>
          <div className="text-xs text-gray-400">
            {analysis.score >= 80 ? 'Strong lineup composition' :
             analysis.score >= 50 ? 'Some adjustments recommended' :
             'Significant issues to address'}
          </div>
        </div>
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase">Issues</h4>
          <div className="space-y-1.5">
            {analysis.issues.map((issue, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg text-sm ${
                  issue.severity === 'error'
                    ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                    : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30'
                }`}
              >
                {issue.severity === 'error' ? '!!' : '!'} {issue.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase">Strengths</h4>
          <div className="space-y-1.5">
            {analysis.strengths.map((s, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-green-900/20 text-green-400 border border-green-800/30 text-sm">
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase">Suggestions</h4>
          <div className="space-y-1.5">
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-800/30 text-sm">
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archetype Legend */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase">Player Archetypes</h4>
        <div className="text-xs text-gray-500 mb-2">Assign archetypes in the Roster tab to get deeper analysis</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(ARCHETYPES).map(([key, arch]) => (
            <div key={key} className="p-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: arch.color }} />
                <span className="text-white text-xs font-medium">{arch.label}</span>
              </div>
              <div className="text-gray-500 text-[10px] mt-0.5 leading-tight">{arch.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
