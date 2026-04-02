/**
 * Animated ball showing the game action during each rally phase.
 * Position and trail change based on the current phase to tell the story
 * of what's happening and what players are responding to.
 */

// Ball positions and trails for each phase
// Court: net at y=0, endline at y=90, left=0, right=90
const PHASE_BALL = {
  serve: {
    // Ball is with the server (position 1, behind endline)
    ball: { x: 75, y: 88 },
    trail: null,
    label: 'Server tosses',
  },
  receive: {
    // Ball is incoming from opponent's side, crossing the net into our court
    ball: { x: 45, y: 55 },
    trail: [{ x: 45, y: -8 }, { x: 45, y: 20 }, { x: 45, y: 55 }],
    label: 'Serve incoming',
  },
  offense: {
    // Ball has been passed to setter target area (right-front)
    ball: { x: 65, y: 10 },
    trail: [{ x: 45, y: 55 }, { x: 55, y: 30 }, { x: 65, y: 10 }],
    label: 'Set to hitter',
  },
  defense: {
    // Ball is on opponent's side — they're attacking, ball coming at us
    ball: { x: 35, y: -5 },
    trail: null,
    label: 'Opponent attacks',
  },
  transition: {
    // Ball has been dug — going up to setter for counter-attack
    ball: { x: 55, y: 35 },
    trail: [{ x: 30, y: 70 }, { x: 40, y: 50 }, { x: 55, y: 35 }],
    label: 'Dig → Set',
  },
};

export default function RallyBall({ phase }) {
  const data = PHASE_BALL[phase];
  if (!data) return null;

  const { ball, trail, label } = data;

  return (
    <g className="rally-ball" style={{ pointerEvents: 'none' }}>
      {/* Trail (dotted path showing ball trajectory) */}
      {trail && trail.length >= 2 && (
        <polyline
          points={trail.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#fff"
          strokeWidth="0.4"
          strokeDasharray="1.5 1"
          opacity="0.3"
        />
      )}

      {/* Ball shadow */}
      <circle cx={ball.x + 0.3} cy={ball.y + 0.3} r="2.2" fill="#000" opacity="0.2" />

      {/* Ball */}
      <circle cx={ball.x} cy={ball.y} r="2" fill="#fff" stroke="#ccc" strokeWidth="0.3">
        <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Ball seam lines (volleyball look) */}
      <path
        d={`M ${ball.x - 1.2} ${ball.y - 0.8} Q ${ball.x} ${ball.y - 1.5} ${ball.x + 1.2} ${ball.y - 0.8}`}
        fill="none" stroke="#bbb" strokeWidth="0.2" opacity="0.6"
      />
      <path
        d={`M ${ball.x - 1.2} ${ball.y + 0.8} Q ${ball.x} ${ball.y + 1.5} ${ball.x + 1.2} ${ball.y + 0.8}`}
        fill="none" stroke="#bbb" strokeWidth="0.2" opacity="0.6"
      />

      {/* Action label */}
      <text
        x={ball.x}
        y={ball.y + 5}
        textAnchor="middle"
        fill="#fff"
        fontSize="2.5"
        fontWeight="600"
        opacity="0.6"
      >
        {label}
      </text>
    </g>
  );
}
