/**
 * Team-level season and per-match numbers derived from the event log.
 */
import { aggregateByPlayer, computeStatLine } from './statAggregation';
import { STAT_KEYS } from '../data/statCategories';

const TEAM = '__team__';

/** Sum every player's counts (team outcome rows excluded) into one team stat line. */
function teamLine(entries, sets) {
  const byPlayer = aggregateByPlayer(entries.filter(e => e.playerId !== TEAM));
  const counts = Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
  for (const c of Object.values(byPlayer)) for (const k of STAT_KEYS) counts[k] += c[k];
  return computeStatLine(counts, sets);
}

/** Side-out % (points won on their serve) and break-point % (points won on our serve). */
function serveSplits(rallies) {
  const split = (team) => {
    const rs = rallies.filter(r => r.servingTeam === team);
    return rs.length ? rs.filter(r => r.outcome === 'won').length / rs.length : null;
  };
  return { sideOutRate: split('them'), breakPointRate: split('us'), rallies: rallies.length };
}

export function matchResult(match) {
  const setsWon = match.sets.filter(s => s.won === true).length;
  const setsLost = match.sets.filter(s => s.won === false).length;
  return { setsWon, setsLost, won: match.completed ? setsWon > setsLost : null };
}

/** One row per match: result plus team hitting %, side-out % and break-point %. */
export function matchRows(matches, rallies, statEntries) {
  return [...matches]
    .sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''))
    .map(m => {
      const entries = statEntries.filter(e => e.matchId === m.id);
      const line = teamLine(entries, m.sets.length);
      return {
        match: m,
        ...matchResult(m),
        ...serveSplits(rallies.filter(r => r.matchId === m.id)),
        hitPct: line.hitPct,
        kills: line.totalKills,
        aces: line.ace || 0,
        blocks: line.totalBlocks,
      };
    });
}

/** Whole-season headline numbers. */
export function seasonSummary(matches, rallies, statEntries) {
  const completed = matches.filter(m => m.completed);
  const results = completed.map(matchResult);
  const sets = matches.reduce((n, m) => n + m.sets.length, 0);
  const line = teamLine(statEntries, sets);

  // Best rotation by side-out rate (the receiving rotations are where matches are won)
  let bestRotation = null;
  for (let r = 1; r <= 6; r++) {
    const rate = serveSplits(rallies.filter(x => x.rotation === r)).sideOutRate;
    if (rate !== null && (!bestRotation || rate > bestRotation.rate)) bestRotation = { rotation: r, rate };
  }

  return {
    matchesPlayed: completed.length,
    wins: results.filter(r => r.won).length,
    losses: results.filter(r => r.won === false).length,
    setsWon: results.reduce((n, r) => n + r.setsWon, 0),
    setsLost: results.reduce((n, r) => n + r.setsLost, 0),
    ...serveSplits(rallies),
    hitPct: line.hitPct,
    passAvg: line.passAvg,
    killsPerSet: line.killsPerSet,
    acesPerSet: (line.ace || 0) / Math.max(1, sets),
    blocksPerSet: line.blocksPerSet,
    events: statEntries.length,
    bestRotation,
  };
}

export const pct = (v, digits = 0) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(digits)}%`);
/** Hitting percentage is conventionally written as .312 */
export const hitFmt = v => (v === null || v === undefined ? '—' : (v < 0 ? '-' : '') + Math.abs(v).toFixed(3).replace(/^0/, ''));
