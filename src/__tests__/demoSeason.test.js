/**
 * Data-quality checks on the simulated season. These are the same invariants
 * a real ingest of rally-by-rally data should satisfy.
 */
import { describe, expect, it } from 'vitest';
import { buildDemoSeason } from '../data/demoSeason';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW } from '../data/defaults';
import { STATS } from '../data/statCategories';
import { deriveRotation } from '../utils/rotations';

const LINEUPS = [DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW];
const season = buildDemoSeason(DEFAULT_PLAYERS, LINEUPS);
const { matches, rallies, statEntries } = season;
const playerIds = new Set(DEFAULT_PLAYERS.map(p => p.id));

describe('demo season', () => {
  it('is deterministic for a given seed', () => {
    expect(buildDemoSeason(DEFAULT_PLAYERS, LINEUPS)).toEqual(season);
    expect(buildDemoSeason(DEFAULT_PLAYERS, LINEUPS, 7)).not.toEqual(season);
  });

  it('has unique ids', () => {
    expect(new Set(matches.map(m => m.id)).size).toBe(matches.length);
    expect(new Set(rallies.map(r => r.id)).size).toBe(rallies.length);
    expect(new Set(statEntries.map(e => e.id)).size).toBe(statEntries.length);
  });

  it('only references known players, stats, matches and rallies', () => {
    const matchIds = new Set(matches.map(m => m.id));
    const rallyIds = new Set(rallies.map(r => r.id));
    for (const e of statEntries) {
      expect(e.playerId === '__team__' || playerIds.has(e.playerId)).toBe(true);
      expect(STATS).toHaveProperty(e.stat);
      expect(matchIds.has(e.matchId)).toBe(true);
      expect(rallyIds.has(e.rallyId)).toBe(true);
      expect(e.rotation).toBeGreaterThanOrEqual(1);
      expect(e.rotation).toBeLessThanOrEqual(6);
    }
  });

  it('records final set scores that follow rally-scoring rules', () => {
    for (const m of matches) {
      for (const s of m.sets) {
        const hi = Math.max(s.ourScore, s.theirScore);
        const lo = Math.min(s.ourScore, s.theirScore);
        expect(hi).toBeGreaterThanOrEqual(25);
        expect(hi - lo).toBeGreaterThanOrEqual(2);
        if (hi > 25) expect(hi - lo).toBe(2);
        expect(s.won).toBe(s.ourScore > s.theirScore);
      }
    }
  });

  it('reconciles rally outcomes with the recorded set scores', () => {
    for (const m of matches) {
      for (const s of m.sets) {
        const setRallies = rallies.filter(r => r.matchId === m.id && r.setNumber === s.number);
        expect(setRallies.filter(r => r.outcome === 'won').length).toBe(s.ourScore);
        expect(setRallies.filter(r => r.outcome === 'lost').length).toBe(s.theirScore);
        // running score is continuous: each rally starts where the last one ended
        setRallies.forEach((r, i) => {
          const prev = setRallies[i - 1];
          const expected = prev
            ? [prev.ourScore + (prev.outcome === 'won'), prev.theirScore + (prev.outcome === 'lost')]
            : [0, 0];
          expect([r.ourScore, r.theirScore]).toEqual(expected);
        });
      }
    }
  });

  it('writes exactly one team outcome row per rally, matching the rally', () => {
    const outcomes = statEntries.filter(e => e.playerId === '__team__');
    expect(outcomes.length).toBe(rallies.length);
    const byRally = Object.fromEntries(rallies.map(r => [r.id, r]));
    for (const e of outcomes) {
      expect(e.stat).toBe(byRally[e.rallyId].outcome === 'won' ? 'rallyWon' : 'rallyLost');
    }
  });

  it('only lets the player in position 1 serve', () => {
    const byRally = Object.fromEntries(rallies.map(r => [r.id, r]));
    const lineupOf = Object.fromEntries(matches.map(m => [m.id, LINEUPS.find(l => l.id === m.lineupId)]));
    for (const e of statEntries.filter(e => ['ace', 'serviceError', 'serveInPlay'].includes(e.stat))) {
      const r = byRally[e.rallyId];
      expect(r.servingTeam).toBe('us');
      expect(deriveRotation(lineupOf[e.matchId].slots, r.rotation)[1]).toBe(e.playerId);
    }
  });

  it('credits the setter with an assist on every kill', () => {
    const kills = new Set(['kill', 'attackTip', 'attackTooled']);
    for (const r of rallies) {
      const nKills = r.actions.filter(a => kills.has(a.stat)).length;
      const nAssists = r.actions.filter(a => a.stat === 'assist').length;
      expect(nAssists).toBe(nKills);
    }
  });
});
