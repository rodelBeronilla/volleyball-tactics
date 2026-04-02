import { getRoutes, ROUTE_STYLES, getMarkerId } from '../../data/routeData';

/**
 * Renders SVG arrow paths showing player transition routes.
 * @param {number} rotation - current rotation 1-6
 * @param {Array} placements - placement objects with x,y coordinates
 * @param {number|null} selectedSlot - highlight only this player's routes, null = show all
 */
export default function MovementArrows({ rotation, placements, selectedSlot }) {
  const routes = getRoutes(rotation, selectedSlot);

  if (!routes || routes.length === 0) return null;

  const placementMap = {};
  placements.forEach(p => { placementMap[p.rotationalPosition] = p; });

  return (
    <g className="movement-arrows">
      {routes.map((route, i) => {
        const from = placementMap[route.slot];
        if (!from) return null;

        const style = ROUTE_STYLES[route.style] || ROUTE_STYLES.approach;
        const markerId = getMarkerId(route.color);
        // When a slot is selected, show only that player's routes at full opacity
        // When no slot selected, show all routes at default opacity
        const opacity = selectedSlot != null
          ? (route.slot === selectedSlot ? Math.min(1, style.opacity + 0.3) : style.opacity * 0.3)
          : style.opacity;

        // Shorten the line slightly so arrow doesn't overlap with target
        const dx = route.to.x - from.x;
        const dy = route.to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const shortenFrom = 6; // clear of player token radius
        const shortenTo = 2;   // clear of arrowhead

        if (len < shortenFrom + shortenTo + 2) return null;

        const startX = from.x + (dx / len) * shortenFrom;
        const startY = from.y + (dy / len) * shortenFrom;
        const endX = route.to.x - (dx / len) * shortenTo;
        const endY = route.to.y - (dy / len) * shortenTo;

        return (
          <g key={`${route.slot}-${route.label}-${i}`}>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={route.color}
              strokeWidth={style.width}
              strokeDasharray={style.dash || 'none'}
              opacity={opacity}
              markerEnd={`url(#${markerId})`}
              style={{ pointerEvents: 'none' }}
            />
            {/* Route label at midpoint */}
            <text
              x={(startX + endX) / 2}
              y={(startY + endY) / 2 - 1.5}
              textAnchor="middle"
              fill={route.color}
              fontSize="1.8"
              fontWeight="600"
              opacity={opacity}
              style={{ pointerEvents: 'none' }}
            >
              {route.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
