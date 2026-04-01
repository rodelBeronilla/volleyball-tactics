/**
 * Formation placement data.
 * Each formation defines physical court positions (x, y in viewBox 0-90)
 * for each rotational slot (1-6) across all 6 rotations.
 *
 * Court: net at y=0, end line at y=90. Left x=0, right x=90.
 */

// 5-1 Serve Receive (W formation)
// Setter penetrates from back row; 3 front-row attackers when setter is back row
const SR_5_1 = {
  1: { // R1: Setter at pos 1 (RB) — penetrates to RF
    1: { x: 80, y: 50 }, // Setter cheats forward-right
    2: { x: 70, y: 12 }, // OPP at net RF
    3: { x: 45, y: 10 }, // MB at net CF
    4: { x: 20, y: 12 }, // OH at net LF
    5: { x: 20, y: 70 }, // OH2 deep left (passer)
    6: { x: 50, y: 75 }, // MB2/Libero deep center (passer)
  },
  2: { // R2: Setter at pos 6 (CB) — penetrates to RF
    1: { x: 70, y: 70 }, // OH deep right (passer)
    2: { x: 75, y: 12 }, // OPP RF at net
    3: { x: 45, y: 10 }, // OH2 CF at net
    4: { x: 15, y: 12 }, // MB LF at net
    5: { x: 15, y: 55 }, // MB2/Libero left back (passer)
    6: { x: 55, y: 50 }, // Setter cheats right from CB
  },
  3: { // R3: Setter at pos 5 (LB) — penetrates to RF
    1: { x: 70, y: 70 }, // MB2/Libero deep right (passer)
    2: { x: 75, y: 12 }, // OH RF at net
    3: { x: 45, y: 10 }, // OPP CF at net
    4: { x: 15, y: 12 }, // OH2 LF at net
    5: { x: 20, y: 50 }, // Setter cheats from LB
    6: { x: 50, y: 75 }, // MB deep center (passer)
  },
  4: { // R4: Setter at pos 4 (LF) — front row, sets from left
    1: { x: 70, y: 70 }, // OH deep right (passer)
    2: { x: 75, y: 12 }, // MB RF at net
    3: { x: 55, y: 10 }, // MB2/Libero n/a — OH2 CF at net
    4: { x: 20, y: 12 }, // Setter LF at net
    5: { x: 20, y: 70 }, // OPP deep left (passer)
    6: { x: 50, y: 75 }, // OH2 deep center (passer)
  },
  5: { // R5: Setter at pos 3 (CF) — front row center
    1: { x: 70, y: 70 }, // OH2 deep right (passer)
    2: { x: 75, y: 12 }, // OH RF at net
    3: { x: 45, y: 10 }, // Setter CF at net
    4: { x: 15, y: 12 }, // MB LF at net
    5: { x: 20, y: 70 }, // MB2/Libero deep left (passer)
    6: { x: 50, y: 75 }, // OPP deep center (passer)
  },
  6: { // R6: Setter at pos 2 (RF) — front row right, sets from right
    1: { x: 70, y: 70 }, // MB2/Libero deep right (passer)
    2: { x: 75, y: 12 }, // Setter RF at net
    3: { x: 45, y: 10 }, // OH CF at net
    4: { x: 15, y: 12 }, // OH2 LF at net
    5: { x: 20, y: 70 }, // OPP deep left (passer)
    6: { x: 50, y: 75 }, // MB deep center (passer)
  },
};

// Base positions (no formation — just zone centers)
const BASE = {
  1: { 1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 }, 4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 } },
  2: { 1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 }, 4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 } },
  3: { 1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 }, 4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 } },
  4: { 1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 }, 4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 } },
  5: { 1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 }, 4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 } },
  6: { 1: { x: 75, y: 60 }, 2: { x: 75, y: 15 }, 3: { x: 45, y: 15 }, 4: { x: 15, y: 15 }, 5: { x: 15, y: 60 }, 6: { x: 45, y: 60 } },
};

// Defensive: Perimeter
const DEF_PERIMETER = {
  1: { 1: { x: 80, y: 80 }, 2: { x: 80, y: 10 }, 3: { x: 45, y: 10 }, 4: { x: 10, y: 10 }, 5: { x: 10, y: 80 }, 6: { x: 45, y: 55 } },
  2: { 1: { x: 80, y: 80 }, 2: { x: 80, y: 10 }, 3: { x: 45, y: 10 }, 4: { x: 10, y: 10 }, 5: { x: 10, y: 80 }, 6: { x: 45, y: 55 } },
  3: { 1: { x: 80, y: 80 }, 2: { x: 80, y: 10 }, 3: { x: 45, y: 10 }, 4: { x: 10, y: 10 }, 5: { x: 10, y: 80 }, 6: { x: 45, y: 55 } },
  4: { 1: { x: 80, y: 80 }, 2: { x: 80, y: 10 }, 3: { x: 45, y: 10 }, 4: { x: 10, y: 10 }, 5: { x: 10, y: 80 }, 6: { x: 45, y: 55 } },
  5: { 1: { x: 80, y: 80 }, 2: { x: 80, y: 10 }, 3: { x: 45, y: 10 }, 4: { x: 10, y: 10 }, 5: { x: 10, y: 80 }, 6: { x: 45, y: 55 } },
  6: { 1: { x: 80, y: 80 }, 2: { x: 80, y: 10 }, 3: { x: 45, y: 10 }, 4: { x: 10, y: 10 }, 5: { x: 10, y: 80 }, 6: { x: 45, y: 55 } },
};

export const FORMATIONS = [
  { id: 'base', name: 'Base', type: 'base', description: 'Standard zone positions', placements: BASE },
  { id: 'sr-5-1', name: '5-1 Serve Receive', type: 'serve-receive', description: 'W formation, setter penetrates', placements: SR_5_1 },
  { id: 'def-perimeter', name: 'Perimeter Defense', type: 'defense', description: 'Players deep at court boundaries', placements: DEF_PERIMETER },
];

export function getFormation(id) {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0];
}
