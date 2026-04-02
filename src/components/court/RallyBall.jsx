/**
 * Rally ball with smooth animated movement between phases.
 * Uses SVG animateMotion to show natural ball flight paths.
 *
 * The ball tells the story: serve → pass → set → attack → dig → set...
 * Each phase transition shows the ball traveling along a realistic arc.
 */

// No React hooks needed — phase prop change triggers re-render with new key

// Ball flight paths per phase transition (from previous phase position to current)
// Each path is an array of {x, y} waypoints. The ball animates along them.
// Court: net y=0, endline y=90. Opponent side: y < 0.
const BALL_PATHS = {
  serve: {
    // Ball starts with server behind endline
    position: { x: 75, y: 86 },
    label: 'Server',
    sublabel: 'Pos 1 serves',
  },
  receive: {
    // Serve crosses net → lands in our court (arc over net)
    position: { x: 48, y: 52 },
    from: { x: 75, y: 86 },
    path: 'M 75,86 Q 60,-15 48,52', // serve arc over net into court
    label: 'Serve',
    sublabel: 'Ball in play',
    duration: '1.2s',
  },
  pass: {
    // Pass from passer → setter target area (upward arc)
    position: { x: 62, y: 12 },
    from: { x: 48, y: 52 },
    path: 'M 48,52 Q 55,25 62,12', // pass arc to setter
    label: 'Pass',
    sublabel: 'To setter',
    duration: '0.8s',
  },
  offense: {
    // Set from setter → hitter (quick set to attack zone)
    position: { x: 15, y: 5 },
    from: { x: 62, y: 12 },
    path: 'M 62,12 Q 38,2 15,5', // set across to left pin
    label: 'Set',
    sublabel: 'Attack options',
    duration: '0.6s',
  },
  coverage: {
    // Attack crosses net (downward arc)
    position: { x: 40, y: -8 },
    from: { x: 15, y: 5 },
    path: 'M 15,5 Q 28,-5 40,-8', // attack over net
    label: 'Attack',
    sublabel: 'Ball crosses net',
    duration: '0.5s',
  },
  defense: {
    // Opponent attacks — ball comes from their side (arc from above net into our court)
    position: { x: 55, y: 40 },
    from: { x: 40, y: -8 },
    path: 'M 40,-8 Q 48,15 55,40', // opponent attack into our court
    label: 'Opponent',
    sublabel: 'Attacks us',
    duration: '0.6s',
  },
  transition: {
    // Dig pops ball up toward setter
    position: { x: 58, y: 18 },
    from: { x: 55, y: 40 },
    path: 'M 55,40 Q 56,28 58,18', // dig arc upward to setter
    label: 'Dig',
    sublabel: 'Counter-attack',
    duration: '0.7s',
  },
};

export default function RallyBall({ phase }) {
  const data = BALL_PATHS[phase];
  if (!data) return null;

  const { position, path, label, sublabel, duration } = data;

  return (
    <g key={`ball-${phase}`} style={{ pointerEvents: 'none' }}>
      {/* Flight path trace (dotted line showing trajectory) */}
      {path && (
        <path
          d={path}
          fill="none"
          stroke="#fff"
          strokeWidth="0.5"
          strokeDasharray="1.5 1"
          opacity="0.25"
        />
      )}

      {/* Ball group — animates along path if available */}
      <g>
        {path && duration ? (
          // Animated ball following the path
          <animateMotion
            dur={duration}
            fill="freeze"
            path={path}
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.25 0.1 0.25 1"
          />
        ) : null}

        {/* If no animation path, position statically */}
        {!path && (
          <g transform={`translate(${position.x}, ${position.y})`}>
            <BallGraphic />
          </g>
        )}
      </g>

      {/* Static ball at final position (always visible so ball doesn't disappear) */}
      <g transform={`translate(${position.x}, ${position.y})`}>
        <BallGraphic />

        {/* Labels */}
        <text y={5.5} textAnchor="middle" fill="#fff" fontSize="2.8" fontWeight="700" opacity="0.7">
          {label}
        </text>
        {sublabel && (
          <text y={8} textAnchor="middle" fill="#fff" fontSize="2" fontWeight="400" opacity="0.4">
            {sublabel}
          </text>
        )}
      </g>
    </g>
  );
}

function BallGraphic() {
  return (
    <g>
      {/* Shadow */}
      <ellipse cx="0.4" cy="0.4" rx="2.2" ry="1.8" fill="#000" opacity="0.12" />

      {/* Ball body */}
      <circle cx="0" cy="0" r="2.2" fill="#f5f5f0" stroke="#ddd" strokeWidth="0.25" />

      {/* Volleyball panel lines */}
      <path d="M -1.5,-0.5 Q 0,-2 1.5,-0.5" fill="none" stroke="#ccc" strokeWidth="0.2" />
      <path d="M -1.5,0.5 Q 0,2 1.5,0.5" fill="none" stroke="#ccc" strokeWidth="0.2" />
      <line x1="0" y1="-2.2" x2="0" y2="2.2" stroke="#ccc" strokeWidth="0.15" opacity="0.5" />

      {/* Highlight */}
      <circle cx="-0.5" cy="-0.6" r="0.6" fill="#fff" opacity="0.4" />
    </g>
  );
}
