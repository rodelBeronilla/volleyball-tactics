import { describe, expect, it } from 'vitest';
import { checkOverlapLegality } from '../utils/overlap';

// A textbook legal base: front row at the net, back row deep, left to right 4-3-2 / 5-6-1
const LEGAL = [
  { rotationalPosition: 4, x: 15, y: 10 },
  { rotationalPosition: 3, x: 45, y: 10 },
  { rotationalPosition: 2, x: 75, y: 10 },
  { rotationalPosition: 5, x: 15, y: 60 },
  { rotationalPosition: 6, x: 45, y: 60 },
  { rotationalPosition: 1, x: 75, y: 60 },
];

const move = (pos, coords) =>
  LEGAL.map(p => (p.rotationalPosition === pos ? { ...p, ...coords } : p));

describe('checkOverlapLegality', () => {
  it('accepts a standard base alignment', () => {
    expect(checkOverlapLegality(LEGAL)).toEqual([]);
  });

  it('flags a back-row player who is closer to the net than their front-row partner', () => {
    const v = checkOverlapLegality(move(6, { y: 5 }));
    expect(v).toContainEqual(expect.objectContaining({ rule: 'front-back', pos1: 3, pos2: 6 }));
  });

  it('flags a left-right overlap in the front row', () => {
    const v = checkOverlapLegality(move(4, { x: 50 }));
    expect(v).toContainEqual(expect.objectContaining({ rule: 'left-right', pos1: 4, pos2: 3 }));
  });

  it('flags a left-right overlap in the back row', () => {
    const v = checkOverlapLegality(move(1, { x: 40 }));
    expect(v).toContainEqual(expect.objectContaining({ rule: 'left-right', pos1: 6, pos2: 1 }));
  });
});
