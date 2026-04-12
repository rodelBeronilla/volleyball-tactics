import { useMemo } from 'react';
import { checkFriction, BUFFER_PLAYERS } from '../../data/systems';

const SEVERITY_STYLES = {
  high: 'bg-red-500/20 border-red-500/40 text-red-300',
  medium: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  low: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
};

const SEVERITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-500',
};

export default function FrictionWarning({ courtPlayerIds, players, frictionMap }) {
  const playerMap = useMemo(
    () => Object.fromEntries((players || []).map((p) => [p.id, p])),
    [players],
  );

  const warnings = useMemo(() => {
    if (!courtPlayerIds?.length || !frictionMap) return [];
    return checkFriction(courtPlayerIds, frictionMap);
  }, [courtPlayerIds, frictionMap]);

  // Find buffer player names for display
  const bufferNames = useMemo(() => {
    if (!frictionMap) return [];
    return BUFFER_PLAYERS.map((key) => {
      const pid = frictionMap[key];
      if (!pid) return null;
      const p = playerMap[pid];
      return p ? p.name : null;
    }).filter(Boolean);
  }, [frictionMap, playerMap]);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {warnings.map((w) => {
        const pA = playerMap[w.playerAId];
        const pB = playerMap[w.playerBId];
        const nameA = pA?.name || 'Unknown';
        const nameB = pB?.name || 'Unknown';

        return (
          <div
            key={w.id}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${SEVERITY_STYLES[w.severity] || SEVERITY_STYLES.low}`}
          >
            <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${SEVERITY_DOT[w.severity] || SEVERITY_DOT.low}`} />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
                {nameA} + {nameB}
              </span>
              <span className="opacity-80">{w.description}</span>
              {w.buffered && bufferNames.length > 0 && (
                <span className="text-green-400 mt-0.5">
                  Buffered by {bufferNames.join(', ')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
