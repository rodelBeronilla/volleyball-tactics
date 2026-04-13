let _id = 0;
const uid = () => `p${++_id}`;

// ═══════════════════════════════════════════════════════════
// 8-PLAYER ACTIVE ROSTER (Alistair out — injury, rest of season)
// ═══════════════════════════════════════════════════════════
//
// p1  Jill      — Setter / Floor General. Best passer (F). Clutch. The engine.
// p2  Alistair  — OUT (injury). Keeping on roster for records.
// p3  Rodel     — Outside Hitter. Power, 2nd most athletic. Confidence-driven.
// p4  David     — Middle Blocker. 2nd best blocker, high ceiling, sloppy habits.
// p5  Jaughn    — Middle / Utility. High energy, hustle, surprisingly solid passer.
// p6  Bryan     — Outside / Opposite. Best blocker, most athletic, most well-rounded M.
// p7  Aiyana    — Libero / DS. Best female defender, solid passer, rusty setter hands.
// p8  Rochelle  — DS / Utility. Reliable server, solid on easy balls, defers on tough ones.
// p9  Hari      — Middle / Developmental. Most raw, persistence, height for blocking.
//
// Without Alistair: Bryan becomes the primary attacker.
// Bryan moves to OH1 (primary hitter) in competitive lineups.
// Rodel stays OH2. Need to fill OPP — Jaughn is the most flexible option.
// 8 players: everyone plays, paired LOCKED IN + GROW per match.

export const DEFAULT_PLAYERS = [
  { id: uid(), name: 'Jill', number: 1, position: 'setter' },
  { id: uid(), name: 'Alistair', number: 7, position: 'outside' },   // injured — bench
  { id: uid(), name: 'Rodel', number: 12, position: 'outside' },
  { id: uid(), name: 'David', number: 3, position: 'middle' },
  { id: uid(), name: 'Jaughn', number: 8, position: 'middle' },
  { id: uid(), name: 'Bryan', number: 9, position: 'outside' },      // moved to OH1
  { id: uid(), name: 'Aiyana', number: 5, position: 'libero' },
  { id: uid(), name: 'Rochelle', number: 10, position: 'ds' },
  { id: uid(), name: 'Hari', number: 11, position: 'middle' },
];

// ═══════════════════════════════════════════════════════════
// LINEUP 1: LOCKED IN — Best available 5-1 (no Alistair)
// ═══════════════════════════════════════════════════════════
//
// Bryan is now the primary hitter AND best passer. He takes OH1.
// Rodel stays OH2 — gets more hitting volume which fuels his confidence.
// Jaughn moves to OPP (right side) — he's flexible, goes anywhere.
//   He can hit from right side and his hustle helps transition.
// David stays MB1 — best blocking fundamentals.
// Hari gets MB2 — gets reps, height for net presence.
//
// Slot pairing (across = 3 apart):
//   Slot 1 ←→ Slot 4  (Jill(S) ←→ Bryan(OH1))
//   Slot 2 ←→ Slot 5  (Jaughn(OPP) ←→ Hari(MB2))
//   Slot 3 ←→ Slot 6  (David(MB1) ←→ Rodel(OH2))
//
// R1: Front[Jaughn, David, Bryan]    Back[Jill→pen, Aiyana(for Hari), Rodel]
// R2: Front[David, Bryan, Hari]      Back[Jaughn, Rodel, Jill→pen]
// R3: Front[Bryan, Hari, Rodel]      Back[Aiyana(for David), Jill→pen, Jaughn]
// R4: Front[Hari, Rodel, Jill→dump]  Back[Bryan, Jaughn, Aiyana(for David)]
// R5: Front[Rodel, Jill→dump, Jaughn] Back[Aiyana(for Hari), David, Bryan]
// R6: Front[Jill→dump, Jaughn, David] Back[Rodel, Bryan, Aiyana(for Hari)]
//
// Bench: Rochelle (subs in for serving or defensive specialist)

export const DEFAULT_LINEUP = {
  id: 'lineup-1',
  name: 'Locked In',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '5-1',
  slots: {
    1: 'p1', // Jill (S)
    2: 'p5', // Jaughn (OPP)
    3: 'p4', // David (MB1)
    4: 'p6', // Bryan (OH1 — now primary hitter)
    5: 'p9', // Hari (MB2 — gets reps)
    6: 'p3', // Rodel (OH2)
  },
  liberoId: 'p7', // Aiyana
};

// ═══════════════════════════════════════════════════════════
// LINEUP 2: GROW — Development / Balanced minutes
// ═══════════════════════════════════════════════════════════
//
// Same core but swap some players to balance minutes.
// Bryan stays (team needs him without Alistair).
// Rochelle gets court time. Hari stays for development.
// Rodel gets primary attacker role to build confidence.
//
// Slot pairing:
//   Slot 1 ←→ Slot 4  (Jill(S) ←→ Rodel(OH1 — primary reps))
//   Slot 2 ←→ Slot 5  (Bryan(OPP — right side) ←→ Hari(MB2))
//   Slot 3 ←→ Slot 6  (David(MB1) ←→ Rochelle(OH2 — sheltered))
//
// Jaughn rests this set. Aiyana rests (no libero — Rochelle covers DS).

export const DEFAULT_LINEUP_GROW = {
  id: 'lineup-2',
  name: 'Grow',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '5-1',
  slots: {
    1: 'p1', // Jill (S)
    2: 'p6', // Bryan (OPP — anchor)
    3: 'p4', // David (MB1)
    4: 'p3', // Rodel (OH1 — confidence building)
    5: 'p9', // Hari (MB2 — development)
    6: 'p8', // Rochelle (OH2 — gets court time, safe serve)
  },
  liberoId: 'p7', // Aiyana still in — helps shore up back row
};

// ═══════════════════════════════════════════════════════════
// LINEUP 3: FLOW — 4-2 Trio Rotation (all 8 active players cycle)
// ═══════════════════════════════════════════════════════════
//
// Without Alistair, trios reorganize:
//   Setters:  Jill, Aiyana, Rochelle
//   Hitters:  Bryan, Rodel (only 2 — no 3rd hitter, so this trio
//             doesn't sub, or Jaughn flexes in as 3rd)
//   Middles:  David, Jaughn, Hari
//
// 4-2 starting lineup:
//   Slot 1 ←→ Slot 4  (Jill(S1) ←→ Aiyana(S2))
//   Slot 2 ←→ Slot 5  (Bryan(H1) ←→ Rodel(H2))
//   Slot 3 ←→ Slot 6  (David(M1) ←→ Jaughn(M2))
//
// Bench: Rochelle (setter trio), Hari (middle trio)
// Sub after sideout: server's trio bench player comes in.

export const DEFAULT_LINEUP_FLOW = {
  id: 'lineup-3',
  name: 'Flow',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '4-2',
  slots: {
    1: 'p1', // Jill (S1)
    2: 'p6', // Bryan (H1)
    3: 'p4', // David (M1)
    4: 'p7', // Aiyana (S2)
    5: 'p3', // Rodel (H2)
    6: 'p5', // Jaughn (M2)
  },
  liberoId: null,
};
