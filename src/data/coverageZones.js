/**
 * Coverage zone data for all defensive and serve-receive scenarios.
 * Court: net at y=0, endline at y=90. Left x=0, right x=90. Attack line at y=30.
 */

// ── SERVE RECEIVE zones (W-formation receive areas) ──
export const SERVE_RECEIVE_ZONES = {
  leftDeep: {
    points: [{ x: 0, y: 42 }, { x: 32, y: 42 }, { x: 32, y: 90 }, { x: 0, y: 90 }],
    color: '#3b82f6',
    label: 'Left Deep',
  },
  centerDeep: {
    points: [{ x: 32, y: 52 }, { x: 58, y: 52 }, { x: 58, y: 90 }, { x: 32, y: 90 }],
    color: '#f59e0b',
    label: 'Center Deep',
  },
  rightDeep: {
    points: [{ x: 58, y: 42 }, { x: 90, y: 42 }, { x: 90, y: 90 }, { x: 58, y: 90 }],
    color: '#22c55e',
    label: 'Right Deep',
  },
  leftShort: {
    points: [{ x: 0, y: 30 }, { x: 32, y: 30 }, { x: 32, y: 52 }, { x: 0, y: 52 }],
    color: '#8b5cf6',
    label: 'Left Short',
  },
  rightShort: {
    points: [{ x: 58, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 52 }, { x: 58, y: 52 }],
    color: '#ec4899',
    label: 'Right Short',
  },
};

// ── DEFENSE vs LEFT SIDE ATTACK (opponent zone 4 → our right side) ──
export const DEFENSE_VS_LEFT = {
  block: {
    points: [{ x: 55, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 10 }, { x: 55, y: 10 }],
    color: '#ef4444',
    label: 'Block',
    desc: 'Double block at right pin',
  },
  tipCover: {
    points: [{ x: 35, y: 8 }, { x: 55, y: 8 }, { x: 55, y: 30 }, { x: 35, y: 30 }],
    color: '#f97316',
    label: 'Tips',
    desc: 'Off-blocker pulls to 3m for tips',
  },
  lineDig: {
    points: [{ x: 68, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 72 }, { x: 68, y: 72 }],
    color: '#22c55e',
    label: 'Line',
    desc: 'Dig line shot down sideline',
  },
  crossDig: {
    points: [{ x: 0, y: 28 }, { x: 35, y: 28 }, { x: 35, y: 72 }, { x: 0, y: 72 }],
    color: '#3b82f6',
    label: 'Cross',
    desc: 'Dig sharp cross-court angle',
  },
  deep: {
    points: [{ x: 22, y: 60 }, { x: 68, y: 60 }, { x: 68, y: 90 }, { x: 22, y: 90 }],
    color: '#a855f7',
    label: 'Deep',
    desc: 'Read power angle through seam',
  },
};

// ── DEFENSE vs RIGHT SIDE ATTACK (opponent zone 2 → our left side) ──
export const DEFENSE_VS_RIGHT = {
  block: {
    points: [{ x: 0, y: 0 }, { x: 35, y: 0 }, { x: 35, y: 10 }, { x: 0, y: 10 }],
    color: '#ef4444',
    label: 'Block',
    desc: 'Double block at left pin',
  },
  tipCover: {
    points: [{ x: 35, y: 8 }, { x: 55, y: 8 }, { x: 55, y: 30 }, { x: 35, y: 30 }],
    color: '#f97316',
    label: 'Tips',
    desc: 'Off-blocker covers tips behind block',
  },
  lineDig: {
    points: [{ x: 0, y: 28 }, { x: 22, y: 28 }, { x: 22, y: 72 }, { x: 0, y: 72 }],
    color: '#3b82f6',
    label: 'Line',
    desc: 'Dig line shot down sideline',
  },
  crossDig: {
    points: [{ x: 55, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 72 }, { x: 55, y: 72 }],
    color: '#22c55e',
    label: 'Cross',
    desc: 'Dig sharp cross-court angle',
  },
  deep: {
    points: [{ x: 22, y: 60 }, { x: 68, y: 60 }, { x: 68, y: 90 }, { x: 22, y: 90 }],
    color: '#a855f7',
    label: 'Deep',
    desc: 'Read power angle through seam',
  },
};

// ── DEFENSE vs MIDDLE ATTACK (opponent zone 3) ──
export const DEFENSE_VS_MIDDLE = {
  block: {
    points: [{ x: 25, y: 0 }, { x: 65, y: 0 }, { x: 65, y: 10 }, { x: 25, y: 10 }],
    color: '#ef4444',
    label: 'Block',
    desc: 'Middle blocker + closer seal',
  },
  leftWing: {
    points: [{ x: 0, y: 8 }, { x: 28, y: 8 }, { x: 28, y: 60 }, { x: 0, y: 60 }],
    color: '#3b82f6',
    label: 'Left Wing',
    desc: 'Off-blocker + LB cover left',
  },
  rightWing: {
    points: [{ x: 62, y: 8 }, { x: 90, y: 8 }, { x: 90, y: 60 }, { x: 62, y: 60 }],
    color: '#22c55e',
    label: 'Right Wing',
    desc: 'Off-blocker + RB cover right',
  },
  deep: {
    points: [{ x: 20, y: 55 }, { x: 70, y: 55 }, { x: 70, y: 90 }, { x: 20, y: 90 }],
    color: '#a855f7',
    label: 'Deep',
    desc: 'CB reads seam through block',
  },
};

// Backward compat
export const DEFENSE_ZONES = {
  4: { points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 28 }, { x: 0, y: 28 }], color: '#3b82f6', label: 'Block L / Tips' },
  3: { points: [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 28 }, { x: 30, y: 28 }], color: '#ef4444', label: 'Block Mid' },
  2: { points: [{ x: 60, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 28 }, { x: 60, y: 28 }], color: '#22c55e', label: 'Block R / Tips' },
  5: { points: [{ x: 0, y: 28 }, { x: 30, y: 28 }, { x: 30, y: 90 }, { x: 0, y: 90 }], color: '#3b82f6', label: 'Dig Left' },
  6: { points: [{ x: 30, y: 28 }, { x: 60, y: 28 }, { x: 60, y: 90 }, { x: 30, y: 90 }], color: '#f97316', label: 'Dig Center' },
  1: { points: [{ x: 60, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 90 }, { x: 60, y: 90 }], color: '#22c55e', label: 'Dig Right' },
};

export const DEFENSE_SCENARIOS = [
  { id: 'left', label: 'vs Left', zones: DEFENSE_VS_LEFT, icon: '←', desc: 'Opponent attacks from zone 4' },
  { id: 'right', label: 'vs Right', zones: DEFENSE_VS_RIGHT, icon: '→', desc: 'Opponent attacks from zone 2' },
  { id: 'middle', label: 'vs Middle', zones: DEFENSE_VS_MIDDLE, icon: '↓', desc: 'Opponent attacks from zone 3' },
];
