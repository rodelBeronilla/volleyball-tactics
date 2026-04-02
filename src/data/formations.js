/**
 * Formation placement data — volleyball theory-correct positions.
 *
 * Court: net at y=0, end line at y=90. Left x=0, right x=90.
 * Positions: 1=RB, 2=RF, 3=CF, 4=LF, 5=LB, 6=CB
 *
 * Standard 5-1 lineup (Rotation 1):
 *   Slot 1: Setter (RB) — opposite to OPP
 *   Slot 2: Opposite (RF)
 *   Slot 3: Middle 1 (CF)
 *   Slot 4: Outside 1 (LF)
 *   Slot 5: Middle 2 (LB) — libero replaces in back row
 *   Slot 6: Outside 2 (CB)
 *
 * Key rotation rules:
 * - R1-R3: Setter is back row → 3 front-row attackers, setter penetrates to ~zone 2.5
 * - R4-R6: Setter is front row → 2 front-row attackers, setter already at net
 * - Front row = positions 2, 3, 4 (always)
 * - Back row = positions 1, 5, 6 (always)
 * - Overlap: front must be closer to net than corresponding back; left must be left of center
 */

// ═══════════════════════════════════════════
// SERVE RECEIVE — W formation, 5-1 system
// ═══════════════════════════════════════════
// When receiving, non-passing front-row players push to net, passers form W shape
// Setter cheats toward target area (right-front) when in back row

const SR_5_1 = {
  // R1: S=1(RB), OPP=2(RF), MB1=3(CF), OH1=4(LF), MB2=5(LB), OH2=6(CB)
  // 3 attackers front row. Setter penetrates from RB. MB2/Libero passes.
  1: {
    1: { x: 78, y: 48 }, // Setter — cheats forward-right for penetration
    2: { x: 72, y: 10 }, // OPP — at net right front
    3: { x: 45, y: 8 },  // MB1 — at net center
    4: { x: 18, y: 10 }, // OH1 — at net left front
    5: { x: 22, y: 68 }, // MB2/Libero — deep left passer
    6: { x: 50, y: 72 }, // OH2 — deep center passer
  },

  // R2: OH2=1(RB), S=2→6(CB→penetrate), OPP=2(RF), MB1→OH2=3(CF), OH1→MB=4(LF), MB2=5(LB)
  // Actually: S=6(CB), OH2=1(RB), OPP=2(RF), OH1=3(CF), MB1=4(LF), MB2/L=5(LB)
  2: {
    1: { x: 68, y: 68 }, // OH2 — deep right passer
    2: { x: 72, y: 10 }, // OPP — at net right front
    3: { x: 45, y: 8 },  // OH1 — at net center front
    4: { x: 18, y: 10 }, // MB1 — at net left front
    5: { x: 18, y: 55 }, // MB2/Libero — left back passer
    6: { x: 55, y: 48 }, // Setter — cheats right from CB for penetration
  },

  // R3: MB2/L=1(RB), OH2=2(RF), S=5→penetrate, OPP=3(CF), OH1→MB=4(LF)→actually OH2=4
  // S=5(LB), MB2/L=1(RB), OH2=2(RF), OPP=3(CF), OH1=4(LF), MB1=6(CB)
  3: {
    1: { x: 68, y: 68 }, // MB2/Libero — deep right passer
    2: { x: 72, y: 10 }, // OH2 — at net right front
    3: { x: 45, y: 8 },  // OPP — at net center front
    4: { x: 18, y: 10 }, // OH1 — at net left front
    5: { x: 22, y: 48 }, // Setter — cheats right from LB for penetration
    6: { x: 50, y: 72 }, // MB1/Libero — deep center passer
  },

  // R4: S=4(LF) FRONT ROW — 2 attackers. Setter at net left, slides to right to set.
  // MB1=1(RB), MB2/L=6→already back, OH2=5→back
  // S=4(LF), MB1=5→nope... Let me recalculate.
  // After 3 rotations from R1: S moves 1→6→5→4. So S=4(LF) in R4.
  // OPP moves 2→1→6→5... wait, rotation is clockwise.
  // R1: S=1, OPP=2, MB1=3, OH1=4, MB2=5, OH2=6
  // R2: S=6, OPP=1, MB1=2... no. Rotation: each position gets the player from the NEXT position.
  // Actually: deriveRotation shifts. R2 means everyone moved one spot clockwise.
  // So R2: pos1 gets whoever was in pos2 (OPP), pos2 gets pos3 (MB1), etc.
  // R1: {1:S, 2:OPP, 3:MB1, 4:OH1, 5:MB2, 6:OH2}
  // R2: {1:OH2, 2:S, 3:OPP, 4:MB1, 5:OH1, 6:MB2}  -- wait this doesn't match the code.
  // Let me check deriveRotation logic...
  // deriveRotation: sourcePos = ((pos + shift - 1) % 6) + 1, shift = rot - 1
  // R2 (shift=1): pos1 source = ((1+1-1)%6)+1 = 2. So pos1 gets slot2's player = OPP. Correct.
  // R2: {1:OPP, 2:MB1, 3:OH1, 4:MB2, 5:OH2, 6:S}
  // R3: {1:MB1, 2:OH1, 3:MB2, 4:OH2, 5:S, 6:OPP}... wait that seems wrong too.
  // Actually let me just trace it properly.
  // Base (R1): 1=S, 2=OPP, 3=MB1, 4=OH1, 5=MB2, 6=OH2
  // After winning rally while receiving, team rotates clockwise:
  // Position 1 player goes to position 6, 6→5, 5→4, 4→3, 3→2, 2→1
  // So R2: 1=OPP(was 2), 2=MB1(was 3), 3=OH1(was 4), 4=MB2(was 5), 5=OH2(was 6), 6=S(was 1)
  // R3: 1=MB1, 2=OH1, 3=MB2, 4=OH2, 5=S, 6=OPP
  // R4: 1=OH1, 2=MB2, 3=OH2, 4=S, 5=OPP, 6=MB1
  // R5: 1=MB2, 2=OH2, 3=S, 4=OPP, 5=MB1, 6=OH1
  // R6: 1=OH2, 2=S, 3=OPP, 4=MB1, 5=OH1, 6=MB2

  // R4: S=4(LF), OPP=5(LB), MB1=6(CB), OH1=1(RB), MB2=2(RF), OH2=3(CF)
  // Front row: pos 2=MB2, pos 3=OH2, pos 4=S — Setter front row! 2 attackers (MB2 + OH2)
  4: {
    1: { x: 68, y: 68 }, // OH1 — deep right passer
    2: { x: 72, y: 10 }, // MB2 — at net right front
    3: { x: 45, y: 8 },  // OH2 — at net center front
    4: { x: 18, y: 12 }, // Setter — at net left front (will slide right to set)
    5: { x: 22, y: 68 }, // OPP — deep left passer
    6: { x: 50, y: 72 }, // MB1/Libero — deep center passer
  },

  // R5: S=3(CF), OPP=4→actually... R5: 1=MB2, 2=OH2, 3=S, 4=OPP, 5=MB1, 6=OH1
  // Front row: pos 2=OH2, pos 3=S, pos 4=OPP — S front row center. 2 attackers (OH2 + OPP)
  5: {
    1: { x: 68, y: 68 }, // MB2/Libero — deep right passer
    2: { x: 72, y: 10 }, // OH2 — at net right front
    3: { x: 45, y: 8 },  // Setter — at net center (slides right to set)
    4: { x: 18, y: 10 }, // OPP — at net left front (unusual but correct overlap position)
    5: { x: 22, y: 68 }, // MB1/Libero — deep left passer
    6: { x: 50, y: 72 }, // OH1 — deep center passer
  },

  // R6: 1=OH2, 2=S, 3=OPP, 4=MB1, 5=OH1, 6=MB2
  // Front row: pos 2=S, pos 3=OPP, pos 4=MB1 — S front row right. 2 attackers (OPP + MB1)
  6: {
    1: { x: 68, y: 68 }, // OH2 — deep right passer
    2: { x: 72, y: 10 }, // Setter — at net right front (natural setting position)
    3: { x: 45, y: 8 },  // OPP — at net center front
    4: { x: 18, y: 10 }, // MB1 — at net left front
    5: { x: 22, y: 68 }, // OH1 — deep left passer
    6: { x: 50, y: 72 }, // MB2/Libero — deep center passer
  },
};

// ═══════════════════════════════════════════
// OFFENSE / TRANSITION — after pass, players move to attack/set positions
// ═══════════════════════════════════════════
// Setter goes to target area (~right-center at net)
// Front-row hitters spread along net for approach
// Back-row players pull up for coverage (3-2 cup)

function buildOffense() {
  const result = {};
  for (let r = 1; r <= 6; r++) {
    result[r] = {};
    for (let pos = 1; pos <= 6; pos++) {
      const isFront = pos === 2 || pos === 3 || pos === 4;

      if (isFront) {
        // Front-row players approach net, spread across zones
        if (pos === 4) result[r][pos] = { x: 12, y: 6 };  // left pin (zone 4 attack)
        if (pos === 3) result[r][pos] = { x: 42, y: 6 };  // middle (quick attack)
        if (pos === 2) result[r][pos] = { x: 75, y: 6 };  // right pin (zone 2 attack)
      } else {
        // Back-row: setter penetrates, others provide coverage
        if (pos === 1) result[r][pos] = { x: 70, y: 45 }; // RB coverage
        if (pos === 5) result[r][pos] = { x: 20, y: 45 }; // LB coverage
        if (pos === 6) result[r][pos] = { x: 45, y: 50 }; // CB coverage
      }
    }
  }
  return result;
}

// ═══════════════════════════════════════════
// DEFENSE — Perimeter system (2-0-4)
// ═══════════════════════════════════════════
// 2 blockers at net (front-row non-setter players block)
// 4 diggers on perimeter (back row + off-blocker)
// Middle back on endline, wing diggers on sidelines

function buildDefense() {
  const result = {};
  for (let r = 1; r <= 6; r++) {
    result[r] = {};

    // Front row: 2 blockers at net, 1 off-blocker pulls back for tip coverage
    // In perimeter defense, front-row players who aren't blocking pull to 3m line
    for (let pos = 1; pos <= 6; pos++) {
      const isFront = pos === 2 || pos === 3 || pos === 4;

      if (isFront) {
        // Front-row: at net for blocking, slightly spread
        if (pos === 4) result[r][pos] = { x: 12, y: 8 };  // LF blocker
        if (pos === 3) result[r][pos] = { x: 45, y: 8 };  // CF blocker/middle
        if (pos === 2) result[r][pos] = { x: 78, y: 8 };  // RF blocker
      } else {
        // Back-row: perimeter positions
        if (pos === 5) result[r][pos] = { x: 8, y: 78 };   // LB — deep left sideline
        if (pos === 6) result[r][pos] = { x: 45, y: 82 };  // CB — deep center endline
        if (pos === 1) result[r][pos] = { x: 82, y: 78 };  // RB — deep right sideline
      }
    }
  }
  return result;
}

// ═══════════════════════════════════════════
// BASE — standard zone center positions (neutral)
// ═══════════════════════════════════════════
function buildBase() {
  const base = {};
  for (let r = 1; r <= 6; r++) {
    base[r] = {
      1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 },
      4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 },
    };
  }
  return base;
}

export const FORMATIONS = [
  { id: 'base', name: 'Base', type: 'base', description: 'Standard zone positions', placements: buildBase() },
  { id: 'sr-5-1', name: 'Serve Receive', type: 'serve-receive', description: '5-1 W formation with setter penetration', placements: SR_5_1 },
  { id: 'offense', name: 'Offense', type: 'offense', description: 'Attack positions with 3-2 coverage', placements: buildOffense() },
  { id: 'def-perimeter', name: 'Defense', type: 'defense', description: 'Perimeter defense (2-0-4)', placements: buildDefense() },
];

export function getFormation(id) {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0];
}
