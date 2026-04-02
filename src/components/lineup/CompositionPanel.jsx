import { useMemo } from 'react';
import { analyzeComposition, ARCHETYPES, ATTRIBUTES, ATTRIBUTE_LABELS } from '../../data/archetypes';
import { getEffectiveRatings } from '../../utils/statRatings';

function ProfileBar({ label, value, max = 10 }) {
  if (!value) return null;
  const pct = (value / max) * 100;
  const color = value >= 7 ? '#22c55e' : value >= 4.5 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] text-gray-300 w-6 text-right tabular-nums font-medium">{value}</span>
    </div>
  );
}

export default function CompositionPanel({ players, activeLineup, statEntries = [] }) {
  const analysis = analyzeComposition(players, activeLineup);

  // Compute effective (stat-adjusted) lineup profile
  const effectiveProfile = useMemo(() => {
    if (!activeLineup || statEntries.length === 0) return null;
    const starters = [];
    for (let pos = 1; pos <= 6; pos++) {
      const pid = activeLineup.slots[pos];
      const player = pid ? players.find(p => p.id === pid) : null;
      if (player) starters.push(player);
    }
    const libero = activeLineup.liberoId ? players.find(p => p.id === activeLineup.liberoId) : null;
    const allPlayers = [...starters, ...(libero ? [libero] : [])];
    if (allPlayers.length === 0) return null;

    const sums = {};
    let count = 0;
    ATTRIBUTES.forEach(a => { sums[a] = 0; });
    for (const p of allPlayers) {
      const { ratings, hasStats } = getEffectiveRatings(p, statEntries);
      if (hasStats) {
        for (const attr of ATTRIBUTES) sums[attr] += ratings[attr];
        count++;
      }
    }
    if (count === 0) return null;
    const profile = {};
    for (const attr of ATTRIBUTES) profile[attr] = Math.round((sums[attr] / count) * 10) / 10;
    return profile;
  }, [activeLineup, players, statEntries]);

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

      {/* Lineup Attribute Profile */}
      {analysis.profile && ATTRIBUTES.some(a => analysis.profile[a] > 0) && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Lineup Profile</h4>
          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 space-y-1.5">
            {ATTRIBUTES.map(attr => (
              <ProfileBar
                key={attr}
                label={ATTRIBUTE_LABELS[attr]}
                value={analysis.profile[attr]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stat-Adjusted Profile */}
      {effectiveProfile && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">
            Stat-Adjusted Profile <span className="text-green-400 font-normal">(from game data)</span>
          </h4>
          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-green-800/20 space-y-1.5">
            {ATTRIBUTES.map(attr => (
              <ProfileBar
                key={attr}
                label={ATTRIBUTE_LABELS[attr]}
                value={effectiveProfile[attr]}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Archetype Reference */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase">Archetype Reference</h4>
        <div className="text-xs text-gray-500 mb-2">Assign archetypes in the Roster tab for attribute-based analysis</div>
        <div className="space-y-1.5">
          {Object.entries(ARCHETYPES).map(([key, arch]) => (
            <div key={key} className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: arch.color }} />
                <span className="text-white text-xs font-medium">{arch.label}</span>
                <span className="text-gray-500 text-[10px] ml-1">{arch.description}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {ATTRIBUTES.map(attr => {
                  const val = arch.ratings[attr];
                  if (val <= 1) return null; // skip floor values (libero attack/block/serve)
                  const color = val >= 8 ? 'text-green-400 bg-green-900/30' :
                                val >= 5 ? 'text-gray-300 bg-white/5' :
                                'text-red-400 bg-red-900/30';
                  return (
                    <span key={attr} className={`px-1.5 py-0.5 rounded text-[10px] ${color}`}>
                      {ATTRIBUTE_LABELS[attr].slice(0, 3)} {val}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
