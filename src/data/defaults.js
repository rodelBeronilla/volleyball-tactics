let _id = 0;
const uid = () => `p${++_id}`;

export const DEFAULT_PLAYERS = [
  { id: uid(), name: 'Setter', number: 1, position: 'setter' },
  { id: uid(), name: 'Outside 1', number: 7, position: 'outside' },
  { id: uid(), name: 'Outside 2', number: 12, position: 'outside' },
  { id: uid(), name: 'Middle 1', number: 3, position: 'middle' },
  { id: uid(), name: 'Middle 2', number: 8, position: 'middle' },
  { id: uid(), name: 'Opposite', number: 9, position: 'opposite' },
  { id: uid(), name: 'Libero', number: 5, position: 'libero' },
];

export const DEFAULT_LINEUP = {
  id: 'lineup-1',
  name: 'Starting 6',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  system: '5-1',
  // Rotation 1: Setter at pos 1
  slots: {
    1: 'p1', // Setter
    2: 'p6', // Opposite
    3: 'p4', // Middle 1
    4: 'p2', // Outside 1
    5: 'p5', // Middle 2
    6: 'p3', // Outside 2
  },
  liberoId: 'p7',
};
