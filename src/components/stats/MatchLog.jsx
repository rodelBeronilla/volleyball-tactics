import { useMemo } from 'react';

export default function MatchLog({ matches, statEntries, onSelect, onDelete }) {
  const sorted = useMemo(() =>
    [...matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [matches]
  );

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {sorted.length === 0 && (
        <div className="text-center text-gray-500 py-8 text-sm">No matches recorded yet</div>
      )}
      {sorted.map(m => {
        const setsWon = m.sets.filter(s => s.won === true).length;
        const setsLost = m.sets.filter(s => s.won === false).length;
        const matchWon = setsWon > setsLost;
        const entryCount = statEntries.filter(e => e.matchId === m.id).length;

        return (
          <div
            key={m.id}
            className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-white font-bold text-sm">vs {m.opponent}</span>
                <span className="text-gray-500 text-xs ml-2">{m.date}</span>
              </div>
              <div className="flex items-center gap-1">
                {m.completed && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    matchWon ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {matchWon ? 'W' : 'L'} {setsWon}-{setsLost}
                  </span>
                )}
                {!m.completed && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-900/30 text-yellow-400">
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Set scores */}
            <div className="flex gap-1.5 mb-2">
              {m.sets.map(s => (
                <span key={s.number} className={`px-2 py-0.5 rounded text-xs ${
                  s.won === true ? 'bg-green-900/20 text-green-400' :
                  s.won === false ? 'bg-red-900/20 text-red-400' :
                  'bg-white/5 text-gray-400'
                }`}>
                  S{s.number}: {s.ourScore}-{s.theirScore}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{entryCount} stat entries</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onSelect(m.id)}
                  className="px-3 py-1 rounded bg-[var(--color-surface-3)] text-gray-300 text-xs active:scale-95"
                >
                  Details
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete match vs ${m.opponent}?`)) onDelete(m.id);
                  }}
                  className="px-3 py-1 rounded bg-red-900/30 text-red-400 text-xs active:scale-95"
                >
                  Del
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
