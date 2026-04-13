/**
 * SVG overlay showing coverage zones for any scenario.
 * Accepts a `zones` object (keyed by zone name → { points, color, label, desc? }).
 */

export default function CoverageOverlay({ zones }) {
  if (!zones) return null;

  return (
    <g className="coverage-overlay">
      {Object.entries(zones).map(([key, zone]) => {
        const points = zone.points.map(p => `${p.x},${p.y}`).join(' ');
        const cx = zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length;
        const cy = zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length;

        return (
          <g key={key}>
            <polygon
              points={points}
              fill={zone.color}
              opacity={0.16}
              stroke={zone.color}
              strokeWidth={0.6}
              strokeOpacity={0.5}
              style={{ pointerEvents: 'none' }}
            />
            <text
              x={cx} y={cy - (zone.desc ? 1.5 : 0)}
              textAnchor="middle" dominantBaseline="central"
              fill={zone.color} fontSize="3.2" fontWeight="700" opacity="0.9"
              style={{ pointerEvents: 'none' }}
            >
              {zone.label}
            </text>
            {zone.desc && (
              <text
                x={cx} y={cy + 2.5}
                textAnchor="middle" dominantBaseline="central"
                fill={zone.color} fontSize="1.8" fontWeight="400" opacity="0.6"
                style={{ pointerEvents: 'none' }}
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
