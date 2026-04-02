/**
 * Player pairing and combination analysis.
 *
 * All derivable from existing data — every stat entry carries rotation,
 * and the lineup defines who occupies each slot per rotation.
 */

import { deriveRotation } from './rotations';
import { aggregateByPlayer, computeStatLine } from './statAggregation';
import { STAT_KEYS } from '../data/statCategories';

/**
 * Get which players are on court for each rotation given a lineup.
 * Returns { 1: Set<playerId>, 2: Set<playerId>, ... }
 */
function getOnCourtByRotation(lineup) {
  const result = {};
  for (let r = 1; r <= 6; r++) {
    const slots = deriveRotation(lineup.slots, r);
    const onCourt = new Set();
    for (let pos = 1; pos <= 6; pos++) {
      const pid = slots[pos];
      if (pid) onCourt.add(pid);
    }
    // Add libero (replaces middle in back row, but both are "on the team")
    if (lineup.liberoId) onCourt.add(lineup.liberoId);
    result[r] = onCourt;
  }
  return result;
}

/**
 * Find rotations where both players are on court.
 */
function getSharedRotations(lineup, playerA, playerB) {
  const byRot = getOnCourtByRotation(lineup);
  const shared = [];
  for (let r = 1; r <= 6; r++) {
    if (byRot[r].has(playerA) && byRot[r].has(playerB)) {
      shared.push(r);
    }
  }
  return shared;
}

/**
 * Performance when two players are on court together.
 */
export function getPairingSynergy(statEntries, lineup, playerA, playerB) {
  const sharedRotations = getSharedRotations(lineup, playerA, playerB);
  if (sharedRotations.length === 0) return null;

  // Filter entries to shared rotations for both players
  const sharedEntries = statEntries.filter(e =>
    sharedRotations.includes(e.rotation) && (e.playerId === playerA || e.playerId === playerB)
  );

  const byPlayer = aggregateByPlayer(sharedEntries);
  const aStats = byPlayer[playerA];
  const bStats = byPlayer[playerB];

  // Compute combined stat line
  const combined = {};
  STAT_KEYS.forEach(k => { combined[k] = (aStats?.[k] || 0) + (bStats?.[k] || 0); });
  const setsEstimate = Math.max(1, Math.ceil(sharedEntries.length / 20)); // rough estimate
  const sl = computeStatLine(combined, setsEstimate);

  return {
    sharedRotations,
    sampleSize: sharedEntries.length,
    hitPct: sl.hitPct,
    passAvg: sl.passAvg,
    kills: sl.totalKills,
    blocks: sl.totalBlocks,
  };
}

/**
 * How each hitter performs with a specific setter.
 * Setter and hitter are on court in the same rotations — filter attack stats.
 */
export function getSetterHitterSynergy(statEntries, lineup, setterId, players) {
  const results = [];
  const allPlayers = players || [];

  for (const hitter of allPlayers) {
    if (hitter.id === setterId) continue;
    if (hitter.position === 'libero' || hitter.position === 'ds') continue;

    const sharedRotations = getSharedRotations(lineup, setterId, hitter.id);
    if (sharedRotations.length === 0) continue;

    // Get hitter's attack stats in shared rotations
    const hitterEntries = statEntries.filter(e =>
      sharedRotations.includes(e.rotation) && e.playerId === hitter.id
    );

    const counts = {};
    STAT_KEYS.forEach(k => { counts[k] = 0; });
    hitterEntries.forEach(e => { if (e.stat in counts) counts[e.stat]++; });
    const sl = computeStatLine(counts, Math.max(1, sharedRotations.length));

    if (sl.attackAttempts === 0) continue;

    results.push({
      hitterId: hitter.id,
      hitterName: hitter.name,
      hitPct: sl.hitPct,
      kills: sl.totalKills,
      attempts: sl.attackAttempts,
      rotations: sharedRotations,
    });
  }

  return results.sort((a, b) => (b.hitPct || 0) - (a.hitPct || 0));
}

/**
 * Front-row combination analysis.
 * Each rotation has a fixed front row (positions 2, 3, 4).
 */
export function getFrontRowCombinations(statEntries, lineup, players) {
  const results = [];

  for (let r = 1; r <= 6; r++) {
    const slots = deriveRotation(lineup.slots, r);
    const frontRow = [slots[2], slots[3], slots[4]].filter(Boolean);

    // Handle libero (not in front row)
    const frontPlayers = frontRow.map(pid => players.find(p => p.id === pid)).filter(Boolean);
    if (frontPlayers.length < 3) continue;

    // Get stats for front-row players in this rotation
    const rotEntries = statEntries.filter(e =>
      e.rotation === r && frontRow.includes(e.playerId)
    );

    const counts = {};
    STAT_KEYS.forEach(k => { counts[k] = 0; });
    rotEntries.forEach(e => { if (e.stat in counts) counts[e.stat]++; });
    const sl = computeStatLine(counts, Math.max(1, 1));

    const positive = rotEntries.filter(e => {
      const s = STAT_KEYS.includes(e.stat) ? e.stat : null;
      return s && ['kill', 'attackTip', 'attackTooled', 'blockSolo', 'blockAssist', 'ace'].includes(s);
    }).length;
    const total = rotEntries.length;

    results.push({
      rotation: r,
      players: frontPlayers.map(p => ({ id: p.id, name: p.name, position: p.position })),
      kills: sl.totalKills,
      blocks: sl.totalBlocks,
      positiveRate: total > 0 ? positive / total : 0,
      totalActions: total,
    });
  }

  return results.sort((a, b) => (b.kills + b.blocks) - (a.kills + a.blocks));
}

/**
 * Back-row combination analysis.
 * Each rotation has a fixed back row (positions 1, 5, 6).
 */
export function getBackRowCombinations(statEntries, lineup, players) {
  const results = [];

  for (let r = 1; r <= 6; r++) {
    const slots = deriveRotation(lineup.slots, r);
    const backRow = [slots[1], slots[5], slots[6]].filter(Boolean);

    // Handle libero substitution (replaces middle in back row)
    const backPlayers = backRow.map(pid => {
      const player = players.find(p => p.id === pid);
      if (player && player.position === 'middle' && lineup.liberoId) {
        return players.find(p => p.id === lineup.liberoId) || player;
      }
      return player;
    }).filter(Boolean);

    if (backPlayers.length < 3) continue;

    const backIds = backPlayers.map(p => p.id);
    const rotEntries = statEntries.filter(e =>
      e.rotation === r && backIds.includes(e.playerId)
    );

    const counts = {};
    STAT_KEYS.forEach(k => { counts[k] = 0; });
    rotEntries.forEach(e => { if (e.stat in counts) counts[e.stat]++; });
    const sl = computeStatLine(counts, Math.max(1, 1));

    results.push({
      rotation: r,
      players: backPlayers.map(p => ({ id: p.id, name: p.name, position: p.position })),
      passAvg: sl.passAvg,
      digs: sl.dig || 0,
      totalActions: rotEntries.length,
    });
  }

  return results.sort((a, b) => (b.passAvg || 0) - (a.passAvg || 0));
}
