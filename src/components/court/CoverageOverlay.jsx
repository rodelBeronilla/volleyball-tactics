/**
 * SVG overlay showing defensive coverage zones.
 * Each player's responsibility area is shown as a semi-transparent polygon.
 */

import { DEFENSE_ZONES } from '../../data/coverageZones';

export default function CoverageOverlay({ selectedSlot }) {
  return (
    <g className="coverage-overlay">
      {Object.entries(DEFENSE_ZONES).map(([pos, zone]) => {
        const posNum = parseInt(pos);
        const isSelected = selectedSlot === posNum;
        const opacity = selectedSlot != null
          ? (isSelected ? 0.25 : 0.05)
          : 0.12;

        const points = zone.points.map(p => `${p.x},${p.y}`).join(' ');

        return (
          <g key={pos}>
            <polygon
              points={points}
              fill={zone.color}
              opacity={opacity}
              stroke={zone.color}
              strokeWidth={isSelected ? 0.8 : 0.3}
              strokeOpacity={isSelected ? 0.6 : 0.15}
              style={{ pointerEvents: 'none', transition: 'opacity 0.3s' }}
            />
            {isSelected && (
              <text
                x={zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length}
                y={zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length}
                textAnchor="middle"
                dominantBaseline="central"
                fill={zone.color}
                fontSize="3"
                fontWeight="600"
                opacity="0.8"
                style={{ pointerEvents: 'none' }}
              >
                {zone.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
