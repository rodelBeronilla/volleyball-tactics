/**
 * Advanced stat analysis — match history, rotation team stats, momentum, pressure performance.
 */

import { aggregateByPlayer, computeStatLine, countSetsPlayed } from './statAggregation';
import { STAT_KEYS } from '../data/statCategories';

/**
 * Get per-match stat lines for a player, sorted by date.
 */
export function getPlayerMatchHistory(statEntries, matches, playerId) {
  return matches
    .filter(m => statEntries.some(e => e.matchId === m.id && e.playerId === playerId))
    .sort((a, b) => (a.date || a.createdAt || '').localeCompare(b.date || b.createdAt || ''))
    .map(m => {
      const matchEntries = statEntries.filter(e => e.matchId === m.id && e.playerId === playerId);
      const counts = {};
      STAT_KEYS.forEach(k => { counts[k] = 0; });
      matchEntries.forEach(e => { if (e.stat in counts) counts[e.stat]++; });
      const setsPlayed = countSetsPlayed(matchEntries, playerId);
      return { matchId: m.id, opponent: m.opponent, date: m.date, statLine: computeStatLine(counts, setsPlayed), setsPlayed };
    });
}

/**
 * Team-level stats per rotation.
 */
export function getRotationTeamStats(statEntries) {
  const result = {};
  for (let r = 1; r <= 6; r++) {
    const rotEntries = statEntries.filter(e => e.rotation === r);
    const won = rotEntries.filter(e => e.stat === 'rallyWon').length;
    const lost = rotEntries.filter(e => e.stat === 'rallyLost').length;
    const total = won + lost;

    // Side-out rate: rallies won when receiving
    const sideOutWon = rotEntries.filter(e => e.stat === 'rallyWon' && e.servingTeam === 'them').length;
    const sideOutTotal = rotEntries.filter(e => (e.stat === 'rallyWon' || e.stat === 'rallyLost') && e.servingTeam === 'them').length;

    // Break rate: rallies won when serving
    const breakWon = rotEntries.filter(e => e.stat === 'rallyWon' && e.servingTeam === 'us').length;
    const breakTotal = rotEntries.filter(e => (e.stat === 'rallyWon' || e.stat === 'rallyLost') && e.servingTeam === 'us').length;

    // Positive stats
    const kills = rotEntries.filter(e => e.stat === 'kill' || e.stat === 'attackTip' || e.stat === 'attackTooled').length;
    const aces = rotEntries.filter(e => e.stat === 'ace').length;
    const blocks = rotEntries.filter(e => e.stat === 'blockSolo' || e.stat === 'blockAssist').length;
    const errors = rotEntries.filter(e => e.stat === 'attackError' || e.stat === 'serviceError' || e.stat === 'blockError' || e.stat === 'defenseError').length;

    result[r] = {
      ralliesWon: won,
      ralliesLost: lost,
      totalRallies: total,
      winRate: total > 0 ? won / total : null,
      sideOutRate: sideOutTotal > 0 ? sideOutWon / sideOutTotal : null,
      breakPointRate: breakTotal > 0 ? breakWon / breakTotal : null,
      kills,
      aces,
      blocks,
      errors,
      points: kills + aces + blocks, // rough point production
    };
  }
  return result;
}

/**
 * Rally-by-rally momentum for a match.
 */
export function getMatchMomentum(statEntries, matchId) {
  return statEntries
    .filter(e => e.matchId === matchId && (e.stat === 'rallyWon' || e.stat === 'rallyLost'))
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e, i) => ({
      index: i + 1,
      setNumber: e.setNumber,
      rotation: e.rotation,
      won: e.stat === 'rallyWon',
      servingTeam: e.servingTeam || null,
    }));
}

/**
 * Pressure performance — stats in close-score situations.
 * A "pressure" rally is one where both teams have 20+ points and scores are within 2.
 */
export function getPressurePerformance(statEntries, rallies, matchId) {
  // Find pressure rallies
  const pressureRallies = rallies
    .filter(r => r.matchId === matchId && r.ourScore >= 20 && r.theirScore >= 20 && Math.abs(r.ourScore - r.theirScore) <= 2);

  if (pressureRallies.length === 0) return null;

  const pressureRallyIds = new Set(pressureRallies.map(r => r.id));
  const pressureEntries = statEntries.filter(e => e.rallyId && pressureRallyIds.has(e.rallyId));

  const byPlayer = aggregateByPlayer(pressureEntries);
  return {
    totalPressureRallies: pressureRallies.length,
    won: pressureRallies.filter(r => r.outcome === 'won').length,
    playerStats: byPlayer,
  };
}
