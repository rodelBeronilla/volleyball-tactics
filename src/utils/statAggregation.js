/**
 * Aggregate raw stat entries into player stat lines and summaries.
 */

import { STAT_KEYS } from '../data/statCategories';

/**
 * Count stats per player from an array of stat entries.
 * Handles both individual entries and compacted summary entries.
 * @param {Array} entries - stat entry objects
 * @param {Object} [filters] - optional filters { matchId, setNumber, rotation }
 * @returns {Object} { playerId: { kill: N, ace: N, ... } }
 */
export function aggregateByPlayer(entries, filters = {}) {
  const result = {};

  for (const e of entries) {
    if (filters.matchId && e.matchId !== filters.matchId) continue;
    if (filters.setNumber && e.setNumber !== filters.setNumber) continue;
    if (filters.rotation && e.rotation !== filters.rotation) continue;

    // Handle compacted summary entries
    if (e.type === 'summary') {
      if (!result[e.playerId]) {
        result[e.playerId] = {};
        STAT_KEYS.forEach(k => { result[e.playerId][k] = 0; });
      }
      for (const [key, count] of Object.entries(e.counts)) {
        if (key in result[e.playerId]) {
          result[e.playerId][key] += count;
        }
      }
      continue;
    }

    if (!result[e.playerId]) {
      result[e.playerId] = {};
      STAT_KEYS.forEach(k => { result[e.playerId][k] = 0; });
    }
    if (e.stat in result[e.playerId]) {
      result[e.playerId][e.stat]++;
    }
  }

  return result;
}

/**
 * Group stats by rotation first, then by player within each rotation.
 * @param {Array} entries - stat entry objects
 * @param {Object} [filters] - optional filters { matchId, setNumber }
 * @returns {Object} { 1: { playerId: counts }, 2: { ... }, ... }
 */
export function aggregateByRotation(entries, filters = {}) {
  const result = {};
  for (let r = 1; r <= 6; r++) result[r] = {};

  for (const e of entries) {
    if (!e.rotation || e.rotation < 1 || e.rotation > 6) continue;
    if (filters.matchId && e.matchId !== filters.matchId) continue;
    if (filters.setNumber && e.setNumber !== filters.setNumber) continue;

    const rot = result[e.rotation];

    if (e.type === 'summary') {
      if (!rot[e.playerId]) {
        rot[e.playerId] = {};
        STAT_KEYS.forEach(k => { rot[e.playerId][k] = 0; });
      }
      for (const [key, count] of Object.entries(e.counts)) {
        if (key in rot[e.playerId]) rot[e.playerId][key] += count;
      }
      continue;
    }

    if (!rot[e.playerId]) {
      rot[e.playerId] = {};
      STAT_KEYS.forEach(k => { rot[e.playerId][k] = 0; });
    }
    if (e.stat in rot[e.playerId]) {
      rot[e.playerId][e.stat]++;
    }
  }

  return result;
}

/**
 * Compute derived stat lines from raw counts.
 * @param {Object} counts - { kill: N, attackError: N, ... }
 * @param {number} setsPlayed - number of sets for per-set calculations
 * @returns {Object} derived stats
 */
export function computeStatLine(counts, setsPlayed = 1) {
  const sets = Math.max(1, setsPlayed);
  const c = counts;

  // Attack: include tips and tooled kills
  const totalKills = (c.kill || 0) + (c.attackTip || 0) + (c.attackTooled || 0);
  // Total attempts = kills + errors + blocked + zero-kill attempts kept in play
  const attackAttempts = totalKills + (c.attackError || 0) + (c.attackBlocked || 0) + (c.attackAttempt || 0);
  const hitPct = attackAttempts > 0
    ? (totalKills - (c.attackError || 0)) / attackAttempts
    : null;

  // Attack variety
  const attackVariety = attackAttempts > 0 ? {
    swingPct: (c.kill || 0) / attackAttempts,
    tipPct: (c.attackTip || 0) / attackAttempts,
    tooledPct: (c.attackTooled || 0) / attackAttempts,
  } : null;

  // Serve: accurate total when serveInPlay is tracked
  const totalServeAttempts = (c.ace || 0) + (c.serviceError || 0) + (c.serveInPlay || 0);
  const totalServes = totalServeAttempts > 0 ? totalServeAttempts : (c.ace || 0) + (c.serviceError || 0);

  // Pass
  const totalPasses = (c.passPerfect || 0) + (c.passGood || 0) + (c.passPoor || 0) + (c.passError || 0);
  const passAvg = totalPasses > 0
    ? (3 * (c.passPerfect || 0) + 2 * (c.passGood || 0) + 1 * (c.passPoor || 0)) / totalPasses
    : null;

  // Block
  const totalBlocks = (c.blockSolo || 0) + (c.blockAssist || 0);

  // Rally-based metrics
  const totalRallies = (c.rallyWon || 0) + (c.rallyLost || 0);
  const winRate = totalRallies > 0 ? (c.rallyWon || 0) / totalRallies : null;

  return {
    ...c,
    totalKills,
    attackAttempts,
    hitPct,
    attackVariety,
    totalServes,
    totalServeAttempts,
    totalPasses,
    passAvg,
    totalBlocks,
    blocksPerSet: totalBlocks / sets,
    digsPerSet: (c.dig || 0) / sets,
    assistsPerSet: (c.assist || 0) / sets,
    killsPerSet: totalKills / sets,
    totalRallies,
    winRate,
    setsPlayed: sets,
  };
}

/**
 * Count total sets played by a player across matches.
 * @param {Array} entries - all stat entries
 * @param {string} playerId
 * @returns {number}
 */
export function countSetsPlayed(entries, playerId) {
  const setKeys = new Set();
  for (const e of entries) {
    if (e.type === 'summary') {
      if (e.playerId === playerId) setKeys.add(`${e.matchId}-s`);
      continue;
    }
    if (e.playerId === playerId) {
      setKeys.add(`${e.matchId}-${e.setNumber}`);
    }
  }
  return Math.max(1, setKeys.size);
}

/**
 * Get a full player stat summary.
 */
export function getPlayerSummary(entries, playerId) {
  const playerEntries = entries.filter(e =>
    e.type === 'summary' ? e.playerId === playerId : e.playerId === playerId
  );
  if (playerEntries.length === 0) return null;

  const counts = {};
  STAT_KEYS.forEach(k => { counts[k] = 0; });
  for (const e of playerEntries) {
    if (e.type === 'summary') {
      for (const [key, count] of Object.entries(e.counts)) {
        if (key in counts) counts[key] += count;
      }
    } else {
      if (e.stat in counts) counts[e.stat]++;
    }
  }

  const setsPlayed = countSetsPlayed(entries, playerId);
  return computeStatLine(counts, setsPlayed);
}

/**
 * Compute side-out and break point rates from rally entries.
 * @param {Array} entries - stat entries (needs rallyWon/rallyLost + rotation context)
 * @param {Object} [filters] - { matchId }
 * @returns {{ sideOutRate, breakPointRate, totalRallies }}
 */
export function computeRallyRates(entries, filters = {}) {
  // Rally outcomes are team-level stats — they don't have a specific playerId
  // but they do have rotation, which tells us if we were serving or receiving
  // In volleyball: rotation advances on side-out, so we need to infer serving team
  // from the rally entry's servingTeam field if available, or from rotation parity

  let ralliesWon = 0;
  let ralliesLost = 0;

  for (const e of entries) {
    if (filters.matchId && e.matchId !== filters.matchId) continue;
    if (e.stat === 'rallyWon') ralliesWon++;
    if (e.stat === 'rallyLost') ralliesLost++;
  }

  const total = ralliesWon + ralliesLost;
  return {
    sideOutRate: null, // requires servingTeam info from rallies
    breakPointRate: null,
    winRate: total > 0 ? ralliesWon / total : null,
    ralliesWon,
    ralliesLost,
    totalRallies: total,
  };
}

/**
 * Generate a summary for a completed set.
 * @param {Array} rallies - all rally objects
 * @param {Array} statEntries - all stat entries
 * @param {string} matchId
 * @param {number} setNumber
 * @returns {{ mvpPlayerId, worstRotation, keyStats, servingRuns }}
 */
export function generateSetSummary(rallies, statEntries, matchId, setNumber) {
  const setEntries = statEntries.filter(e => e.matchId === matchId && e.setNumber === setNumber && e.playerId !== '__team__');
  const setRallies = rallies.filter(r => r.matchId === matchId && r.setNumber === setNumber);

  // Player impact: kills + aces + blocks - errors
  const playerImpact = {};
  for (const e of setEntries) {
    if (!playerImpact[e.playerId]) playerImpact[e.playerId] = 0;
    if (e.stat === 'kill' || e.stat === 'attackTip' || e.stat === 'attackTooled') playerImpact[e.playerId]++;
    if (e.stat === 'ace') playerImpact[e.playerId]++;
    if (e.stat === 'blockSolo' || e.stat === 'blockAssist') playerImpact[e.playerId]++;
    if (e.stat === 'attackError' || e.stat === 'serviceError' || e.stat === 'passError') playerImpact[e.playerId]--;
  }

  const mvpPlayerId = Object.entries(playerImpact).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Worst rotation by win rate
  const rotStats = {};
  for (const r of setRallies) {
    if (!rotStats[r.rotation]) rotStats[r.rotation] = { won: 0, lost: 0 };
    if (r.outcome === 'won') rotStats[r.rotation].won++;
    else rotStats[r.rotation].lost++;
  }
  let worstRotation = null;
  let worstRate = 1;
  for (const [rot, stats] of Object.entries(rotStats)) {
    const total = stats.won + stats.lost;
    if (total > 0) {
      const rate = stats.won / total;
      if (rate < worstRate) { worstRate = rate; worstRotation = parseInt(rot); }
    }
  }

  // Serving runs (consecutive points won while serving)
  const servingRuns = [];
  let currentRun = 0;
  for (const r of setRallies) {
    if (r.servingTeam === 'us' && r.outcome === 'won') {
      currentRun++;
    } else {
      if (currentRun >= 3) servingRuns.push(currentRun);
      currentRun = 0;
    }
  }
  if (currentRun >= 3) servingRuns.push(currentRun);

  return { mvpPlayerId, worstRotation, worstRate, servingRuns, playerImpact };
}
