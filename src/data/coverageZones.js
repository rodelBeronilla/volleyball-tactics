/**
 * Defensive coverage zones — volleyball theory correct.
 *
 * Perimeter Defense (2-0-4):
 * - 2 blockers at net (front-row players)
 * - 0 players behind block (no "middle up" defender)
 * - 4 diggers on perimeter (3 back-row + 1 off-blocker on 3m line)
 *
 * Zone responsibility:
 * - LF (pos 4): Block left side OR pull to 3m line for tips if not blocking
 * - CF (pos 3): Block middle, read and close
 * - RF (pos 2): Block right side OR pull to 3m line for tips if not blocking
 * - LB (pos 5): Deep left sideline — digs line shots and cross-court
 * - CB (pos 6): Deep center/endline — covers power angles through/over block
 * - RB (pos 1): Deep right sideline — digs line shots and sharp cross
 */

// Front-row zones (blocking + tip responsibility)
// Back-row zones (perimeter dig responsibility)
export const DEFENSE_ZONES = {
  4: { // LF — block + left tip coverage
    points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 28 }, { x: 0, y: 28 }],
    color: '#3b82f6',
    label: 'Block L / Tips',
  },
  3: { // CF — middle block
    points: [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 28 }, { x: 30, y: 28 }],
    color: '#ef4444',
    label: 'Block Mid',
  },
  2: { // RF — block + right tip coverage
    points: [{ x: 60, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 28 }, { x: 60, y: 28 }],
    color: '#22c55e',
    label: 'Block R / Tips',
  },
  5: { // LB — deep left perimeter
    points: [{ x: 0, y: 28 }, { x: 30, y: 28 }, { x: 30, y: 90 }, { x: 0, y: 90 }],
    color: '#3b82f6',
    label: 'Dig Left',
  },
  6: { // CB — deep center, endline
    points: [{ x: 30, y: 28 }, { x: 60, y: 28 }, { x: 60, y: 90 }, { x: 30, y: 90 }],
    color: '#f97316',
    label: 'Dig Center',
  },
  1: { // RB — deep right perimeter
    points: [{ x: 60, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 90 }, { x: 60, y: 90 }],
    color: '#22c55e',
    label: 'Dig Right',
  },
};
