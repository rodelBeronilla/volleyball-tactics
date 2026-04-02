/**
 * Formation placement data — role-aware, per-rotation positions.
 *
 * Court: net at y=0, end line at y=90. Left x=0, right x=90.
 * Positions: 1=RB, 2=RF, 3=CF, 4=LF, 5=LB, 6=CB
 * Front row: 2, 3, 4. Back row: 1, 5, 6.
 *
 * Each rally movement has two steps:
 *   1. PLAN step — show arrows/routes where players will go (players still at previous position)
 *   2. MOVE step — players animate to new positions
 */

import { SLOT_ROLE_MAP } from './strategyData';

function findSetterPos(rot) {
  const p = (8 - rot) % 6;
  return p === 0 ? 6 : p;
}

const SETTER_POSITION = {};
for (let r = 1; r <= 6; r++) SETTER_POSITION[r] = findSetterPos(r);

const SETTER_TARGET = { x: 68, y: 8 };
function isFront(pos) { return pos === 2 || pos === 3 || pos === 4; }

// ── SERVE: Legal pre-serve positions ──
function buildServe() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    r[rot] = {
      4: { x: 15, y: 15 }, 3: { x: 45, y: 15 }, 2: { x: 75, y: 15 },
      5: { x: 15, y: 60 }, 6: { x: 45, y: 60 }, 1: { x: 75, y: 82 },
    };
  }
  return r;
}

// ── SERVE RECEIVE: W formation ──
const SR_5_1 = {
  1: {
    1: { x: 82, y: 48 }, 2: { x: 60, y: 8 }, 3: { x: 35, y: 8 },
    4: { x: 12, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 55, y: 72 },
  },
  2: {
    1: { x: 70, y: 65 }, 2: { x: 62, y: 8 }, 3: { x: 38, y: 8 },
    4: { x: 12, y: 8 }, 5: { x: 22, y: 55 }, 6: { x: 58, y: 48 },
  },
  3: {
    1: { x: 70, y: 65 }, 2: { x: 65, y: 8 }, 3: { x: 40, y: 8 },
    4: { x: 12, y: 8 }, 5: { x: 25, y: 48 }, 6: { x: 50, y: 72 },
  },
  4: {
    1: { x: 70, y: 65 }, 2: { x: 72, y: 8 }, 3: { x: 48, y: 8 },
    4: { x: 22, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 50, y: 72 },
  },
  5: {
    1: { x: 70, y: 65 }, 2: { x: 72, y: 8 }, 3: { x: 48, y: 8 },
    4: { x: 15, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 50, y: 72 },
  },
  6: {
    1: { x: 70, y: 65 }, 2: { x: 72, y: 8 }, 3: { x: 45, y: 8 },
    4: { x: 15, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 50, y: 72 },
  },
};

// Attack zone by ROLE (not by position number)
// Attack zone by ROLE — where each role attacks from
// OH attacks from left pin (zone 4). OPP attacks from right pin (zone 2).
// MB1 runs quick in front of setter. MB2 runs slide behind setter.
const ROLE_ATTACK_ZONE = {
  'OH1': { front: { x: 8, y: 4 }, back: { x: 45, y: 30 } },    // Left pin / pipe
  'OH2': { front: { x: 8, y: 4 }, back: { x: 45, y: 30 } },    // Left pin / pipe
  'MB1': { front: { x: 42, y: 4 }, back: null },                  // Quick (in front of setter)
  'MB2': { front: { x: 55, y: 4 }, back: null },                  // Slide (behind setter)
  'OPP': { front: { x: 80, y: 4 }, back: { x: 75, y: 30 } },    // Right pin / D-ball
  'S':   { front: { x: 68, y: 8 }, back: { x: 68, y: 8 } },     // Setter target
};

// Loading position (slightly off net, preparing approach)
const ROLE_LOAD_POS = {
  'OH1': { front: { x: 8, y: 20 }, back: { x: 20, y: 45 } },
  'OH2': { front: { x: 8, y: 20 }, back: { x: 20, y: 45 } },
  'MB1': { front: { x: 42, y: 18 }, back: null },
  'MB2': { front: { x: 55, y: 18 }, back: null },
  'OPP': { front: { x: 80, y: 20 }, back: { x: 72, y: 45 } },
  'S':   { front: { x: 68, y: 8 }, back: { x: 68, y: 8 } },
};

function getRolePos(roleMap, pos, posMap, fallback) {
  const role = roleMap[pos];
  const front = isFront(pos);
  const zoneData = posMap[role];
  if (!zoneData) return fallback;
  const target = front ? zoneData.front : zoneData.back;
  return target || fallback;
}

// ── PASS: Setter at target, hitters loading approach ──
function buildPass() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    const roleMap = SLOT_ROLE_MAP[rot];
    r[rot] = {};
    for (let pos = 1; pos <= 6; pos++) {
      const role = roleMap[pos];
      if (role === 'S') {
        r[rot][pos] = { ...SETTER_TARGET };
      } else {
        const target = getRolePos(roleMap, pos, ROLE_LOAD_POS, { x: 45, y: 45 });
        r[rot][pos] = { ...target };
      }
    }
  }
  return r;
}

// ── OFFENSE: Hitters at ROLE-APPROPRIATE attack zones ──
function buildOffense() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    const roleMap = SLOT_ROLE_MAP[rot];
    r[rot] = {};
    for (let pos = 1; pos <= 6; pos++) {
      const role = roleMap[pos];
      if (role === 'S') {
        r[rot][pos] = { ...SETTER_TARGET };
      } else if (isFront(pos)) {
        const target = getRolePos(roleMap, pos, ROLE_ATTACK_ZONE, { x: 45, y: 4 });
        r[rot][pos] = { ...target };
      } else {
        // Back-row: coverage cup positions
        const backZone = ROLE_ATTACK_ZONE[role]?.back;
        if (backZone) {
          // Back-row attacker (OH pipe, OPP D-ball) — at their attack zone
          r[rot][pos] = { ...backZone };
        } else {
          // Non-attacking back-row (MB replaced by libero) — coverage
          if (pos === 1) r[rot][pos] = { x: 68, y: 38 };
          else if (pos === 5) r[rot][pos] = { x: 18, y: 38 };
          else r[rot][pos] = { x: 42, y: 42 };
        }
      }
    }
  }
  return r;
}

// ── DEFENSE: Perimeter (2-0-4) ──
function buildDefense() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    r[rot] = {
      4: { x: 12, y: 5 }, 3: { x: 45, y: 5 }, 2: { x: 78, y: 5 },
      5: { x: 8, y: 75 }, 6: { x: 45, y: 80 }, 1: { x: 82, y: 75 },
    };
  }
  return r;
}

// ── TRANSITION: Setter to target, hitters at loading positions ──
function buildTransition() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    const roleMap = SLOT_ROLE_MAP[rot];
    r[rot] = {};
    for (let pos = 1; pos <= 6; pos++) {
      const role = roleMap[pos];
      if (role === 'S') {
        r[rot][pos] = { ...SETTER_TARGET };
      } else {
        const target = getRolePos(roleMap, pos, ROLE_LOAD_POS, { x: 45, y: 45 });
        r[rot][pos] = { ...target };
      }
    }
  }
  return r;
}

export const FORMATIONS = [
  { id: 'serve', name: 'Serve', placements: buildServe() },
  { id: 'sr-5-1', name: 'Receive', placements: SR_5_1 },
  { id: 'pass', name: 'Pass', placements: buildPass() },
  { id: 'offense', name: 'Offense', placements: buildOffense() },
  { id: 'def-perimeter', name: 'Defense', placements: buildDefense() },
  { id: 'transition', name: 'Transition', placements: buildTransition() },
];

export function getFormation(id) {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0];
}

/**
 * Rally phases — each movement has PLAN (show arrows) then MOVE (animate players).
 *
 * PLAN steps: players stay at PREVIOUS formation, arrows show where they'll go.
 *   formationId = previous formation (players haven't moved yet)
 *   showRoutes = true (arrows preview the movement)
 *
 * MOVE steps: players animate to new formation.
 *   formationId = target formation
 *   showRoutes = false (movement complete)
 */
export const RALLY_PHASES = [
  // 1. Pre-serve
  { id: 'serve', formationId: 'serve', label: 'Serve',
    description: 'Pre-serve legal positions. Position 1 serves.',
    showRoutes: false, showCoverage: false, showOverlap: true },

  // 2. Ball served → plan receive positions
  { id: 'receive-plan', formationId: 'serve', label: '→ Receive',
    description: 'Serve contact! Players move to receive formation.',
    showRoutes: true, showCoverage: false, showOverlap: false },

  // 3. In receive formation
  { id: 'receive', formationId: 'sr-5-1', label: 'Receive',
    description: 'Passers in W formation. Setter cheating toward target.',
    showRoutes: false, showCoverage: false, showOverlap: false },

  // 4. Pass made → plan setter penetration + hitter loading
  { id: 'pass-plan', formationId: 'sr-5-1', label: '→ Pass',
    description: 'Pass to setter! Setter penetrates, hitters load approach.',
    showRoutes: true, showCoverage: false, showOverlap: false },

  // 5. Setter at target, hitters loaded
  { id: 'pass', formationId: 'pass', label: 'Set Up',
    description: 'Setter at target. Reading block. Choosing attack option.',
    showRoutes: false, showCoverage: false, showOverlap: false },

  // 6. Setter distributes → show all attack options
  { id: 'attack-plan', formationId: 'pass', label: '→ Attack',
    description: 'All attack options: 4-ball, quick, slide, right-side, pipe, D-ball.',
    showRoutes: true, showCoverage: false, showOverlap: false },

  // 7. Attack — hitters at zones, coverage cup forms
  { id: 'attack', formationId: 'offense', label: 'Attack',
    description: 'Hitter attacks. 3-2 coverage cup behind hitter.',
    showRoutes: false, showCoverage: true, showOverlap: false },

  // 8. Ball crosses net → plan defensive transition
  { id: 'defense-plan', formationId: 'offense', label: '→ Defense',
    description: 'Rally continues. Transition to defensive positions.',
    showRoutes: true, showCoverage: false, showOverlap: false },

  // 9. Defense formed
  { id: 'defense', formationId: 'def-perimeter', label: 'Defense',
    description: 'Perimeter defense (2-0-4). 2 blockers, 4 diggers.',
    showRoutes: false, showCoverage: true, showOverlap: false },

  // 10. Dig made → plan transition to counter-attack
  { id: 'transition-plan', formationId: 'def-perimeter', label: '→ Transition',
    description: 'Dig! Setter releases to target. Hitters approach for counter.',
    showRoutes: true, showCoverage: false, showOverlap: false },

  // 11. Transition — ready for counter-attack
  { id: 'transition', formationId: 'transition', label: 'Transition',
    description: 'Setter at target. Hitters pulled off net. Back-row ready.',
    showRoutes: false, showCoverage: false, showOverlap: false },
];

export { SETTER_POSITION };

/**
 * Find which rotational position the setter occupies, given actual lineup + players.
 * Falls back to SETTER_POSITION[rot] if no lineup/players available.
 */
export function findDynamicSetterPos(lineup, players, rotation) {
  if (!lineup || !players) return SETTER_POSITION[rotation];

  // Find which base slot has a setter
  let setterSlot = null;
  for (let s = 1; s <= 6; s++) {
    const pid = lineup.slots[s];
    const player = pid ? players.find(p => p.id === pid) : null;
    if (player?.position === 'setter') { setterSlot = s; break; }
  }

  if (!setterSlot) return SETTER_POSITION[rotation]; // fallback

  // deriveRotation: position P gets player from slot ((P+rot-2)%6)+1
  // We need to find P where sourceSlot = setterSlot
  // ((P+rot-2)%6)+1 = setterSlot → P = (setterSlot - rot + 7) % 6; if 0 → 6
  const p = (setterSlot - rotation + 7) % 6;
  return p === 0 ? 6 : p;
}
