import { checkOverlapLegality } from '../../utils/overlap';

export default function OverlapIndicator({ placements }) {
  const violations = checkOverlapLegality(placements);
  if (violations.length === 0) return null;

  const byPos = {};
  placements.forEach(p => { byPos[p.rotationalPosition] = p; });

  return (
    <g>
      {violations.map((v, i) => {
        const p1 = byPos[v.pos1];
        const p2 = byPos[v.pos2];
        if (!p1 || !p2) return null;
        return (
          <g key={i}>
            <line
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke="#ff4444"
              strokeWidth="0.5"
              strokeDasharray="1.5 1"
              opacity="0.8"
            />
            <circle cx={(p1.x + p2.x) / 2} cy={(p1.y + p2.y) / 2} r="2" fill="#ff4444" opacity="0.6" />
            <text
              x={(p1.x + p2.x) / 2}
              y={(p1.y + p2.y) / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize="2"
              fontWeight="700"
              style={{ pointerEvents: 'none' }}
            >!</text>
          </g>
        );
      })}
    </g>
  );
}
