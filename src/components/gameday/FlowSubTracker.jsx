import { useMemo } from 'react';
import { POSITIONS } from '../../data/positions';

const TRIO_LABELS = {
  setters: 'Setters',
  hitters: 'Hitters',
  middles: 'Middles',
};

function PlayerChip({ player, dimmed, highlight }) {
  const pos = player?.position || 'ds';
  const color = POSITIONS[pos]?.color || '#6b7280';

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all
        ${dimmed ? 'opacity-40 border-dashed' : ''}
        ${highlight ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent' : ''}
      `}
      style={{
        backgroundColor: dimmed ? 'transparent' : `${color}20`,
        borderColor: color,
        borderWidth: '1px',
        borderStyle: dimmed ? 'dashed' : 'solid',
        color: dimmed ? '#9ca3af' : color,
      }}
    >
      {player?.number != null && (
        <span className="font-bold">#{player.number}</span>
      )}
      <span className="truncate max-w-[5rem]">{player?.name || '?'}</span>
    </div>
  );
}

export default function FlowSubTracker({
  trioState,
  servingOrder,
  currentServer,
  players,
}) {
  const playerMap = useMemo(
    () => Object.fromEntries((players || []).map((p) => [p.id, p])),
    [players],
  );

  if (!trioState) return null;

  const trioNames = ['setters', 'hitters', 'middles'];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Flow Subs
      </h4>

      {trioNames.map((name) => {
        const trio = trioState[name];
        if (!trio) return null;

        const onCourt = trio.onCourt || [];
        const benchId = trio.benchPlayerId;

        // Count how many subs this trio has done (based on bench swaps)
        const subCount = onCourt.length + (benchId ? 1 : 0) - (onCourt.length || 0);

        return (
          <div
            key={name}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-(--color-surface-2)"
          >
            {/* Trio label */}
            <span className="text-xs font-semibold text-gray-400 w-16 shrink-0">
              {TRIO_LABELS[name] || name}
            </span>

            {/* On-court players */}
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {onCourt.map((pid) => {
                const p = playerMap[pid];
                const isAboutToSubOut = pid === currentServer;
                return (
                  <PlayerChip
                    key={pid}
                    player={p}
                    dimmed={false}
                    highlight={isAboutToSubOut}
                  />
                );
              })}

              {/* Separator arrow */}
              {benchId && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 text-gray-600"
                >
                  <path
                    d="M3 8h10M10 5l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Bench player */}
              {benchId && (
                <PlayerChip
                  player={playerMap[benchId]}
                  dimmed={true}
                  highlight={false}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
