/**
 * SVG overlay — renders coverage zones with gradient fills, clear labels,
 * and dashed boundary lines for a clean coaching diagram look.
 */

let _defId = 0;

export default function CoverageOverlay({ zones }) {
  if (!zones) return null;

  const entries = Object.entries(zones);
  const prefix = `cz-${++_defId}`;

  return (
    <g className="coverage-overlay">
      <defs>
        {entries.map(([key, zone]) => (
          <radialGradient key={`${prefix}-${key}`} id={`${prefix}-${key}`}
            cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor={zone.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={zone.color} stopOpacity="0.08" />
          </radialGradient>
        ))}
      </defs>

      {entries.map(([key, zone]) => {
        const pts = zone.points;
        const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

        return (
          <g key={key} style={{ pointerEvents: 'none' }}>
            {/* Filled zone */}
            <polygon
              points={pointsStr}
              fill={`url(#${prefix}-${key})`}
              stroke={zone.color}
              strokeWidth={0.7}
              strokeOpacity={0.55}
              strokeDasharray="2 1"
            />

            {/* Label background pill */}
            <rect
              x={cx - 10} y={cy - (zone.desc ? 4.5 : 2.8)}
              width={20} height={zone.desc ? 9 : 5.6}
              rx={2}
              fill="#000" opacity={0.5}
            />

            {/* Label */}
            <text
              x={cx} y={cy - (zone.desc ? 1 : 0)}
              textAnchor="middle" dominantBaseline="central"
              fill={zone.color} fontSize="3.5" fontWeight="800"
              opacity="1"
            >
              {zone.label}
            </text>

            {/* Description */}
            {zone.desc && (
              <text
                x={cx} y={cy + 3}
                textAnchor="middle" dominantBaseline="central"
                fill="#e5e7eb" fontSize="2" fontWeight="400"
                opacity="0.8"
              >
                {zone.desc}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
