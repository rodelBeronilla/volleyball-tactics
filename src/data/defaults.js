let _id = 0;
const uid = () => `p${++_id}`;

// Actual team roster — optimized role assignments:
//
// Setter: Jill (all-round, consistent, the engine)
// Outside 1: Alistair (perfectionist power hitter, best attacker + passer)
// Outside 2: Rodel (power hitter, loves hitting, confidence-driven)
// Opposite: Bryan (most athletic, best blocker, versatile — right side)
// Middle 1: David (pure middle, decent blocker, high ceiling)
// Middle 2: Jaughn (high energy, hustle, developing)
// Libero: Aiyana (bump setter, defensive instincts, back-row specialist)
//
// Bench: Rochelle (solid receiver, safe serve), Hari (raw beginner, developing)

export const DEFAULT_PLAYERS = [
  { id: uid(), name: 'Jill', number: 1, position: 'setter' },
  { id: uid(), name: 'Alistair', number: 7, position: 'outside' },
  { id: uid(), name: 'Rodel', number: 12, position: 'outside' },
  { id: uid(), name: 'David', number: 3, position: 'middle' },
  { id: uid(), name: 'Jaughn', number: 8, position: 'middle' },
  { id: uid(), name: 'Bryan', number: 9, position: 'opposite' },
  { id: uid(), name: 'Aiyana', number: 5, position: 'libero' },
  { id: uid(), name: 'Rochelle', number: 10, position: 'ds' },
  { id: uid(), name: 'Hari', number: 11, position: 'middle' },
];

// LOCKED IN lineup — best 6 + libero
// Standard 5-1 slot order (opposite positions across from each other):
//   Slot 1: Setter (Jill)
//   Slot 2: Opposite (Bryan) — across from setter
//   Slot 3: Middle 1 (David)
//   Slot 4: Outside 1 (Alistair) — across from opposite
//   Slot 5: Middle 2 (Jaughn) — across from middle 1
//   Slot 6: Outside 2 (Rodel) — across from setter pair
export const DEFAULT_LINEUP = {
  id: 'lineup-1',
  name: 'Locked In',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '5-1',
  slots: {
    1: 'p1', // Jill (S)
    2: 'p6', // Bryan (OPP)
    3: 'p4', // David (MB1)
    4: 'p2', // Alistair (OH1)
    5: 'p5', // Jaughn (MB2)
    6: 'p3', // Rodel (OH2)
  },
  liberoId: 'p7', // Aiyana
};
