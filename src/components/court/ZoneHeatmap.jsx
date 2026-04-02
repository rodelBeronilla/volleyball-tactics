/**
 * SVG overlay showing stat density/quality per court zone.
 * Aligned to the court rect (0,0 to 90,90) within the SVG viewBox.
 */

// Zone rects matching CourtMarkings: court is 90x90, attack line at y=30
const ZONE_RECTS = {
  4: { x: 0,  y: 0,  w: 30, h: 30 },  // LF (zone 4)
  3: { x: 30, y: 0,  w: 30, h: 30 },  // CF (zone 3)
  2: { x: 60, y: 0,  w: 30, h: 30 },  // RF (zone 2)
  5: { x: 0,  y: 30, w: 30, h: 60 },  // LB (zone 5)
  6: { x: 30, y: 30, w: 30, h: 60 },  // CB (zone 6)
  1: { x: 60, y: 30, w: 30, h: 60 },  // RB (zone 1)
};

export default function ZoneHeatmap({ data, mode = 'quality' }) {
  if (!data) return null;

  return (
    <g className="zone-heatmap">
      {Object.entries(ZONE_RECTS).map(([zone, rect]) => {
        const zoneData = data[zone];
        if (!zoneData || zoneData.total === 0) return null;

        let opacity, color;
        if (mode === 'quality') {
          const rate = zoneData.positiveRate || 0;
          color = rate >= 0.6 ? '#22c55e' : rate >= 0.4 ? '#eab308' : '#ef4444';
          opacity = Math.min(0.45, 0.1 + (zoneData.total / 20) * 0.35);
        } else {
          color = '#3b82f6';
          opacity = Math.min(0.45, 0.05 + (zoneData.total / 15) * 0.4);
        }

        if (opacity < 0.05) return null;

        return (
          <g key={zone}>
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              fill={color}
              opacity={opacity}
              rx="1"
              style={{ pointerEvents: 'none' }}
            />
            {/* Zone stat count label */}
            <text
              x={rect.x + rect.w / 2}
              y={rect.y + rect.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize="3"
              fontWeight="600"
              opacity="0.6"
              style={{ pointerEvents: 'none' }}
            >
              {zoneData.total}
            </text>
          </g>
        );
      })}
    </g>
  );
}
