/**
 * Rally ball — shows ball position and flight path per phase.
 * PLAN steps show the ball at its current position (about to move).
 * MOVE steps show the ball at its new position with trail.
 */

const B = {
  'serve':           { pos: { x: 75, y: 86 }, path: null, label: 'Server', sub: 'Behind endline' },
  'receive-plan':    { pos: { x: 75, y: 80 }, path: null, label: 'Serve toss', sub: 'Ball about to cross net' },
  'receive':         { pos: { x: 48, y: 52 }, path: 'M 75,80 Q 55,-8 48,52', label: 'Serve', sub: 'Passer reads and moves' },
  'pass-plan':       { pos: { x: 48, y: 52 }, path: null, label: 'Contact', sub: 'Passer platforms to setter' },
  'pass':            { pos: { x: 68, y: 8 }, path: 'M 48,52 Q 58,25 68,8', label: 'Pass', sub: 'Setter at target' },
  'attack-plan':     { pos: { x: 68, y: 8 }, path: null, label: 'Setter reads', sub: 'Choosing set option' },
  'attack':          { pos: { x: 8, y: 4 }, path: 'M 68,8 Q 35,2 8,4', label: 'Set → OH', sub: '4-ball to left pin' },
  'defense-plan':    { pos: { x: 25, y: -6 }, path: 'M 8,4 Q 18,-4 25,-6', label: 'Attack!', sub: 'Ball crosses net' },
  'defense':         { pos: { x: 55, y: 38 }, path: 'M 35,-8 Q 46,12 55,38', label: 'Opponent', sub: 'Attacks into our court' },
  'transition-plan': { pos: { x: 55, y: 38 }, path: null, label: 'Dig!', sub: 'Ball popped up' },
  'transition':      { pos: { x: 68, y: 8 }, path: 'M 55,38 Q 62,20 68,8', label: 'Dig → Set', sub: 'Counter-attack' },
};

export default function RallyBall({ phase }) {
  const data = B[phase];
  if (!data) return null;

  return (
    <g key={`ball-${phase}`} style={{ pointerEvents: 'none' }}>
      {data.path && (
        <path d={data.path} fill="none" stroke="#fff" strokeWidth="0.5"
          strokeDasharray="1.5 1" opacity="0.3" />
      )}

      <g transform={`translate(${data.pos.x}, ${data.pos.y})`}>
        <ellipse cx="0.3" cy="0.4" rx="2" ry="1.4" fill="#000" opacity="0.1" />
        <circle r="2.2" fill="#f5f5ef" stroke="#ddd" strokeWidth="0.25" />
        <path d="M -1.3,0 Q 0,-1.8 1.3,0" fill="none" stroke="#ccc" strokeWidth="0.2" />
        <path d="M -1.3,0 Q 0,1.8 1.3,0" fill="none" stroke="#ccc" strokeWidth="0.2" />
        <circle cx="-0.4" cy="-0.5" r="0.5" fill="#fff" opacity="0.35" />

        <circle r="2.2" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.3">
          <animate attributeName="r" values="2.2;3.2;2.2" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <text y="5.5" textAnchor="middle" fill="#fff" fontSize="2.5" fontWeight="700" opacity="0.65">
          {data.label}
        </text>
        <text y="8" textAnchor="middle" fill="#fff" fontSize="1.8" opacity="0.35">
          {data.sub}
        </text>
      </g>
    </g>
  );
}
