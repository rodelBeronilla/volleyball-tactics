import { useMemo } from 'react';
import { validateFairness } from '../../data/systems';

export default function FairnessIndicator({ plan, players }) {
  const result = useMemo(() => {
    if (!plan || !players?.length) return { valid: true, violations: [] };
    return validateFairness(plan, players);
  }, [plan, players]);

  const playerMap = useMemo(
    () => Object.fromEntries((players || []).map((p) => [p.id, p])),
    [players],
  );

  if (result.valid) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          className="shrink-0 text-green-400"
        >
          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5.5 9.5l2 2 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm text-green-300 font-medium">
          Fairness check passed
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
      <div className="flex items-center gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          className="shrink-0 text-red-400"
        >
          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M9 5v4M9 12v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm text-red-300 font-medium">
          Fairness violation{result.violations.length > 1 ? 's' : ''}
        </span>
      </div>
      <ul className="space-y-1 pl-6">
        {result.violations.map((v, i) => {
          const p = playerMap[v.playerId];
          const name = p?.name || v.playerId;
          return (
            <li key={i} className="text-xs text-red-300/80 list-disc">
              <span className="font-medium text-red-200">{name}</span> sits
              consecutively in sets {v.sets[0] + 1} and {v.sets[1] + 1}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
