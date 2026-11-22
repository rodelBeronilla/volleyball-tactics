import { describe, expect, it } from 'vitest';
import { deriveRotation, isBackRow, isFrontRow } from '../utils/rotations';

const BASE = { 1: 'S', 2: 'OH1', 3: 'MB1', 4: 'OPP', 5: 'OH2', 6: 'MB2' };

describe('deriveRotation', () => {
  it('returns the base lineup for rotation 1', () => {
    expect(deriveRotation(BASE, 1)).toEqual(BASE);
  });

  it('moves the player from position 2 into the serving position on each rotation', () => {
    expect(deriveRotation(BASE, 2)).toEqual({ 1: 'OH1', 2: 'MB1', 3: 'OPP', 4: 'OH2', 5: 'MB2', 6: 'S' });
  });

  it('gives every player exactly one turn at serve across six rotations', () => {
    const servers = [1, 2, 3, 4, 5, 6].map(r => deriveRotation(BASE, r)[1]);
    expect(new Set(servers)).toEqual(new Set(Object.values(BASE)));
  });

  it('keeps all six players on court in every rotation', () => {
    for (let r = 1; r <= 6; r++) {
      expect(Object.values(deriveRotation(BASE, r)).sort()).toEqual(Object.values(BASE).sort());
    }
  });
});

describe('row helpers', () => {
  it('splits positions into front (2-4) and back (1, 5, 6) rows', () => {
    expect([1, 2, 3, 4, 5, 6].filter(isFrontRow)).toEqual([2, 3, 4]);
    expect([1, 2, 3, 4, 5, 6].filter(isBackRow)).toEqual([1, 5, 6]);
  });
});
