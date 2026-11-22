/**
 * Compaction rolls old matches up into per-player/per-rotation summary rows.
 * It must not change any number the app reports.
 */
import { describe, expect, it } from 'vitest';
import { buildDemoSeason } from '../data/demoSeason';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW } from '../data/defaults';
import { compactOldEntries } from '../utils/storageManager';
import { aggregateByPlayer, aggregateByRotation } from '../utils/statAggregation';
import { computeFullProfile } from '../utils/playerProfileEngine';

const { matches, statEntries } = buildDemoSeason(
  DEFAULT_PLAYERS, [DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW],
);
const compacted = compactOldEntries(statEntries, matches, 2);

describe('compactOldEntries', () => {
  it('shrinks the event log', () => {
    expect(compacted.length).toBeLessThan(statEntries.length / 2);
    expect(compacted.some(e => e.type === 'summary')).toBe(true);
  });

  it('preserves per-player totals', () => {
    expect(aggregateByPlayer(compacted)).toEqual(aggregateByPlayer(statEntries));
  });

  it('preserves per-rotation totals', () => {
    expect(aggregateByRotation(compacted)).toEqual(aggregateByRotation(statEntries));
  });

  it('leaves player ratings unchanged', () => {
    for (const p of DEFAULT_PLAYERS) {
      const raw = computeFullProfile(p, statEntries, matches);
      const rolled = computeFullProfile(p, compacted, matches);
      expect(rolled.effectiveRatings).toEqual(raw.effectiveRatings);
    }
  });
});
