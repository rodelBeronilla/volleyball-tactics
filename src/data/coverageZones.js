/**
 * Coverage zone data — realistic volleyball shapes.
 * Court: net y=0, endline y=90, left x=0, right x=90, attack line y=30.
 * Zones use angled polygons that reflect actual ball trajectory angles.
 */

// ── SERVE RECEIVE — W-formation with angled seams ──
// 3 deep passers in a W, 2 short-seam passers fill the gaps
export const SERVE_RECEIVE_ZONES = {
  leftDeep: {
    points: [{ x: 0, y: 38 }, { x: 28, y: 48 }, { x: 20, y: 90 }, { x: 0, y: 90 }],
    color: '#3b82f6', label: 'Left Deep',
  },
  centerDeep: {
    points: [{ x: 28, y: 48 }, { x: 62, y: 48 }, { x: 70, y: 90 }, { x: 20, y: 90 }],
    color: '#f59e0b', label: 'Center Deep',
  },
  rightDeep: {
    points: [{ x: 62, y: 48 }, { x: 90, y: 38 }, { x: 90, y: 90 }, { x: 70, y: 90 }],
    color: '#22c55e', label: 'Right Deep',
  },
  leftShort: {
    points: [{ x: 0, y: 30 }, { x: 35, y: 30 }, { x: 28, y: 48 }, { x: 0, y: 38 }],
    color: '#8b5cf6', label: 'Short Left',
  },
  rightShort: {
    points: [{ x: 55, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 38 }, { x: 62, y: 48 }],
    color: '#ec4899', label: 'Short Right',
  },
};

// ── DEFENSE vs LEFT SIDE (opponent hits from zone 4 → ball comes from our right) ──
// Attack origin: ~x:80, y:-3 (above net, right side). Trajectories fan out from there.
export const DEFENSE_VS_LEFT = {
  block: {
    points: [{ x: 52, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 12 }, { x: 60, y: 12 }],
    color: '#ef4444', label: 'Block', desc: 'Double block seals pin',
  },
  tipCover: {
    points: [{ x: 38, y: 10 }, { x: 60, y: 10 }, { x: 52, y: 30 }, { x: 30, y: 30 }],
    color: '#f97316', label: 'Tips', desc: 'Off-blocker reads tip/roll',
  },
  lineDig: {
    points: [{ x: 72, y: 12 }, { x: 90, y: 12 }, { x: 90, y: 78 }, { x: 78, y: 65 }],
    color: '#22c55e', label: 'Line', desc: 'RB holds sideline',
  },
  crossDig: {
    points: [{ x: 0, y: 30 }, { x: 30, y: 30 }, { x: 42, y: 65 }, { x: 0, y: 78 }],
    color: '#3b82f6', label: 'Cross', desc: 'LB digs cross angle',
  },
  deep: {
    points: [{ x: 20, y: 58 }, { x: 78, y: 58 }, { x: 90, y: 78 }, { x: 0, y: 78 }, { x: 0, y: 90 }, { x: 90, y: 90 }],
    color: '#a855f7', label: 'Deep', desc: 'CB covers endline power',
  },
};

// ── DEFENSE vs RIGHT SIDE (opponent hits from zone 2 → ball comes from our left) ──
export const DEFENSE_VS_RIGHT = {
  block: {
    points: [{ x: 0, y: 0 }, { x: 38, y: 0 }, { x: 30, y: 12 }, { x: 0, y: 12 }],
    color: '#ef4444', label: 'Block', desc: 'Double block seals pin',
  },
  tipCover: {
    points: [{ x: 30, y: 10 }, { x: 52, y: 10 }, { x: 60, y: 30 }, { x: 38, y: 30 }],
    color: '#f97316', label: 'Tips', desc: 'Off-blocker reads tip/roll',
  },
  lineDig: {
    points: [{ x: 0, y: 12 }, { x: 18, y: 12 }, { x: 12, y: 65 }, { x: 0, y: 78 }],
    color: '#3b82f6', label: 'Line', desc: 'LB holds sideline',
  },
  crossDig: {
    points: [{ x: 60, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 78 }, { x: 48, y: 65 }],
    color: '#22c55e', label: 'Cross', desc: 'RB digs cross angle',
  },
  deep: {
    points: [{ x: 12, y: 58 }, { x: 70, y: 58 }, { x: 90, y: 78 }, { x: 0, y: 78 }, { x: 0, y: 90 }, { x: 90, y: 90 }],
    color: '#a855f7', label: 'Deep', desc: 'CB covers endline power',
  },
};

// ── DEFENSE vs MIDDLE (opponent hits from zone 3 → ball comes from center) ──
export const DEFENSE_VS_MIDDLE = {
  block: {
    points: [{ x: 22, y: 0 }, { x: 68, y: 0 }, { x: 62, y: 12 }, { x: 28, y: 12 }],
    color: '#ef4444', label: 'Block', desc: 'MB + closer seal quick/slide',
  },
  leftWing: {
    points: [{ x: 0, y: 10 }, { x: 28, y: 10 }, { x: 18, y: 55 }, { x: 0, y: 62 }],
    color: '#3b82f6', label: 'Left', desc: 'Off-blocker + LB cover left',
  },
  rightWing: {
    points: [{ x: 62, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 62 }, { x: 72, y: 55 }],
    color: '#22c55e', label: 'Right', desc: 'Off-blocker + RB cover right',
  },
  deep: {
    points: [{ x: 0, y: 62 }, { x: 18, y: 55 }, { x: 45, y: 48 }, { x: 72, y: 55 }, { x: 90, y: 62 }, { x: 90, y: 90 }, { x: 0, y: 90 }],
    color: '#a855f7', label: 'Deep', desc: 'CB reads seam + endline',
  },
};

// Backward compat
export const DEFENSE_ZONES = {
  4: { points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 28 }, { x: 0, y: 28 }], color: '#3b82f6', label: 'Block L' },
  3: { points: [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 28 }, { x: 30, y: 28 }], color: '#ef4444', label: 'Block Mid' },
  2: { points: [{ x: 60, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 28 }, { x: 60, y: 28 }], color: '#22c55e', label: 'Block R' },
  5: { points: [{ x: 0, y: 28 }, { x: 30, y: 28 }, { x: 30, y: 90 }, { x: 0, y: 90 }], color: '#3b82f6', label: 'Dig L' },
  6: { points: [{ x: 30, y: 28 }, { x: 60, y: 28 }, { x: 60, y: 90 }, { x: 30, y: 90 }], color: '#f97316', label: 'Dig C' },
  1: { points: [{ x: 60, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 90 }, { x: 60, y: 90 }], color: '#22c55e', label: 'Dig R' },
};

export const DEFENSE_SCENARIOS = [
  { id: 'left', label: 'vs Left', zones: DEFENSE_VS_LEFT, icon: '←', desc: 'Opponent attacks from zone 4' },
  { id: 'right', label: 'vs Right', zones: DEFENSE_VS_RIGHT, icon: '→', desc: 'Opponent attacks from zone 2' },
  { id: 'middle', label: 'vs Middle', zones: DEFENSE_VS_MIDDLE, icon: '↓', desc: 'Opponent attacks from zone 3' },
];
