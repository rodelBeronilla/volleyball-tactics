/**
 * Rally ball with natural flight paths matching player positions per phase.
 * Ball position connects to where the setter and hitters actually are.
 */

// Ball positions and flight arcs per phase
// These match the formation positions:
// - Setter target: x:68, y:8 (from formations.js SETTER_TARGET)
// - Left pin attack: x:8, y:4
// - Quick attack: x:38, y:4
// - Right pin attack: x:78, y:4
const BALL_DATA = {
  serve: {
    pos: { x: 75, y: 86 },
    path: null,
    label: 'Server',
    sub: 'Pos 1 behind endline',
  },
  receive: {
    pos: { x: 48, y: 52 },
    path: 'M 48,-10 Q 46,20 48,52', // serve comes over net, lands in court
    label: 'Serve incoming',
    sub: 'Passers read and move',
  },
  pass: {
    pos: { x: 68, y: 8 }, // AT the setter target — exactly where setter is
    path: 'M 48,52 Q 58,28 68,8', // pass arcs up to setter
    label: 'Pass → Setter',
    sub: 'Setter at target, hitters load',
  },
  offense: {
    pos: { x: 8, y: 4 }, // Set to left pin (OH attack zone)
    path: 'M 68,8 Q 38,2 8,4', // set travels across to left hitter
    label: 'Set → Hitter',
    sub: '4-ball, quick, slide, 2-ball, pipe, D',
  },
  coverage: {
    pos: { x: 30, y: -6 }, // ball crosses net
    path: 'M 8,4 Q 20,-3 30,-6', // attack crosses net
    label: 'Attack over net',
    sub: 'Coverage cup holds position',
  },
  defense: {
    pos: { x: 55, y: 35 }, // opponent attack lands in our court
    path: 'M 40,-8 Q 48,12 55,35', // opponent attack arc
    label: 'Opponent attacks',
    sub: 'Blockers + diggers read',
  },
  transition: {
    pos: { x: 68, y: 8 }, // dig goes up to setter (at target again)
    path: 'M 55,35 Q 62,20 68,8', // dig arc to setter
    label: 'Dig → Setter',
    sub: 'Setter releases, hitters approach',
  },
};

export default function RallyBall({ phase }) {
  const data = BALL_DATA[phase];
  if (!data) return null;

  return (
    <g key={`ball-${phase}`} style={{ pointerEvents: 'none' }}>
      {/* Flight path arc */}
      {data.path && (
        <path d={data.path} fill="none" stroke="#fff" strokeWidth="0.5"
          strokeDasharray="1.5 1" opacity="0.3" />
      )}

      {/* Ball at current position */}
      <g transform={`translate(${data.pos.x}, ${data.pos.y})`}>
        {/* Shadow */}
        <ellipse cx="0.3" cy="0.4" rx="2.2" ry="1.6" fill="#000" opacity="0.1" />

        {/* Ball */}
        <circle r="2.3" fill="#f5f5ef" stroke="#ddd" strokeWidth="0.25" />

        {/* Volleyball seams */}
        <path d="M -1.5,0 Q 0,-2 1.5,0" fill="none" stroke="#ccc" strokeWidth="0.2" />
        <path d="M -1.5,0 Q 0,2 1.5,0" fill="none" stroke="#ccc" strokeWidth="0.2" />

        {/* Highlight */}
        <circle cx="-0.5" cy="-0.6" r="0.5" fill="#fff" opacity="0.4" />

        {/* Pulse */}
        <circle r="2.3" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.3">
          <animate attributeName="r" values="2.3;3.5;2.3" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* Label */}
        <text y="6" textAnchor="middle" fill="#fff" fontSize="2.8" fontWeight="700" opacity="0.65">
          {data.label}
        </text>
        <text y="8.5" textAnchor="middle" fill="#fff" fontSize="2" opacity="0.35">
          {data.sub}
        </text>
      </g>
    </g>
  );
}
