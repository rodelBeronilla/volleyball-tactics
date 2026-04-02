import { useState, useMemo } from 'react';
import { POSITIONS } from '../../data/positions';
import { ATTRIBUTES, ATTRIBUTE_LABELS, ARCHETYPES } from '../../data/archetypes';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { computeFullProfile } from '../../utils/playerProfileEngine';
import { generatePlayerNarrative } from '../../utils/decisionEngine';
import SparkChart from './SparkChart';
import ImpactRing from './ImpactRing';

function RatingBar({ label, value, baseline, confidence }) {
  const pct = (value / 10) * 100;
  const basePct = (baseline / 10) * 100;
  const color = value >= 7 ? '#22c55e' : value >= 4.5 ? '#eab308' : '#ef4444';
  const delta = Math.round((value - baseline) * 10) / 10;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 relative h-2.5 rounded-full bg-white/5 overflow-hidden">
        {/* Baseline marker */}
        <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${basePct}%` }} />
        {/* Effective rating */}
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color, opacity: confidence > 0.2 ? 1 : 0.4 }}
        />
      </div>
      <span className="text-[11px] text-gray-300 w-5 text-right tabular-nums">{value}</span>
      {delta !== 0 && confidence > 0.2 && (
        <span className={`text-[10px] w-7 text-right tabular-nums ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  );
}

function TrendArrow({ direction }) {
  if (direction === 'improving') return <span className="text-green-400 text-xs">&#9650;</span>;
  if (direction === 'declining') return <span className="text-red-400 text-xs">&#9660;</span>;
  return <span className="text-gray-500 text-xs">&#9654;</span>;
}

export default function PlayerStats({ players, statEntries }) {
  const [selectedId, setSelectedId] = useState(null);
  const selectedPlayer = players.find(p => p.id === selectedId);

  const profile = useMemo(() => {
    if (!selectedPlayer) return null;
    return computeFullProfile(selectedPlayer, statEntries, []);
  }, [selectedPlayer, statEntries]);

  const narrative = useMemo(() => {
    if (!profile || !selectedPlayer) return '';
    return generatePlayerNarrative(profile, selectedPlayer);
  }, [profile, selectedPlayer]);

  return (
    <div className="flex flex-col h-full">
      {/* Player selector */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-[var(--color-surface-2)] border-b border-white/5">
        {players.map(p => {
          const pos = POSITIONS[p.position] || POSITIONS.ds;
          const isActive = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(isActive ? null : p.id)}
              className={`flex items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg transition-all ${
                isActive ? 'ring-1 ring-white/30' : 'opacity-60'
              }`}
              style={{ background: isActive ? pos.color + '22' : 'transparent' }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: pos.color }}>
                {p.number}
              </div>
              <span className="text-xs text-gray-300">{p.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!selectedPlayer ? (
          <div className="text-center text-gray-500 py-8 text-sm">Select a player to view their profile</div>
        ) : !profile ? (
          <div className="text-center text-gray-500 py-8 text-sm">Loading profile...</div>
        ) : (
          <>
            {/* ── Profile Header ── */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
              <ImpactRing score={profile.impactScore} size={56} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate">{selectedPlayer.name}</div>
                <div className="text-xs text-gray-400">
                  {POSITIONS[selectedPlayer.position]?.label || selectedPlayer.position}
                  {profile.detectedArchetype && ARCHETYPES[profile.detectedArchetype] && (
                    <span className="text-gray-300"> · {ARCHETYPES[profile.detectedArchetype].label} ({Math.round(profile.archetypeConfidence * 100)}%)</span>
                  )}
                </div>
                {profile.hasStats && (
                  <div className="flex gap-1 mt-1">
                    {Object.entries(profile.trends || {}).slice(0, 3).map(([attr, trend]) => (
                      <span key={attr} className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <TrendArrow direction={trend.direction} />
                        {ATTRIBUTE_LABELS[attr]?.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Narrative ── */}
            {profile.hasStats && narrative && (
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Assessment</div>
                <p className="text-xs text-gray-300 leading-relaxed">{narrative}</p>
              </div>
            )}

            {/* ── Attribute Ratings ── */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">
                Ratings {profile.hasStats && <span className="text-green-400 font-normal">(data-adjusted)</span>}
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 space-y-1.5">
                {ATTRIBUTES.map(attr => (
                  <RatingBar
                    key={attr}
                    label={ATTRIBUTE_LABELS[attr]}
                    value={profile.effectiveRatings[attr]}
                    baseline={profile.baseline[attr] || 5}
                    confidence={profile.confidence[attr] || 0}
                  />
                ))}
              </div>
            </div>

            {/* ── Performance Trends ── */}
            {profile.matchHistory?.length >= 2 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">Trends</div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 space-y-3">
                  {profile.statLine?.hitPct !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400">Hit %</span>
                        {profile.trends?.attack && <TrendArrow direction={profile.trends.attack.direction} />}
                      </div>
                      <SparkChart
                        values={profile.matchHistory.map(m => m.statLine?.hitPct).filter(v => v !== null)}
                        height={32}
                        labels={profile.matchHistory.map(m => m.opponent)}
                        colorFn={v => v >= 0.25 ? '#22c55e' : v >= 0.15 ? '#eab308' : '#ef4444'}
                      />
                    </div>
                  )}
                  {profile.statLine?.passAvg !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400">Pass Avg</span>
                        {profile.trends?.pass && <TrendArrow direction={profile.trends.pass.direction} />}
                      </div>
                      <SparkChart
                        values={profile.matchHistory.map(m => m.statLine?.passAvg).filter(v => v !== null)}
                        height={32}
                        labels={profile.matchHistory.map(m => m.opponent)}
                        colorFn={v => v >= 2.0 ? '#22c55e' : v >= 1.5 ? '#eab308' : '#ef4444'}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Rotation Breakdown ── */}
            {Object.keys(profile.rotationProfile || {}).length >= 3 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">By Rotation</div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map(r => {
                    const rp = profile.rotationProfile[r];
                    const metric = rp?.keyMetric;
                    const value = metric?.value;
                    const isGood = typeof value === 'number' && value > 0.2;
                    const isBad = typeof value === 'number' && value < 0.1;
                    return (
                      <div
                        key={r}
                        className={`p-1.5 rounded-lg text-center border ${
                          isGood ? 'bg-green-900/20 border-green-800/30' :
                          isBad ? 'bg-red-900/20 border-red-800/30' :
                          'bg-[var(--color-surface-2)] border-white/5'
                        }`}
                      >
                        <div className="text-[10px] text-gray-500">R{r}</div>
                        <div className={`text-xs font-bold tabular-nums ${
                          isGood ? 'text-green-400' : isBad ? 'text-red-400' : 'text-gray-300'
                        }`}>
                          {rp && metric ? (
                            typeof value === 'number' ? (value < 1 ? `${(value * 100).toFixed(0)}%` : value.toFixed(1)) : '–'
                          ) : '–'}
                        </div>
                        <div className="text-[8px] text-gray-500">{rp?.isFrontRow ? 'F' : 'B'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Tendencies ── */}
            {profile.tendencies?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">Tendencies</div>
                <div className="space-y-1">
                  {profile.tendencies.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] border border-white/5">
                      <div className="flex-1">
                        <div className="text-xs text-white font-medium">{t.label}</div>
                        <div className="text-[10px] text-gray-400">{t.evidence}</div>
                      </div>
                      <div className="w-8 h-1.5 rounded-full bg-white/5 overflow-hidden shrink-0 mt-1">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${(t.confidence || 0) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Strengths & Growth ── */}
            {(profile.strengths?.length > 0 || profile.weaknesses?.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {profile.strengths?.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 px-1">Strengths</div>
                    {profile.strengths.map((s, i) => (
                      <div key={i} className="p-2 rounded-lg bg-green-900/15 border border-green-800/20 mb-1">
                        <div className="text-[10px] text-green-400 font-bold">{s.area}</div>
                        <div className="text-[10px] text-green-400/70">{s.metric}: {s.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {profile.weaknesses?.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 px-1">Growth Areas</div>
                    {profile.weaknesses.map((w, i) => (
                      <div key={i} className="p-2 rounded-lg bg-red-900/15 border border-red-800/20 mb-1">
                        <div className="text-[10px] text-red-400 font-bold">{w.area}</div>
                        <div className="text-[10px] text-red-400/70">{w.metric}: {w.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Career Totals ── */}
            {profile.statLine && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">
                  Career ({profile.statLine.setsPlayed} sets)
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
                  <div className="flex flex-wrap gap-1.5">
                    {PLAYER_STAT_GROUPS.map(group =>
                      group.stats.map(statKey => {
                        const val = profile.statLine[statKey];
                        if (!val) return null;
                        const stat = STATS[statKey];
                        return (
                          <span key={statKey} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            stat.positive ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                          }`}>
                            {stat.label}: {val}
                          </span>
                        );
                      })
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                    {profile.statLine.hitPct !== null && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300">
                        Hit%: {(profile.statLine.hitPct * 100).toFixed(0)}%
                      </span>
                    )}
                    {profile.statLine.passAvg !== null && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300">
                        Pass: {profile.statLine.passAvg.toFixed(2)}
                      </span>
                    )}
                    {profile.statLine.blocksPerSet > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300">
                        Blk/Set: {profile.statLine.blocksPerSet.toFixed(1)}
                      </span>
                    )}
                    {profile.statLine.killsPerSet > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-300">
                        K/Set: {profile.statLine.killsPerSet.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── No stats state ── */}
            {!profile.hasStats && (
              <div className="text-center text-gray-500 py-4 text-sm">
                Record game stats to see data-driven profile analysis
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
