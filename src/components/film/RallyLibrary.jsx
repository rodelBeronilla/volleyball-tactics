import { useState, useMemo } from 'react';
import { RALLY_TAGS } from '../../data/rallyTags';

const TAG_MAP = Object.fromEntries(RALLY_TAGS.map(t => [t.id, t]));

/**
 * Library of rallies with film review data.
 * Shows filterable list of rally cards; also shows rallies without film data.
 */
export default function RallyLibrary({
  rallies = [],
  matches = [],
  players = [],
  onSelectRally,
  onCreateNew,
  onAddFilmData,
}) {
  const [filterTag, setFilterTag] = useState(null);
  const [filterPlayer, setFilterPlayer] = useState(null);
  const [filterRotation, setFilterRotation] = useState(null);
  const [showAll, setShowAll] = useState(false); // show rallies without filmReview

  const matchMap = useMemo(
    () => Object.fromEntries(matches.map(m => [m.id, m])),
    [matches],
  );

  const filmRallies = useMemo(() => {
    return rallies
      .filter(r => r.filmReview)
      .filter(r => {
        if (filterTag && !(r.filmReview.tags || []).includes(filterTag)) return false;
        if (filterRotation && r.rotation !== filterRotation) return false;
        if (filterPlayer) {
          const hasPlayer = (r.filmReview.touches || []).some(t => t.playerId === filterPlayer);
          if (!hasPlayer) return false;
        }
        return true;
      });
  }, [rallies, filterTag, filterPlayer, filterRotation]);

  const noFilmRallies = useMemo(
    () => rallies.filter(r => !r.filmReview),
    [rallies],
  );

  const getMatchLabel = (matchId) => {
    const m = matchMap[matchId];
    return m ? `vs ${m.opponent}` : '';
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Rally Library</h3>
        <button
          onClick={onCreateNew}
          className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold active:scale-95 transition-transform"
        >
          + New Rally
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Tag filter */}
        <select
          value={filterTag || ''}
          onChange={e => setFilterTag(e.target.value || null)}
          className="text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1"
        >
          <option value="">All Tags</option>
          {RALLY_TAGS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {/* Player filter */}
        <select
          value={filterPlayer || ''}
          onChange={e => setFilterPlayer(e.target.value || null)}
          className="text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1"
        >
          <option value="">All Players</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
          ))}
        </select>

        {/* Rotation filter */}
        <select
          value={filterRotation || ''}
          onChange={e => setFilterRotation(e.target.value ? Number(e.target.value) : null)}
          className="text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1"
        >
          <option value="">All Rotations</option>
          {[1, 2, 3, 4, 5, 6].map(r => (
            <option key={r} value={r}>R{r}</option>
          ))}
        </select>
      </div>

      {/* Rally cards list */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {filmRallies.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">
            No film rallies found.{' '}
            <button onClick={onCreateNew} className="text-[var(--color-accent)] underline">
              Create one
            </button>
          </div>
        )}

        {filmRallies.map(rally => (
          <button
            key={rally.id}
            onClick={() => onSelectRally(rally)}
            className="w-full text-left bg-[var(--color-surface-2)] rounded-lg p-3 border border-white/5 hover:border-white/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/50 bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded">
                  R{rally.rotation}
                </span>
                <span className="text-xs text-white/50">
                  {rally.ourScore}-{rally.theirScore}
                </span>
                {rally.matchId && (
                  <span className="text-xs text-white/40">{getMatchLabel(rally.matchId)}</span>
                )}
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  rally.outcome === 'won'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {rally.outcome === 'won' ? 'W' : 'L'}
              </span>
            </div>

            {/* Tag badges */}
            {rally.filmReview.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {rally.filmReview.tags.map(tagId => {
                  const tag = TAG_MAP[tagId];
                  if (!tag) return null;
                  return (
                    <span
                      key={tagId}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: tag.color + '30', color: tag.color }}
                    >
                      {tag.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Touch count */}
            <div className="text-xs text-white/40">
              {rally.filmReview.touches?.length || 0} touches
              {rally.filmReview.notes ? ' \u2022 has notes' : ''}
            </div>
          </button>
        ))}

        {/* Rallies without film data */}
        {noFilmRallies.length > 0 && (
          <>
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="w-full text-center text-xs text-white/40 py-2 hover:text-white/60"
            >
              {showAll ? 'Hide' : 'Show'} {noFilmRallies.length} rall{noFilmRallies.length === 1 ? 'y' : 'ies'} without film data
            </button>

            {showAll && noFilmRallies.map(rally => (
              <div
                key={rally.id}
                className="w-full bg-[var(--color-surface-2)] rounded-lg p-3 border border-white/5 opacity-60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/50 bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded">
                    R{rally.rotation}
                  </span>
                  <span className="text-xs text-white/50">
                    {rally.ourScore}-{rally.theirScore}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      rally.outcome === 'won' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {rally.outcome === 'won' ? 'W' : 'L'}
                  </span>
                </div>
                <button
                  onClick={() => onAddFilmData(rally)}
                  className="text-xs px-2.5 py-1 rounded bg-[var(--color-surface-3)] text-[var(--color-accent)] font-semibold active:scale-95 transition-transform"
                >
                  Add Film Data
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
