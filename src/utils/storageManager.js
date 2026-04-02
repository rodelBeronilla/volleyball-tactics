/**
 * Storage management — usage tracking, data compaction, export/import.
 */

import { STAT_KEYS } from '../data/statCategories';

/**
 * Estimate localStorage usage.
 */
export function getStorageUsage() {
  let used = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      used += (key.length + (value ? value.length : 0)) * 2; // UTF-16 = 2 bytes per char
    }
  } catch {
    // ignore
  }
  const limit = 5 * 1024 * 1024; // 5MB conservative estimate
  return { used, limit, percent: Math.round((used / limit) * 100) };
}

/**
 * Compact old stat entries into summary entries.
 * Preserves all data needed for analysis while reducing storage ~10x.
 * @param {Array} statEntries - all stat entries
 * @param {Array} matches - all matches
 * @param {number} keepRecentN - number of recent matches to keep in full detail
 * @returns {Array} compacted entries
 */
export function compactOldEntries(statEntries, matches, keepRecentN = 10) {
  // Sort matches by date, newest first
  const sorted = [...matches]
    .filter(m => m.completed)
    .sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));

  // Matches to compact (older than keepRecentN)
  const toCompact = new Set(sorted.slice(keepRecentN).map(m => m.id));
  if (toCompact.size === 0) return statEntries;

  // Keep recent entries as-is
  const kept = statEntries.filter(e => !toCompact.has(e.matchId));

  // Compact old entries: group by matchId + playerId + rotation
  const groups = {};
  for (const e of statEntries) {
    if (!toCompact.has(e.matchId)) continue;
    if (e.type === 'summary') { kept.push(e); continue; } // already compacted
    const key = `${e.matchId}|${e.playerId}|${e.rotation}`;
    if (!groups[key]) {
      groups[key] = { matchId: e.matchId, playerId: e.playerId, rotation: e.rotation, counts: {} };
      STAT_KEYS.forEach(k => { groups[key].counts[k] = 0; });
    }
    if (e.stat in groups[key].counts) {
      groups[key].counts[e.stat]++;
    }
  }

  // Convert groups to summary entries
  const summaries = Object.values(groups)
    .filter(g => Object.values(g.counts).some(v => v > 0))
    .map(g => ({
      type: 'summary',
      id: `summary-${g.matchId}-${g.playerId}-${g.rotation}`,
      matchId: g.matchId,
      playerId: g.playerId,
      rotation: g.rotation,
      counts: g.counts,
    }));

  return [...kept, ...summaries];
}

/**
 * Export all app data as a JSON object.
 */
export function exportAllData(state) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    players: state.players,
    lineups: state.lineups,
    matches: state.matches,
    statEntries: state.statEntries,
    rallies: state.rallies || [],
    activeLineupId: state.activeLineupId,
    activeFormationId: state.activeFormationId,
  };
}

/**
 * Validate and parse imported data.
 * Returns the validated state object or null if invalid.
 */
export function parseImportData(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.players)) return null;
    if (!Array.isArray(data.lineups)) return null;

    return {
      players: data.players,
      lineups: data.lineups,
      matches: data.matches || [],
      statEntries: data.statEntries || [],
      rallies: data.rallies || [],
      activeLineupId: data.activeLineupId || (data.lineups[0]?.id || null),
      activeFormationId: data.activeFormationId || 'sr-5-1',
    };
  } catch {
    return null;
  }
}
