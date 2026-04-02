/**
 * Formation placement data — 5 rally phases, volleyball theory-correct.
 *
 * Court: net at y=0, end line at y=90. Left x=0, right x=90.
 * Positions: 1=RB, 2=RF, 3=CF, 4=LF, 5=LB, 6=CB
 * Front row: 2, 3, 4. Back row: 1, 5, 6.
 *
 * Rally flow: Serve → Receive → Offense → Defense → Transition → (repeat)
 */

// ═══════════════════════════════════════════
// PHASE 1: SERVE — Legal pre-serve positions
// ═══════════════════════════════════════════
// All players must respect overlap rules. Position 1 is the server.
// Everyone stays in their legal zones, ready to transition after the serve.

function buildServe() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    r[rot] = {
      // Front row at net in legal positions
      4: { x: 15, y: 15 }, // LF
      3: { x: 45, y: 15 }, // CF
      2: { x: 75, y: 15 }, // RF
      // Back row behind their front-row counterparts
      5: { x: 15, y: 60 }, // LB
      6: { x: 45, y: 60 }, // CB
      1: { x: 75, y: 80 }, // RB — SERVER (behind endline)
    };
  }
  return r;
}

// ═══════════════════════════════════════════
// PHASE 2: SERVE RECEIVE — W formation, 5-1
// ═══════════════════════════════════════════
// Passers form W, setter cheats toward target (right-front area).
// R1-R3: Setter back row, penetrates. R4-R6: Setter front row.

const SR_5_1 = {
  // R1: S=1(RB), OPP=2(RF), MB1=3(CF), OH1=4(LF), MB2=5(LB), OH2=6(CB)
  // Front row squeezes LEFT to open right-side passing lane for setter penetration
  1: {
    1: { x: 82, y: 48 }, // Setter cheats forward-right for quick penetration
    2: { x: 60, y: 8 },  // OPP squeezed left at net (opens right lane)
    3: { x: 35, y: 8 },  // MB1 squeezed left at net
    4: { x: 12, y: 8 },  // OH1 far left at net
    5: { x: 25, y: 65 }, // MB2/Libero — left-back passer (W)
    6: { x: 55, y: 72 }, // OH2 — center-right passer (W)
  },
  // R2: {1:OPP, 2:MB1, 3:OH1, 4:MB2, 5:OH2, 6:S}
  // Front row squeezes LEFT, setter from CB cheats right
  2: {
    1: { x: 70, y: 65 }, // OPP — right-back passer (W)
    2: { x: 62, y: 8 },  // MB1 at net (squeezed left)
    3: { x: 38, y: 8 },  // OH1 at net
    4: { x: 12, y: 8 },  // MB2/Libero at net LF
    5: { x: 22, y: 55 }, // OH2 — left-back passer (W)
    6: { x: 58, y: 48 }, // Setter cheats right from CB
  },
  // R3: {1:MB1, 2:OH1, 3:MB2, 4:OH2, 5:S, 6:OPP}
  // Setter from LB cheats right. Front row squeezes to open lane.
  3: {
    1: { x: 70, y: 65 }, // MB1/Libero — right-back passer (W)
    2: { x: 65, y: 8 },  // OH1 at net (squeezed left)
    3: { x: 40, y: 8 },  // MB2 at net CF
    4: { x: 12, y: 8 },  // OH2 at net LF
    5: { x: 25, y: 48 }, // Setter cheats right from LB
    6: { x: 50, y: 72 }, // OPP — center-back passer (W)
  },
  // R4: {1:OH1, 2:MB2, 3:OH2, 4:S, 5:OPP, 6:MB1}
  // Setter FRONT ROW (pos 4). Setter at left-front, slides right to set.
  // 2 attackers: MB2(pos2) + OH2(pos3). Stack left for setter.
  4: {
    1: { x: 70, y: 65 }, // OH1 — right-back passer (W)
    2: { x: 72, y: 8 },  // MB2 at net RF
    3: { x: 48, y: 8 },  // OH2 at net CF
    4: { x: 22, y: 8 },  // Setter at net LF (will slide right after contact)
    5: { x: 25, y: 65 }, // OPP — left-back passer (W)
    6: { x: 50, y: 72 }, // MB1/Libero — center passer
  },
  // R5: {1:MB2, 2:OH2, 3:S, 4:OPP, 5:MB1, 6:OH1}
  // Setter FRONT ROW (pos 3, center). Slides right. 2 attackers: OH2(pos2) + OPP(pos4)
  5: {
    1: { x: 70, y: 65 }, // MB2/Libero — right-back passer
    2: { x: 72, y: 8 },  // OH2 at net RF
    3: { x: 48, y: 8 },  // Setter at net CF (slides right)
    4: { x: 15, y: 8 },  // OPP at net LF
    5: { x: 25, y: 65 }, // MB1/Libero — left-back passer
    6: { x: 50, y: 72 }, // OH1 — center passer
  },
  // R6: {1:OH2, 2:S, 3:OPP, 4:MB1, 5:OH1, 6:MB2}
  // Setter FRONT ROW (pos 2, RF) — natural setting position! 2 attackers: OPP(pos3) + MB1(pos4)
  6: {
    1: { x: 70, y: 65 }, // OH2 — right-back passer
    2: { x: 72, y: 8 },  // Setter at net RF (ideal setting spot)
    3: { x: 45, y: 8 },  // OPP at net CF
    4: { x: 15, y: 8 },  // MB1 at net LF
    5: { x: 25, y: 65 }, // OH1 — left-back passer
    6: { x: 50, y: 72 }, // MB2/Libero — center passer
  },
};

// ═══════════════════════════════════════════
// PHASE 3: OFFENSE — Attack positions + 3-2 coverage cup
// ═══════════════════════════════════════════
// Front row: spread to attack zones (pins + middle)
// Setter: at right-front target area (penetrates if from back row)
// Back row: 3-2 cup behind the attacking hitter

function buildOffense() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    r[rot] = {
      4: { x: 12, y: 6 },   // LF — left pin attack zone
      3: { x: 42, y: 6 },   // CF — quick/slide attack zone
      2: { x: 75, y: 6 },   // RF — right pin attack zone
      // Back row: 3-2 coverage cup (pulled up behind hitters)
      5: { x: 18, y: 38 },  // LB — inner cup left
      6: { x: 45, y: 42 },  // CB — inner cup center
      1: { x: 72, y: 38 },  // RB — inner cup right
    };
  }
  return r;
}

// ═══════════════════════════════════════════
// PHASE 4: DEFENSE — Perimeter (2-0-4)
// ═══════════════════════════════════════════
// 2 front-row blockers at net
// Off-blocker (non-blocking front row) pulls to 3m line for tips
// 3 back-row diggers on perimeter (sidelines + endline)

function buildDefense() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    r[rot] = {
      // Front row: blocking positions at net
      4: { x: 12, y: 5 },   // LF blocker
      3: { x: 45, y: 5 },   // CF blocker (middle)
      2: { x: 78, y: 5 },   // RF blocker
      // Back row: perimeter dig positions
      5: { x: 8, y: 75 },   // LB — deep left sideline
      6: { x: 45, y: 80 },  // CB — deep center endline
      1: { x: 82, y: 75 },  // RB — deep right sideline
    };
  }
  return r;
}

// ═══════════════════════════════════════════
// PHASE 5: TRANSITION — Defense back to offense
// ═══════════════════════════════════════════
// Setter releases from defensive position to target area
// Hitters pull off net for approach run
// Back-row players ready for pipe/back-row attack

function buildTransition() {
  const r = {};
  for (let rot = 1; rot <= 6; rot++) {
    r[rot] = {
      // Front row: pull off net for approach
      4: { x: 12, y: 22 },  // LF — pulls back for approach run
      3: { x: 40, y: 20 },  // CF — pulls back for quick approach
      2: { x: 72, y: 22 },  // RF — pulls back for approach
      // Back row: ready for back-row attack or coverage
      5: { x: 18, y: 50 },  // LB — ready for pipe
      6: { x: 45, y: 55 },  // CB — setter target or pipe
      1: { x: 72, y: 50 },  // RB — ready for D-ball
    };
  }
  return r;
}

// ═══════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════

export const FORMATIONS = [
  { id: 'serve', name: 'Serve', type: 'serve', description: 'Pre-serve legal positions, position 1 serves', placements: buildServe() },
  { id: 'sr-5-1', name: 'Receive', type: 'serve-receive', description: '5-1 W formation, setter penetrates', placements: SR_5_1 },
  { id: 'offense', name: 'Offense', type: 'offense', description: 'Attack positions with 3-2 coverage cup', placements: buildOffense() },
  { id: 'def-perimeter', name: 'Defense', type: 'defense', description: 'Perimeter defense (2-0-4)', placements: buildDefense() },
  { id: 'transition', name: 'Transition', type: 'transition', description: 'Defense→Offense, setter releases, hitters approach', placements: buildTransition() },
];

export function getFormation(id) {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0];
}

/**
 * Rally phase sequence — granular step-through for coaching.
 * Each phase shows a specific moment in the rally with contextual info.
 */
export const RALLY_PHASES = [
  { id: 'serve', formationId: 'serve', label: 'Serve',
    description: 'Pre-serve legal positions. Server (pos 1) behind endline.',
    showRoutes: false, showCoverage: false },
  { id: 'receive', formationId: 'sr-5-1', label: 'Receive',
    description: 'Serve incoming. Passers in W, setter cheats to target area.',
    showRoutes: false, showCoverage: false },
  { id: 'pass', formationId: 'sr-5-1', label: 'Pass',
    description: 'Ball passed to setter. Setter penetrates, hitters load approach.',
    showRoutes: true, showCoverage: false },
  { id: 'offense', formationId: 'offense', label: 'Attack',
    description: 'Setter distributes. All attack options shown — 4-ball, quick, slide, 2-ball, pipe, D-ball.',
    showRoutes: true, showCoverage: false },
  { id: 'coverage', formationId: 'offense', label: 'Cover',
    description: 'Attack coverage (3-2 cup). 3 closest players behind hitter, 2 deep.',
    showRoutes: false, showCoverage: true },
  { id: 'defense', formationId: 'def-perimeter', label: 'Defense',
    description: 'Opponent attacks. 2 blockers at net, 4 diggers on perimeter.',
    showRoutes: false, showCoverage: true },
  { id: 'transition', formationId: 'transition', label: 'Transition',
    description: 'Dig → setter releases to target. Hitters pull off net for approach.',
    showRoutes: true, showCoverage: false },
];
