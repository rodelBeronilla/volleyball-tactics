/**
 * Formation placement data — role-aware, per-rotation positions.
 *
 * Court: net at y=0, end line at y=90. Left x=0, right x=90.
 * Positions: 1=RB, 2=RF, 3=CF, 4=LF, 5=LB, 6=CB
 * Front row: 2, 3, 4. Back row: 1, 5, 6.
 *
 * KEY CONCEPT: The setter's position changes every rotation.
 * All post-receive formations must place the setter at the setting target,
 * regardless of which rotational position they occupy.
 */

// Which rotational position has the setter in each rotation
// (derived from base lineup: slot 1 = setter)
// deriveRotation formula: position P in rotation R ← base slot ((P+R-2)%6)+1
// Setter (base slot 1) ends up at position: solve for P where ((P+R-2)%6)+1 = 1
// → P = (7-R)%6+1... let's just compute it:
function findSetterPos(rot) {
  // Setter is in base slot 1. After rotation, they're in position where source=1.
  // sourceSlot = ((pos + rot - 2) % 6) + 1 = 1 → pos = (8 - rot) % 6; if 0 → 6
  const p = (8 - rot) % 6;
  return p === 0 ? 6 : p;
}

const SETTER_POSITION = {};
for (let r = 1; r <= 6; r++) SETTER_POSITION[r] = findSetterPos(r);
// R1: pos 1, R2: pos 6, R3: pos 5, R4: pos 4, R5: pos 3, R6: pos 2

const SETTER_TARGET = { x: 68, y: 8 }; // Right-front setting position (zone 2.5)

function isFront(pos) { return pos === 2 || pos === 3 || pos === 4; }

// ═══════════════════════════════════════════
// PHASE: SERVE — Legal pre-serve positions
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// PHASE: SERVE RECEIVE — W formation
// ═══════════════════════════════════════════
// Rotation-specific. Setter cheats toward target when back row.
const SR_5_1 = {
  1: { // S=pos1(RB) — cheats right for penetration
    1: { x: 82, y: 48 }, 2: { x: 60, y: 8 }, 3: { x: 35, y: 8 },
    4: { x: 12, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 55, y: 72 },
  },
  2: { // S=pos6(CB) — cheats right
    1: { x: 70, y: 65 }, 2: { x: 62, y: 8 }, 3: { x: 38, y: 8 },
    4: { x: 12, y: 8 }, 5: { x: 22, y: 55 }, 6: { x: 58, y: 48 },
  },
  3: { // S=pos5(LB) — cheats right
    1: { x: 70, y: 65 }, 2: { x: 65, y: 8 }, 3: { x: 40, y: 8 },
    4: { x: 12, y: 8 }, 5: { x: 25, y: 48 }, 6: { x: 50, y: 72 },
  },
  4: { // S=pos4(LF) FRONT ROW — at net left, slides right
    1: { x: 70, y: 65 }, 2: { x: 72, y: 8 }, 3: { x: 48, y: 8 },
    4: { x: 22, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 50, y: 72 },
  },
  5: { // S=pos3(CF) FRONT ROW — at net center, slides right
    1: { x: 70, y: 65 }, 2: { x: 72, y: 8 }, 3: { x: 48, y: 8 },
    4: { x: 15, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 50, y: 72 },
  },
  6: { // S=pos2(RF) FRONT ROW — at natural setting position
    1: { x: 70, y: 65 }, 2: { x: 72, y: 8 }, 3: { x: 45, y: 8 },
    4: { x: 15, y: 8 }, 5: { x: 25, y: 65 }, 6: { x: 50, y: 72 },
  },
};

// ═══════════════════════════════════════════
// PHASE: PASS — Setter has penetrated to target. Hitters loading.
// ═══════════════════════════════════════════
// The setter is NOW at the setting target regardless of where they started.
// Front-row hitters are loading their approach (pulling off net slightly).
// Back-row non-setters are in coverage positions.
function buildPass() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    const sPos = SETTER_POSITION[rot];
    r[rot] = {};

    for (let pos = 1; pos <= 6; pos++) {
      if (pos === sPos) {
        // Setter at target — always right-front area
        r[rot][pos] = { ...SETTER_TARGET };
      } else if (isFront(pos)) {
        // Front-row hitter — loading approach, slightly off net
        if (pos === 4) r[rot][pos] = { x: 10, y: 18 };  // LF loading left
        else if (pos === 3) r[rot][pos] = { x: 40, y: 15 }; // CF loading center
        else r[rot][pos] = { x: 78, y: 18 }; // RF loading right
      } else {
        // Back-row non-setter — ready for coverage/back-row attack
        if (pos === 1) r[rot][pos] = { x: 72, y: 45 };
        else if (pos === 5) r[rot][pos] = { x: 18, y: 45 };
        else r[rot][pos] = { x: 45, y: 50 };
      }
    }
  }
  return r;
}

// ═══════════════════════════════════════════
// PHASE: OFFENSE — Hitters at attack zones, setter at target
// ═══════════════════════════════════════════
// Setter at setting target. Front-row hitters at pins/middle.
// Back-row in 3-2 cup coverage.
function buildOffense() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    const sPos = SETTER_POSITION[rot];
    r[rot] = {};

    for (let pos = 1; pos <= 6; pos++) {
      if (pos === sPos) {
        r[rot][pos] = { ...SETTER_TARGET }; // Setter at target
      } else if (isFront(pos)) {
        // Hitter at attack zone
        if (pos === 4) r[rot][pos] = { x: 8, y: 4 };   // Left pin
        else if (pos === 3) r[rot][pos] = { x: 38, y: 4 }; // Quick/slide
        else r[rot][pos] = { x: 78, y: 4 }; // Right pin
      } else {
        // Back-row coverage (3-2 cup)
        if (pos === 1) r[rot][pos] = { x: 68, y: 35 };
        else if (pos === 5) r[rot][pos] = { x: 18, y: 35 };
        else r[rot][pos] = { x: 42, y: 40 };
      }
    }
  }
  return r;
}

// ═══════════════════════════════════════════
// PHASE: DEFENSE — Perimeter (2-0-4)
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// PHASE: TRANSITION — Setter releases to target, hitters pull off
// ═══════════════════════════════════════════
function buildTransition() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    const sPos = SETTER_POSITION[rot];
    r[rot] = {};

    for (let pos = 1; pos <= 6; pos++) {
      if (pos === sPos) {
        r[rot][pos] = { ...SETTER_TARGET }; // Setter releases to target
      } else if (isFront(pos)) {
        // Hitters pull off net for approach
        if (pos === 4) r[rot][pos] = { x: 10, y: 22 };
        else if (pos === 3) r[rot][pos] = { x: 38, y: 20 };
        else r[rot][pos] = { x: 78, y: 22 };
      } else {
        // Back-row ready
        if (pos === 1) r[rot][pos] = { x: 72, y: 48 };
        else if (pos === 5) r[rot][pos] = { x: 18, y: 48 };
        else r[rot][pos] = { x: 45, y: 52 };
      }
    }
  }
  return r;
}

// ═══════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════
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

export const RALLY_PHASES = [
  { id: 'serve', formationId: 'serve', label: 'Serve',
    description: 'Pre-serve. Position 1 serves. All in legal overlap positions.',
    showRoutes: false, showCoverage: false },
  { id: 'receive', formationId: 'sr-5-1', label: 'Receive',
    description: 'Serve incoming. Passers in W. Setter cheating toward target.',
    showRoutes: false, showCoverage: false },
  { id: 'pass', formationId: 'pass', label: 'Pass',
    description: 'Ball passed to setter. Setter AT TARGET. Hitters loading approach.',
    showRoutes: true, showCoverage: false },
  { id: 'offense', formationId: 'offense', label: 'Attack',
    description: 'Setter sets. All attack options: 4-ball, quick, slide, 2-ball, pipe, D-ball.',
    showRoutes: true, showCoverage: false },
  { id: 'coverage', formationId: 'offense', label: 'Cover',
    description: '3-2 coverage cup behind hitter. 3 closest cover, 2 deep.',
    showRoutes: false, showCoverage: true },
  { id: 'defense', formationId: 'def-perimeter', label: 'Defense',
    description: 'Opponent attacks. 2 blockers, 4 diggers on perimeter.',
    showRoutes: false, showCoverage: true },
  { id: 'transition', formationId: 'transition', label: 'Transition',
    description: 'Dig → setter releases to target. Hitters pull off net for approach.',
    showRoutes: true, showCoverage: false },
];

export { SETTER_POSITION };
