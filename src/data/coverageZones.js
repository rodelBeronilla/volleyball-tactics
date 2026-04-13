/**
 * Dynamic coverage zone generation — rotation-aware, player-assigned.
 * Court: net y=0, endline y=90, left x=0, right x=90, attack line y=30.
 *
 * These functions produce zones with player names attached, so the
 * overlay shows "Alistair — Cross dig" not just "Cross".
 */

/**
 * Generate serve receive zones for the current rotation.
 * In a 5-1: the setter releases, 2-3 primary passers take the court.
 * Strongest passers get biggest zones. The front-row players not passing
 * stay near the net.
 *
 * @param {Array} placements - current placements with player info
 * @param {number} rotation - 1-6
 * @returns {Object} zones keyed by id
 */
export function getServeReceiveZones(placements, rotation) {
  // Identify who's passing: back-row non-setter players + libero
  // Front-row players stay at the net (not passing unless OH)
  const passers = [];
  const frontRow = [];

  for (const p of placements) {
    if (!p.player) continue;
    const pos = p.rotationalPosition;
    const isFront = pos === 2 || pos === 3 || pos === 4;
    const role = p.player.position;

    if (isFront) {
      frontRow.push(p);
      // Front-row OHs can participate in serve receive from the net
    } else {
      // Back-row players pass (except setter who penetrates)
      if (role !== 'setter') {
        passers.push(p);
      }
    }
  }

  // Sort passers left to right by their x position
  passers.sort((a, b) => a.x - b.x);

  const zones = {};

  if (passers.length >= 3) {
    // 3-passer W: left, center, right with angled seams
    const [left, center, right] = passers;
    zones.left = {
      points: [{ x: 0, y: 30 }, { x: 33, y: 30 }, { x: 40, y: 55 }, { x: 25, y: 90 }, { x: 0, y: 90 }],
      color: '#3b82f6',
      label: left.player.name,
      desc: 'Left receive',
    };
    zones.center = {
      points: [{ x: 33, y: 30 }, { x: 57, y: 30 }, { x: 65, y: 90 }, { x: 25, y: 90 }, { x: 40, y: 55 }],
      color: '#f59e0b',
      label: center.player.name,
      desc: 'Center receive',
    };
    zones.right = {
      points: [{ x: 57, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 90 }, { x: 65, y: 90 }, { x: 50, y: 55 }],
      color: '#22c55e',
      label: right.player.name,
      desc: 'Right receive',
    };
  } else if (passers.length === 2) {
    const [left, right] = passers;
    zones.left = {
      points: [{ x: 0, y: 30 }, { x: 45, y: 30 }, { x: 45, y: 90 }, { x: 0, y: 90 }],
      color: '#3b82f6',
      label: left.player.name,
      desc: 'Left half',
    };
    zones.right = {
      points: [{ x: 45, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 90 }, { x: 45, y: 90 }],
      color: '#22c55e',
      label: right.player.name,
      desc: 'Right half',
    };
  }

  return zones;
}

/**
 * Generate defense zones for a specific attack scenario.
 * Shows who blocks, who digs line, who digs cross, who covers tips, who reads deep.
 *
 * @param {Array} placements - current placements with player info
 * @param {string} scenario - 'left' | 'right' | 'middle'
 * @returns {Object} zones with player names
 */
export function getDefenseZones(placements, scenario) {
  // Split into front row and back row
  const front = [];
  const back = [];
  for (const p of placements) {
    if (!p.player) continue;
    const pos = p.rotationalPosition;
    if (pos === 2 || pos === 3 || pos === 4) front.push(p);
    else back.push(p);
  }

  // Sort front row left to right (by position: 4=LF, 3=CF, 2=RF)
  const lf = front.find(p => p.rotationalPosition === 4);
  const cf = front.find(p => p.rotationalPosition === 3);
  const rf = front.find(p => p.rotationalPosition === 2);

  // Sort back row: 5=LB, 6=CB, 1=RB
  const lb = back.find(p => p.rotationalPosition === 5);
  const cb = back.find(p => p.rotationalPosition === 6);
  const rb = back.find(p => p.rotationalPosition === 1);

  const name = (p) => p?.player?.name || '?';
  const zones = {};

  if (scenario === 'left') {
    // Opponent attacks from THEIR zone 4 → ball comes to OUR right side
    // Blockers: RF + CF close to the right pin
    // Off-blocker: LF pulls back for tips
    // Line: RB digs line (right sideline)
    // Cross: LB digs cross-court (left side)
    // Deep: CB reads power angle
    zones.block = {
      points: [{ x: 48, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 14 }, { x: 55, y: 14 }],
      color: '#ef4444',
      label: `${name(rf)} + ${name(cf)}`,
      desc: 'Block right pin',
    };
    zones.tips = {
      points: [{ x: 10, y: 8 }, { x: 48, y: 8 }, { x: 42, y: 30 }, { x: 10, y: 28 }],
      color: '#f97316',
      label: name(lf),
      desc: 'Pull back — cover tips & roll',
    };
    zones.line = {
      points: [{ x: 72, y: 14 }, { x: 90, y: 14 }, { x: 90, y: 75 }, { x: 76, y: 60 }],
      color: '#22c55e',
      label: name(rb),
      desc: 'Line dig — hold sideline',
    };
    zones.cross = {
      points: [{ x: 0, y: 28 }, { x: 32, y: 28 }, { x: 42, y: 62 }, { x: 0, y: 72 }],
      color: '#3b82f6',
      label: name(lb),
      desc: 'Cross dig — sharp angle',
    };
    zones.deep = {
      points: [{ x: 0, y: 72 }, { x: 42, y: 62 }, { x: 76, y: 60 }, { x: 90, y: 75 }, { x: 90, y: 90 }, { x: 0, y: 90 }],
      color: '#a855f7',
      label: name(cb),
      desc: 'Deep — read through seam',
    };
  } else if (scenario === 'right') {
    // Opponent attacks from THEIR zone 2 → ball comes to OUR left side
    // Blockers: LF + CF close to the left pin
    // Off-blocker: RF pulls back for tips
    // Line: LB digs line (left sideline)
    // Cross: RB digs cross-court (right side)
    // Deep: CB reads power angle
    zones.block = {
      points: [{ x: 0, y: 0 }, { x: 42, y: 0 }, { x: 35, y: 14 }, { x: 0, y: 14 }],
      color: '#ef4444',
      label: `${name(lf)} + ${name(cf)}`,
      desc: 'Block left pin',
    };
    zones.tips = {
      points: [{ x: 42, y: 8 }, { x: 80, y: 8 }, { x: 80, y: 28 }, { x: 48, y: 30 }],
      color: '#f97316',
      label: name(rf),
      desc: 'Pull back — cover tips & roll',
    };
    zones.line = {
      points: [{ x: 0, y: 14 }, { x: 18, y: 14 }, { x: 14, y: 60 }, { x: 0, y: 75 }],
      color: '#3b82f6',
      label: name(lb),
      desc: 'Line dig — hold sideline',
    };
    zones.cross = {
      points: [{ x: 58, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 72 }, { x: 48, y: 62 }],
      color: '#22c55e',
      label: name(rb),
      desc: 'Cross dig — sharp angle',
    };
    zones.deep = {
      points: [{ x: 0, y: 75 }, { x: 14, y: 60 }, { x: 48, y: 62 }, { x: 90, y: 72 }, { x: 90, y: 90 }, { x: 0, y: 90 }],
      color: '#a855f7',
      label: name(cb),
      desc: 'Deep — read through seam',
    };
  } else {
    // Middle attack — zone 3
    // Blockers: CF + one closer (LF or RF)
    // Both wings open, deep reads seam
    zones.block = {
      points: [{ x: 18, y: 0 }, { x: 72, y: 0 }, { x: 65, y: 14 }, { x: 25, y: 14 }],
      color: '#ef4444',
      label: `${name(cf)} + closer`,
      desc: 'Block middle — seal quick/slide',
    };
    zones.leftWing = {
      points: [{ x: 0, y: 8 }, { x: 25, y: 8 }, { x: 20, y: 52 }, { x: 0, y: 58 }],
      color: '#3b82f6',
      label: name(lf) || name(lb),
      desc: 'Left wing — off-blocker + LB',
    };
    zones.rightWing = {
      points: [{ x: 65, y: 8 }, { x: 90, y: 8 }, { x: 90, y: 58 }, { x: 70, y: 52 }],
      color: '#22c55e',
      label: name(rf) || name(rb),
      desc: 'Right wing — off-blocker + RB',
    };
    zones.deep = {
      points: [{ x: 0, y: 58 }, { x: 20, y: 52 }, { x: 45, y: 45 }, { x: 70, y: 52 }, { x: 90, y: 58 }, { x: 90, y: 90 }, { x: 0, y: 90 }],
      color: '#a855f7',
      label: name(cb),
      desc: 'Deep — read seam + endline',
    };
  }

  return zones;
}

// Attack indicator positions for each scenario
export const ATTACK_INDICATORS = {
  left: { x: 78, label: 'HIT' },
  right: { x: 12, label: 'HIT' },
  middle: { x: 45, label: 'HIT' },
};

export const DEFENSE_SCENARIOS = [
  { id: 'left', label: 'vs Left', icon: '←', desc: 'Opponent attacks from zone 4 (our right side)' },
  { id: 'right', label: 'vs Right', icon: '→', desc: 'Opponent attacks from zone 2 (our left side)' },
  { id: 'middle', label: 'vs Middle', icon: '↓', desc: 'Opponent attacks from zone 3 (center)' },
];

// Backward compat — static zones (unused by new system but kept for old imports)
export const DEFENSE_ZONES = {
  4: { points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 28 }, { x: 0, y: 28 }], color: '#3b82f6', label: 'Block L' },
  3: { points: [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 28 }, { x: 30, y: 28 }], color: '#ef4444', label: 'Block Mid' },
  2: { points: [{ x: 60, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 28 }, { x: 60, y: 28 }], color: '#22c55e', label: 'Block R' },
  5: { points: [{ x: 0, y: 28 }, { x: 30, y: 28 }, { x: 30, y: 90 }, { x: 0, y: 90 }], color: '#3b82f6', label: 'Dig L' },
  6: { points: [{ x: 30, y: 28 }, { x: 60, y: 28 }, { x: 60, y: 90 }, { x: 30, y: 90 }], color: '#f97316', label: 'Dig C' },
  1: { points: [{ x: 60, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 90 }, { x: 60, y: 90 }], color: '#22c55e', label: 'Dig R' },
};

export const SERVE_RECEIVE_ZONES = {}; // kept for old imports — use getServeReceiveZones() instead
