import { describe, expect, it } from 'vitest';
import { aggregateByPlayer, computeStatLine } from '../utils/statAggregation';

const entry = (playerId, stat, extra = {}) => ({ playerId, stat, matchId: 'm1', setNumber: 1, rotation: 1, ...extra });

describe('aggregateByPlayer', () => {
  it('counts events per player and stat', () => {
    const counts = aggregateByPlayer([
      entry('a', 'kill'), entry('a', 'kill'), entry('a', 'attackError'), entry('b', 'dig'),
    ]);
    expect(counts.a.kill).toBe(2);
    expect(counts.a.attackError).toBe(1);
    expect(counts.b.dig).toBe(1);
    expect(counts.b.kill).toBe(0);
  });

  it('applies match, set and rotation filters', () => {
    const entries = [
      entry('a', 'kill'),
      entry('a', 'kill', { setNumber: 2 }),
      entry('a', 'kill', { rotation: 3 }),
      entry('a', 'kill', { matchId: 'm2' }),
    ];
    expect(aggregateByPlayer(entries, { setNumber: 2 }).a.kill).toBe(1);
    expect(aggregateByPlayer(entries, { rotation: 3 }).a.kill).toBe(1);
    expect(aggregateByPlayer(entries, { matchId: 'm1' }).a.kill).toBe(3);
  });

  it('merges compacted summary rows with raw events', () => {
    const counts = aggregateByPlayer([
      { type: 'summary', playerId: 'a', matchId: 'm0', counts: { kill: 5, ace: 2 } },
      entry('a', 'kill'),
    ]);
    expect(counts.a.kill).toBe(6);
    expect(counts.a.ace).toBe(2);
  });

  it('ignores unknown stat keys instead of inventing columns', () => {
    const counts = aggregateByPlayer([entry('a', 'notAStat')]);
    expect(counts.a.notAStat).toBeUndefined();
  });
});

describe('computeStatLine', () => {
  it('computes hitting % as (kills - errors - blocked) / attempts', () => {
    // 5 kills, 1 error, 1 blocked, 3 kept in play → (5 - 2) / 10
    const line = computeStatLine({ kill: 4, attackTip: 1, attackError: 1, attackBlocked: 1, attackAttempt: 3 });
    expect(line.totalKills).toBe(5);
    expect(line.attackAttempts).toBe(10);
    expect(line.hitPct).toBeCloseTo(0.3);
  });

  it('computes a 0-3 passing average', () => {
    const line = computeStatLine({ passPerfect: 2, passGood: 1, passPoor: 1, passError: 0 });
    expect(line.passAvg).toBeCloseTo((3 * 2 + 2 + 1) / 4);
  });

  it('returns null rates when there are no attempts', () => {
    const line = computeStatLine({});
    expect(line.hitPct).toBeNull();
    expect(line.passAvg).toBeNull();
    expect(line.winRate).toBeNull();
  });

  it('normalises per-set numbers by sets played', () => {
    const line = computeStatLine({ dig: 9, blockSolo: 2, blockAssist: 1 }, 3);
    expect(line.digsPerSet).toBe(3);
    expect(line.blocksPerSet).toBe(1);
  });
});
