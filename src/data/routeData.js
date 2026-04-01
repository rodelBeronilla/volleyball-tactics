/**
 * Movement route data for 5-1 system.
 * Defines transition arrows showing where players move after serve receive.
 *
 * ATTACK_ZONES — fixed target coordinates on court
 * Route templates per role (setter penetration, hitter approaches, etc.)
 * Builder produces ROUTES_5_1[rotation] → array of route objects
 *
 * Each route: { from: slot, to: {x,y}, style, color, label }
 * `from` coordinates are resolved at render time from formation placements.
 */

// Attack/target zone coordinates (viewBox 0-90, net at y=0)
export const ATTACK_ZONES = {
  outside_left:  { x: 10, y: 5 },   // Zone 4 attack point
  quick_center:  { x: 40, y: 5 },   // Zone 3 quick
  slide_right:   { x: 60, y: 5 },   // Zone 3 slide
  outside_right: { x: 80, y: 5 },   // Zone 2 attack point
  pipe:          { x: 45, y: 32 },   // Back-row pipe (behind 3m line)
  d_ball:        { x: 75, y: 32 },   // Back-row D (right side behind 3m)
  set_target:    { x: 65, y: 8 },    // Setter target position (Zone 2.5)
};

// Style types for arrow rendering
export const ROUTE_STYLES = {
  penetration: { dash: '2 1.5', width: 0.8, opacity: 0.8 },
  approach:    { dash: null,    width: 0.7, opacity: 0.7 },
  backrow:     { dash: '1 1',   width: 0.6, opacity: 0.6 },
};

// Colors per role
const ROLE_COLORS = {
  S:   '#fbbf24',  // gold
  OH1: '#3b82f6',  // blue
  OH2: '#60a5fa',  // lighter blue
  MB1: '#ef4444',  // red
  MB2: '#f87171',  // lighter red
  OPP: '#22c55e',  // green
};

import { SLOT_ROLE_MAP } from './strategyData';

/**
 * Build routes for all rotations.
 * Returns ROUTES_5_1[rotation] → [{ slot, to, style, color, label }]
 */
function buildRoutes() {
  const result = {};

  for (let rot = 1; rot <= 6; rot++) {
    const routes = [];

    for (let slot = 1; slot <= 6; slot++) {
      const role = SLOT_ROLE_MAP[rot][slot];
      const isFront = slot === 2 || slot === 3 || slot === 4;
      const color = ROLE_COLORS[role];

      switch (role) {
        case 'S':
          if (!isFront) {
            // Setter penetration from back row to net
            routes.push({
              slot,
              to: ATTACK_ZONES.set_target,
              style: 'penetration',
              color,
              label: 'Set',
            });
          }
          break;

        case 'OH1':
          if (isFront) {
            routes.push({
              slot,
              to: ATTACK_ZONES.outside_left,
              style: 'approach',
              color,
              label: '4-ball',
            });
          } else {
            routes.push({
              slot,
              to: ATTACK_ZONES.pipe,
              style: 'backrow',
              color,
              label: 'Pipe',
            });
          }
          break;

        case 'OH2':
          if (isFront) {
            routes.push({
              slot,
              to: ATTACK_ZONES.outside_left,
              style: 'approach',
              color,
              label: '4-ball',
            });
          } else {
            routes.push({
              slot,
              to: ATTACK_ZONES.pipe,
              style: 'backrow',
              color,
              label: 'Pipe',
            });
          }
          break;

        case 'MB1':
        case 'MB2':
          if (isFront) {
            // Quick and slide options
            routes.push({
              slot,
              to: ATTACK_ZONES.quick_center,
              style: 'approach',
              color,
              label: 'Quick',
            });
            routes.push({
              slot,
              to: ATTACK_ZONES.slide_right,
              style: 'approach',
              color,
              label: 'Slide',
            });
          }
          // Back row: MB is subbed out for libero, no routes
          break;

        case 'OPP':
          if (isFront) {
            routes.push({
              slot,
              to: ATTACK_ZONES.outside_right,
              style: 'approach',
              color,
              label: '2-ball',
            });
          } else {
            routes.push({
              slot,
              to: ATTACK_ZONES.d_ball,
              style: 'backrow',
              color,
              label: 'D-ball',
            });
          }
          break;
      }
    }

    result[rot] = routes;
  }

  return result;
}

export const ROUTES_5_1 = buildRoutes();

/**
 * Get routes for a specific rotation, optionally filtered to one slot.
 */
export function getRoutes(rotation, selectedSlot = null) {
  const routes = ROUTES_5_1[rotation] || [];
  if (selectedSlot != null) {
    return routes.filter(r => r.slot === selectedSlot);
  }
  return routes;
}

// Map hex color → SVG marker ID (matches ArrowDefs markers)
const COLOR_TO_MARKER = {
  '#fbbf24': 'arrow-gold',
  '#3b82f6': 'arrow-blue',
  '#60a5fa': 'arrow-lblue',
  '#ef4444': 'arrow-red',
  '#f87171': 'arrow-lred',
  '#22c55e': 'arrow-green',
};

export function getMarkerId(color) {
  return COLOR_TO_MARKER[color] || 'arrow-gold';
}
