/**
 * Defensive coverage zones per rotational position.
 * Each zone is defined as an SVG polygon (array of {x,y} points)
 * relative to the court viewBox (0-90).
 *
 * Zones represent the area each player is responsible for in perimeter defense.
 * The zones are position-based (1-6), not role-based.
 */

// Front-row defensive zones (positions 2, 3, 4) — block and tip coverage
// Back-row defensive zones (positions 1, 5, 6) — deep court coverage
export const DEFENSE_ZONES = {
  4: { // LF — left-side block + tip coverage
    points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 30 }, { x: 0, y: 30 }],
    color: '#3b82f6',
    label: 'Block/Tip L',
  },
  3: { // CF — middle block + short coverage
    points: [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 30 }, { x: 30, y: 30 }],
    color: '#ef4444',
    label: 'Block/Short',
  },
  2: { // RF — right-side block + tip coverage
    points: [{ x: 60, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 30 }, { x: 60, y: 30 }],
    color: '#22c55e',
    label: 'Block/Tip R',
  },
  5: { // LB — deep left defense
    points: [{ x: 0, y: 30 }, { x: 30, y: 30 }, { x: 45, y: 60 }, { x: 0, y: 60 }, { x: 0, y: 90 }],
    color: '#3b82f6',
    label: 'Deep Left',
  },
  6: { // CB — deep center / power alley
    points: [{ x: 30, y: 30 }, { x: 60, y: 30 }, { x: 90, y: 90 }, { x: 0, y: 90 }, { x: 0, y: 60 }, { x: 45, y: 60 }],
    color: '#f97316',
    label: 'Deep Center',
  },
  1: { // RB — deep right defense / line
    points: [{ x: 60, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 90 }, { x: 60, y: 60 }],
    color: '#22c55e',
    label: 'Deep Right',
  },
};

// Serve receive zones (who covers which area)
export const SERVE_RECEIVE_ZONES = {
  // Back-row passers cover these areas (varies by rotation, simplified)
  left: { points: [{ x: 0, y: 35 }, { x: 30, y: 35 }, { x: 30, y: 90 }, { x: 0, y: 90 }], color: '#3b82f6' },
  center: { points: [{ x: 30, y: 35 }, { x: 60, y: 35 }, { x: 60, y: 90 }, { x: 30, y: 90 }], color: '#f97316' },
  right: { points: [{ x: 60, y: 35 }, { x: 90, y: 35 }, { x: 90, y: 90 }, { x: 60, y: 90 }], color: '#22c55e' },
};
