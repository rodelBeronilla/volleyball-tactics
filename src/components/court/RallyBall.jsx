/**
 * Ball showing game action per rally phase.
 * Moves through the court telling the story of each phase.
 */

const PHASE_BALL = {
  serve: {
    ball: { x: 75, y: 88 },
    trail: null,
    label: 'Server tosses',
  },
  receive: {
    ball: { x: 45, y: 50 },
    trail: [{ x: 45, y: -8 }, { x: 42, y: 25 }, { x: 45, y: 50 }],
    label: 'Serve incoming',
  },
  pass: {
    ball: { x: 58, y: 25 },
    trail: [{ x: 45, y: 50 }, { x: 50, y: 35 }, { x: 58, y: 25 }],
    label: 'Pass to setter',
  },
  offense: {
    ball: { x: 65, y: 8 },
    trail: [{ x: 58, y: 25 }, { x: 62, y: 15 }, { x: 65, y: 8 }],
    label: 'Set → Attack options',
  },
  coverage: {
    ball: { x: 30, y: -3 },
    trail: [{ x: 65, y: 8 }, { x: 50, y: -2 }, { x: 30, y: -3 }],
    label: 'Ball crosses net',
  },
  defense: {
    ball: { x: 35, y: -5 },
    trail: null,
    label: 'Opponent attacks',
  },
  transition: {
    ball: { x: 55, y: 30 },
    trail: [{ x: 30, y: 70 }, { x: 40, y: 48 }, { x: 55, y: 30 }],
    label: 'Dig → Setter',
  },
};

export default function RallyBall({ phase }) {
  const data = PHASE_BALL[phase];
  if (!data) return null;

  const { ball, trail, label } = data;

  return (
    <g className="rally-ball" style={{ pointerEvents: 'none' }}>
      {trail && trail.length >= 2 && (
        <polyline
          points={trail.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#fff"
          strokeWidth="0.5"
          strokeDasharray="1.5 1"
          opacity="0.35"
        />
      )}

      <circle cx={ball.x + 0.3} cy={ball.y + 0.3} r="2.2" fill="#000" opacity="0.15" />

      <circle cx={ball.x} cy={ball.y} r="2" fill="#fff" stroke="#ddd" strokeWidth="0.3">
        <animate attributeName="r" values="2;2.3;2" dur="1s" repeatCount="indefinite" />
      </circle>

      {/* Volleyball seams */}
      <path d={`M ${ball.x - 1.3} ${ball.y} Q ${ball.x} ${ball.y - 1.8} ${ball.x + 1.3} ${ball.y}`}
        fill="none" stroke="#bbb" strokeWidth="0.2" />
      <path d={`M ${ball.x - 1.3} ${ball.y} Q ${ball.x} ${ball.y + 1.8} ${ball.x + 1.3} ${ball.y}`}
        fill="none" stroke="#bbb" strokeWidth="0.2" />

      <text x={ball.x} y={ball.y + 5.5} textAnchor="middle" fill="#fff"
        fontSize="2.5" fontWeight="600" opacity="0.5">
        {label}
      </text>
    </g>
  );
}
