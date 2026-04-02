/**
 * SVG overlay showing stat density/quality per court zone.
 * Renders 6 semi-transparent rectangles over the court zones.
 */

import { ZONE_CENTERS } from '../../data/positions';

const ZONE_RECTS = {
  4: { x: 0, y: 0, w: 30, h: 30 },   // LF
  3: { x: 30, y: 0, w: 30, h: 30 },   // CF
  2: { x: 60, y: 0, w: 30, h: 30 },   // RF
  5: { x: 0, y: 30, w: 30, h: 60 },   // LB
  6: { x: 30, y: 30, w: 30, h: 60 },  // CB
  1: { x: 60, y: 30, w: 30, h: 60 },  // RB
};

export default function ZoneHeatmap({ data, mode = 'activity' }) {
  if (!data) return null;

  return (
    <g className="zone-heatmap">
      {Object.entries(ZONE_RECTS).map(([zone, rect]) => {
        const zoneData = data[zone];
        if (!zoneData) return null;

        let opacity, color;
        if (mode === 'quality') {
          // Color by positive rate: green = good, red = bad
          const rate = zoneData.positiveRate || 0;
          color = rate >= 0.6 ? '#22c55e' : rate >= 0.4 ? '#eab308' : '#ef4444';
          opacity = Math.min(0.25, (zoneData.total || 0) / 50 * 0.25);
        } else {
          // Activity: opacity by volume
          color = '#3b82f6';
          opacity = Math.min(0.3, (zoneData.total || 0) / 30 * 0.3);
        }

        if (opacity < 0.02) return null;

        return (
          <rect
            key={zone}
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            fill={color}
            opacity={opacity}
            style={{ pointerEvents: 'none' }}
          />
        );
      })}
    </g>
  );
}
