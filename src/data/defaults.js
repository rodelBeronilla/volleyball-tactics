let _id = 0;
const uid = () => `p${++_id}`;

// ═══════════════════════════════════════════════════════════
// DEMO ROSTER — fictional players for a 9-person rec-league team
// ═══════════════════════════════════════════════════════════
//
// p1  Maya    — Setter. Runs the 5-1.
// p2  Jordan  — Outside hitter. Bench depth.
// p3  Sam     — Outside hitter (OH2).
// p4  Theo    — Middle blocker (MB1).
// p5  Alex    — Opposite.
// p6  Marcus  — Outside hitter (OH1), primary passer-attacker.
// p7  Priya   — Libero.
// p8  Nina    — Defensive specialist / serving sub.
// p9  Owen    — Middle blocker (MB2).

export const DEFAULT_PLAYERS = [
  { id: uid(), name: 'Maya', number: 1, position: 'setter' },
  { id: uid(), name: 'Jordan', number: 7, position: 'outside' },
  { id: uid(), name: 'Sam', number: 12, position: 'outside' },
  { id: uid(), name: 'Theo', number: 3, position: 'middle' },
  { id: uid(), name: 'Alex', number: 8, position: 'opposite' },
  { id: uid(), name: 'Marcus', number: 9, position: 'outside' },
  { id: uid(), name: 'Priya', number: 5, position: 'libero' },
  { id: uid(), name: 'Nina', number: 10, position: 'ds' },
  { id: uid(), name: 'Owen', number: 11, position: 'middle' },
];

// ═══════════════════════════════════════════════════════════
// LINEUP 1: LOCKED IN — best available 5-1
// ═══════════════════════════════════════════════════════════
//
// Slots follow the app's 5-1 template (see SLOT_ROLE_MAP in strategyData.js):
//   1 = S, 2 = OPP, 3 = MB1, 4 = OH1, 5 = MB2, 6 = OH2
//
// Priya (L) replaces whichever middle is in the back row.
// Bench: Jordan, Nina

export const DEFAULT_LINEUP = {
  id: 'lineup-1',
  name: 'Locked In',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '5-1',
  slots: {
    1: 'p1', // Maya (S)
    2: 'p5', // Alex (OPP)
    3: 'p4', // Theo (MB1)
    4: 'p6', // Marcus (OH1)
    5: 'p9', // Owen (MB2)
    6: 'p3', // Sam (OH2)
  },
  liberoId: 'p7', // Priya
};

// ═══════════════════════════════════════════════════════════
// LINEUP 2: GROW — development / balanced minutes
// ═══════════════════════════════════════════════════════════
//
// Bench players rotate in. Sam takes OH1 for more attacking reps,
// Marcus covers the right side, Jordan gets court time at OH2.

export const DEFAULT_LINEUP_GROW = {
  id: 'lineup-2',
  name: 'Grow',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '5-1',
  slots: {
    1: 'p1', // Maya (S)
    2: 'p6', // Marcus (OPP)
    3: 'p4', // Theo (MB1)
    4: 'p3', // Sam (OH1)
    5: 'p9', // Owen (MB2)
    6: 'p2', // Jordan (OH2)
  },
  liberoId: 'p7', // Priya
};

// ═══════════════════════════════════════════════════════════
// LINEUP 3: FLOW — 4-2 with rolling subs
// ═══════════════════════════════════════════════════════════
//
// Players are grouped by role; after each sideout the player who just
// served subs out for the next bench player in their group.
//   Setters:  Maya, Priya, Nina
//   Hitters:  Marcus, Sam, Alex, Jordan
//   Middles:  Theo, Owen
//
// 4-2 starting lineup:
//   Slot 1 ←→ Slot 4  (Maya(S1)   ←→ Priya(S2))
//   Slot 2 ←→ Slot 5  (Marcus(H1) ←→ Sam(H2))
//   Slot 3 ←→ Slot 6  (Theo(M1)   ←→ Owen(M2))

export const DEFAULT_LINEUP_FLOW = {
  id: 'lineup-3',
  name: 'Flow',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '4-2',
  slots: {
    1: 'p1', // Maya (S1)
    2: 'p6', // Marcus (H1)
    3: 'p4', // Theo (M1)
    4: 'p7', // Priya (S2)
    5: 'p3', // Sam (H2)
    6: 'p9', // Owen (M2)
  },
  liberoId: null,
};
