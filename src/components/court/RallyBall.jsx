/**
 * Rally ball — renders at the position specified by the current rally step.
 * Each step provides ballPos, ballPath, and ballLabel directly.
 */

export default function RallyBall({ step }) {
  if (!step?.ballPos) return null;

  const { ballPos, ballPath, ballLabel } = step;

  return (
    <g key={`ball-${step.id}`} style={{ pointerEvents: 'none' }}>
      {ballPath && (
        <path d={ballPath} fill="none" stroke="#fff" strokeWidth="0.5"
          strokeDasharray="1.5 1" opacity="0.3" />
      )}

      <g transform={`translate(${ballPos.x}, ${ballPos.y})`}>
        <ellipse cx="0.3" cy="0.4" rx="2" ry="1.4" fill="#000" opacity="0.1" />
        <circle r="2.2" fill="#f5f5ef" stroke="#ddd" strokeWidth="0.25" />
        <path d="M -1.3,0 Q 0,-1.8 1.3,0" fill="none" stroke="#ccc" strokeWidth="0.2" />
        <path d="M -1.3,0 Q 0,1.8 1.3,0" fill="none" stroke="#ccc" strokeWidth="0.2" />
        <circle cx="-0.4" cy="-0.5" r="0.5" fill="#fff" opacity="0.35" />

        <circle r="2.2" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.25">
          <animate attributeName="r" values="2.2;3.2;2.2" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0;0.25" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {ballLabel && (
          <text y="5.5" textAnchor="middle" fill="#fff" fontSize="2.5" fontWeight="700" opacity="0.6">
            {ballLabel}
          </text>
        )}
      </g>
    </g>
  );
}
