/**
 * Dynamic coverage zone generation — rotation-aware, player-assigned.
 * Court: net y=0, endline y=90, left x=0, right x=90, attack line y=30.
 *
 * CRITICAL RULE: Zones must tile the court completely — no gaps, no overlaps.
 * Every point on the court belongs to exactly one player's zone.
 */

/**
 * Generate serve receive zones — tiles the back court (y=30 to y=90).
 * Front-row players stay at the net (y=0 to y=30).
 * Back-row passers split the receiving area with angled seams.
 */
export function getServeReceiveZones(placements) {
  const passers = [];
  const frontPlayers = [];

  for (const p of placements) {
    if (!p.player) continue;
    const pos = p.rotationalPosition;
    const isFront = pos === 2 || pos === 3 || pos === 4;

    if (isFront) {
      frontPlayers.push(p);
      continue;
    }
    // Back-row setter penetrates — doesn't pass
    if (p.player.position === 'setter') continue;
    passers.push(p);
  }

  passers.sort((a, b) => a.x - b.x);
  const zones = {};

  // Front-row zone (net area — they don't pass, they prepare to attack)
  if (frontPlayers.length > 0) {
    const names = frontPlayers.map(p => p.player.name).join(', ');
    zones.front = {
      points: [{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 30 }, { x: 0, y: 30 }],
      color: '#6b7280',
      label: 'Net',
      desc: `${names} — ready at net`,
    };
  }

  // Back-court split between passers
  if (passers.length >= 3) {
    const s1 = Math.round((passers[0].x + passers[1].x) / 2);
    const s2 = Math.round((passers[1].x + passers[2].x) / 2);

    zones.left = {
      points: [{ x: 0, y: 30 }, { x: s1, y: 30 }, { x: s1 + 4, y: 90 }, { x: 0, y: 90 }],
      color: '#3b82f6',
      label: passers[0].player.name,
      desc: 'Left receive',
    };
    zones.center = {
      points: [{ x: s1, y: 30 }, { x: s2, y: 30 }, { x: s2 - 4, y: 90 }, { x: s1 + 4, y: 90 }],
      color: '#f59e0b',
      label: passers[1].player.name,
      desc: 'Center receive',
    };
    zones.right = {
      points: [{ x: s2, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 90 }, { x: s2 - 4, y: 90 }],
      color: '#22c55e',
      label: passers[2].player.name,
      desc: 'Right receive',
    };
  } else if (passers.length === 2) {
    const seam = Math.round((passers[0].x + passers[1].x) / 2);
    zones.left = {
      points: [{ x: 0, y: 30 }, { x: seam, y: 30 }, { x: seam, y: 90 }, { x: 0, y: 90 }],
      color: '#3b82f6', label: passers[0].player.name, desc: 'Left receive',
    };
    zones.right = {
      points: [{ x: seam, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 90 }, { x: seam, y: 90 }],
      color: '#22c55e', label: passers[1].player.name, desc: 'Right receive',
    };
  }

  // Setter penetration path indicator
  const setter = placements.find(p => p.player?.position === 'setter');
  if (setter) {
    const isFront = setter.rotationalPosition === 2 || setter.rotationalPosition === 3 || setter.rotationalPosition === 4;
    if (!isFront) {
      zones.setterPath = {
        points: [
          { x: setter.x - 4, y: Math.min(setter.y, 28) },
          { x: setter.x + 4, y: Math.min(setter.y, 28) },
          { x: 72, y: 10 }, { x: 64, y: 10 },
        ],
        color: '#fbbf24',
        label: setter.player.name,
        desc: 'Penetrates to target',
      };
    }
  }

  return zones;
}

/**
 * Generate defense zones — tiles entire court, no gaps, no overlaps.
 *
 * Perimeter defense (2-0-4):
 * - 2 blockers at net near the attack → Block zone
 * - 1 off-blocker pulls to 3m line → Tip cover zone
 * - 1 back-row player holds the line → Line zone
 * - 1 back-row player reads cross → Cross zone
 * - 1 back-row player reads deep → Deep zone
 *
 * Total: 6 zones = 6 players = full court coverage.
 */
export function getDefenseZones(placements, scenario) {
  const n = (p) => p?.player?.name || '?';

  // Get players by position
  const lf = placements.find(p => p.rotationalPosition === 4);
  const cf = placements.find(p => p.rotationalPosition === 3);
  const rf = placements.find(p => p.rotationalPosition === 2);
  const lb = placements.find(p => p.rotationalPosition === 5);
  const cb = placements.find(p => p.rotationalPosition === 6);
  const rb = placements.find(p => p.rotationalPosition === 1);

  const zones = {};

  if (scenario === 'left') {
    // Attack from opponent zone 4 → arrives to OUR RIGHT
    // Blockers: RF + CF seal right, LF off
    // RB digs line (right side), LB digs cross (left side), CB deep
    zones.block = {
      points: [{ x: 45, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 14 }, { x: 45, y: 14 }],
      color: '#ef4444',
      label: `${n(rf)} + ${n(cf)}`,
      desc: 'Block right pin',
    };
    zones.tips = {
      points: [{ x: 0, y: 0 }, { x: 45, y: 0 }, { x: 45, y: 14 }, { x: 45, y: 30 }, { x: 0, y: 30 }],
      color: '#f97316',
      label: n(lf),
      desc: 'Off-block — cover tips, roll shots',
    };
    zones.line = {
      points: [{ x: 65, y: 14 }, { x: 90, y: 14 }, { x: 90, y: 65 }, { x: 65, y: 65 }],
      color: '#22c55e',
      label: n(rb),
      desc: 'Line dig — right sideline',
    };
    zones.cross = {
      points: [{ x: 0, y: 30 }, { x: 45, y: 30 }, { x: 45, y: 65 }, { x: 0, y: 65 }],
      color: '#3b82f6',
      label: n(lb),
      desc: 'Cross dig — left side angle',
    };
    zones.deep = {
      points: [
        { x: 0, y: 65 }, { x: 45, y: 65 }, { x: 65, y: 65 },
        { x: 90, y: 65 }, { x: 90, y: 90 }, { x: 0, y: 90 },
      ],
      color: '#a855f7',
      label: n(cb),
      desc: 'Deep — power angle, endline',
    };
    zones.seam = {
      points: [{ x: 45, y: 14 }, { x: 65, y: 14 }, { x: 65, y: 65 }, { x: 45, y: 65 }],
      color: '#8b5cf6',
      label: 'Seam',
      desc: 'Between block + dig — read!',
    };
  } else if (scenario === 'right') {
    // Attack from opponent zone 2 → arrives to OUR LEFT
    // Blockers: LF + CF seal left, RF off
    zones.block = {
      points: [{ x: 0, y: 0 }, { x: 45, y: 0 }, { x: 45, y: 14 }, { x: 0, y: 14 }],
      color: '#ef4444',
      label: `${n(lf)} + ${n(cf)}`,
      desc: 'Block left pin',
    };
    zones.tips = {
      points: [{ x: 45, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 30 }, { x: 45, y: 30 }, { x: 45, y: 14 }],
      color: '#f97316',
      label: n(rf),
      desc: 'Off-block — cover tips, roll shots',
    };
    zones.line = {
      points: [{ x: 0, y: 14 }, { x: 25, y: 14 }, { x: 25, y: 65 }, { x: 0, y: 65 }],
      color: '#3b82f6',
      label: n(lb),
      desc: 'Line dig — left sideline',
    };
    zones.cross = {
      points: [{ x: 45, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 65 }, { x: 45, y: 65 }],
      color: '#22c55e',
      label: n(rb),
      desc: 'Cross dig — right side angle',
    };
    zones.deep = {
      points: [
        { x: 0, y: 65 }, { x: 25, y: 65 }, { x: 45, y: 65 },
        { x: 90, y: 65 }, { x: 90, y: 90 }, { x: 0, y: 90 },
      ],
      color: '#a855f7',
      label: n(cb),
      desc: 'Deep — power angle, endline',
    };
    zones.seam = {
      points: [{ x: 25, y: 14 }, { x: 45, y: 14 }, { x: 45, y: 65 }, { x: 25, y: 65 }],
      color: '#8b5cf6',
      label: 'Seam',
      desc: 'Between block + dig — read!',
    };
  } else {
    // Middle attack — zone 3
    // CF blocks + one closer. Wings split. CB deep.
    zones.block = {
      points: [{ x: 22, y: 0 }, { x: 68, y: 0 }, { x: 68, y: 14 }, { x: 22, y: 14 }],
      color: '#ef4444',
      label: `${n(cf)} + closer`,
      desc: 'Block middle — quick or slide',
    };
    zones.leftWing = {
      points: [{ x: 0, y: 0 }, { x: 22, y: 0 }, { x: 22, y: 55 }, { x: 0, y: 55 }],
      color: '#3b82f6',
      label: `${n(lf)}`,
      desc: 'Left wing — tips + digs',
    };
    zones.rightWing = {
      points: [{ x: 68, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 55 }, { x: 68, y: 55 }],
      color: '#22c55e',
      label: `${n(rf)}`,
      desc: 'Right wing — tips + digs',
    };
    zones.leftBack = {
      points: [{ x: 0, y: 55 }, { x: 22, y: 55 }, { x: 22, y: 90 }, { x: 0, y: 90 }],
      color: '#06b6d4',
      label: n(lb),
      desc: 'LB — cover left deep',
    };
    zones.rightBack = {
      points: [{ x: 68, y: 55 }, { x: 90, y: 55 }, { x: 90, y: 90 }, { x: 68, y: 90 }],
      color: '#14b8a6',
      label: n(rb),
      desc: 'RB — cover right deep',
    };
    zones.deep = {
      points: [
        { x: 22, y: 14 }, { x: 68, y: 14 },
        { x: 68, y: 55 }, { x: 68, y: 90 },
        { x: 22, y: 90 }, { x: 22, y: 55 },
      ],
      color: '#a855f7',
      label: n(cb),
      desc: 'Deep center — seam reads + endline',
    };
  }

  return zones;
}

export const ATTACK_INDICATORS = {
  left: { x: 78, label: 'HIT' },
  right: { x: 12, label: 'HIT' },
  middle: { x: 45, label: 'HIT' },
};

export const DEFENSE_SCENARIOS = [
  { id: 'left', label: 'vs Left', icon: '←', desc: 'Opponent attacks from their zone 4 (our right side)' },
  { id: 'right', label: 'vs Right', icon: '→', desc: 'Opponent attacks from their zone 2 (our left side)' },
  { id: 'middle', label: 'vs Middle', icon: '↓', desc: 'Opponent attacks from zone 3 (center)' },
];

// Backward compat
export const DEFENSE_ZONES = {
  4: { points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 28 }, { x: 0, y: 28 }], color: '#3b82f6', label: 'Block L' },
  3: { points: [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 28 }, { x: 30, y: 28 }], color: '#ef4444', label: 'Block Mid' },
  2: { points: [{ x: 60, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 28 }, { x: 60, y: 28 }], color: '#22c55e', label: 'Block R' },
  5: { points: [{ x: 0, y: 28 }, { x: 30, y: 28 }, { x: 30, y: 90 }, { x: 0, y: 90 }], color: '#3b82f6', label: 'Dig L' },
  6: { points: [{ x: 30, y: 28 }, { x: 60, y: 28 }, { x: 60, y: 90 }, { x: 30, y: 90 }], color: '#f97316', label: 'Dig C' },
  1: { points: [{ x: 60, y: 28 }, { x: 90, y: 28 }, { x: 90, y: 90 }, { x: 60, y: 90 }], color: '#22c55e', label: 'Dig R' },
};
export const SERVE_RECEIVE_ZONES = {};
