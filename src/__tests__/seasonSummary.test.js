import { describe, expect, it } from 'vitest';
import { buildDemoSeason } from '../data/demoSeason';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW } from '../data/defaults';
import { seasonSummary, matchRows, hitFmt } from '../utils/seasonSummary';

const { matches, rallies, statEntries } = buildDemoSeason(
  DEFAULT_PLAYERS, [DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW],
);
const summary = seasonSummary(matches, rallies, statEntries);
const rows = matchRows(matches, rallies, statEntries);

describe('seasonSummary', () => {
  it('reconciles the record with the match list', () => {
    expect(summary.wins + summary.losses).toBe(summary.matchesPlayed);
    expect(summary.matchesPlayed).toBe(matches.length);
    expect(summary.setsWon + summary.setsLost).toBe(matches.reduce((n, m) => n + m.sets.length, 0));
  });

  it('weights season side-out % by rallies, consistent with the per-match rows', () => {
    const received = rallies.filter(r => r.servingTeam === 'them');
    expect(summary.sideOutRate).toBeCloseTo(received.filter(r => r.outcome === 'won').length / received.length);
    for (const row of rows) {
      expect(row.sideOutRate).toBeGreaterThan(0);
      expect(row.sideOutRate).toBeLessThan(1);
    }
  });

  it('picks the rotation with the best side-out rate', () => {
    expect(summary.bestRotation.rotation).toBeGreaterThanOrEqual(1);
    expect(summary.bestRotation.rotation).toBeLessThanOrEqual(6);
    expect(summary.bestRotation.rate).toBeGreaterThanOrEqual(summary.sideOutRate);
  });

  it('keeps team hitting % in a plausible range', () => {
    expect(summary.hitPct).toBeGreaterThan(-0.1);
    expect(summary.hitPct).toBeLessThan(0.5);
  });
});

describe('matchRows', () => {
  it('lists every match, newest first', () => {
    expect(rows).toHaveLength(matches.length);
    const dates = rows.map(r => r.match.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('adds up to the season kill total', () => {
    const killStats = new Set(['kill', 'attackTip', 'attackTooled']);
    const kills = statEntries.filter(e => killStats.has(e.stat)).length;
    expect(rows.reduce((n, r) => n + r.kills, 0)).toBe(kills);
  });
});

describe('hitFmt', () => {
  it('writes hitting % the box-score way', () => {
    expect(hitFmt(0.3125)).toBe('.313');
    expect(hitFmt(-0.05)).toBe('-.050');
    expect(hitFmt(null)).toBe('—');
  });
});
