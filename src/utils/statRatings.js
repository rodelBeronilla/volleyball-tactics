/**
 * Stat-based rating auto-tuning.
 *
 * Blends archetype baseline ratings with stat-derived scores.
 * Players accumulate stats over matches; as confidence grows,
 * stat-derived ratings gain more weight vs the archetype baseline.
 */

import { ARCHETYPES, ATTRIBUTES } from '../data/archetypes';
import { getPlayerSummary } from './statAggregation';

// Minimum attempts before stat-derived score starts affecting ratings
const CONFIDENCE_THRESHOLDS = {
  attack: 30,
  block: 20,
  serve: 20,
  pass: 30,
  defense: 20,
  set: 20,
  speed: Infinity, // never derived from stats
};

// How much stats can shift the rating from baseline at full confidence (0-1)
const BLEND_FACTOR = 0.6;

// Default baselines per position (used when no archetype is assigned)
const POSITION_DEFAULTS = {
  setter:   { attack: 3, block: 5, serve: 5, pass: 6, defense: 5, set: 8, speed: 6 },
  outside:  { attack: 7, block: 5, serve: 6, pass: 6, defense: 6, set: 4, speed: 6 },
  middle:   { attack: 7, block: 8, serve: 5, pass: 3, defense: 3, set: 2, speed: 6 },
  opposite: { attack: 8, block: 6, serve: 7, pass: 4, defense: 4, set: 3, speed: 5 },
  libero:   { attack: 1, block: 1, serve: 1, pass: 8, defense: 8, set: 4, speed: 7 },
  ds:       { attack: 3, block: 2, serve: 5, pass: 7, defense: 7, set: 4, speed: 6 },
};

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Map a value from one range to a 1-10 scale.
 * Uses a piecewise linear mapping defined by breakpoints.
 */
function mapToRating(value, breakpoints) {
  if (value <= breakpoints[0][0]) return breakpoints[0][1];
  if (value >= breakpoints[breakpoints.length - 1][0]) return breakpoints[breakpoints.length - 1][1];

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [x0, y0] = breakpoints[i];
    const [x1, y1] = breakpoints[i + 1];
    if (value >= x0 && value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return 5;
}

/**
 * Compute stat-derived rating for each attribute from a player's stat summary.
 * Returns { attribute: { score, attempts } } or null for attributes with no data.
 */
function deriveRatingsFromStats(statLine) {
  if (!statLine) return {};

  const derived = {};

  // Attack: hit percentage -> rating
  if (statLine.attackAttempts > 0) {
    derived.attack = {
      score: mapToRating(statLine.hitPct, [
        [-0.10, 1], [0.00, 3], [0.15, 5], [0.25, 7], [0.35, 9], [0.45, 10],
      ]),
      attempts: statLine.attackAttempts,
    };
  }

  // Block: blocks per set -> rating
  if (statLine.totalBlocks > 0 || statLine.blockError > 0) {
    const attempts = statLine.totalBlocks + (statLine.blockError || 0);
    const effectiveBPS = (statLine.totalBlocks - (statLine.blockError || 0) * 0.5) / statLine.setsPlayed;
    derived.block = {
      score: mapToRating(effectiveBPS, [
        [-0.5, 1], [0, 3], [0.3, 5], [0.7, 7], [1.0, 9], [1.5, 10],
      ]),
      attempts,
    };
  }

  // Serve: ace rate vs error rate -> rating
  if (statLine.totalServes > 0) {
    const aceRate = (statLine.ace || 0) / statLine.totalServes;
    const errRate = (statLine.serviceError || 0) / statLine.totalServes;
    const serveScore = clamp(aceRate * 20 - errRate * 10 + 5, 1, 10);
    derived.serve = {
      score: serveScore,
      attempts: statLine.totalServes,
    };
  }

  // Pass: weighted pass average (0-3) -> rating
  if (statLine.totalPasses > 0) {
    derived.pass = {
      score: mapToRating(statLine.passAvg, [
        [0, 1], [0.5, 2], [1.0, 3], [1.5, 5], [2.0, 7], [2.5, 9], [3.0, 10],
      ]),
      attempts: statLine.totalPasses,
    };
  }

  // Defense: digs per set -> rating
  if ((statLine.dig || 0) > 0 || (statLine.defenseError || 0) > 0) {
    const attempts = (statLine.dig || 0) + (statLine.defenseError || 0);
    const effectiveDPS = ((statLine.dig || 0) - (statLine.defenseError || 0) * 0.5) / statLine.setsPlayed;
    derived.defense = {
      score: mapToRating(effectiveDPS, [
        [-1, 1], [0, 2], [1, 4], [2, 6], [3, 8], [5, 10],
      ]),
      attempts,
    };
  }

  // Set: assists per set + error rate -> rating
  if ((statLine.assist || 0) > 0 || (statLine.setError || 0) > 0 || (statLine.ballHandlingError || 0) > 0) {
    const totalSetActions = (statLine.assist || 0) + (statLine.setError || 0) + (statLine.ballHandlingError || 0);
    const errRate = totalSetActions > 0 ? ((statLine.setError || 0) + (statLine.ballHandlingError || 0)) / totalSetActions : 0;
    const aps = statLine.assistsPerSet;
    // For setters (high assist count), weight assists heavily
    // For non-setters, they just need low error rate
    const setScore = aps > 3
      ? mapToRating(aps, [[0, 2], [5, 5], [8, 7], [10, 8], [12, 9], [15, 10]]) - errRate * 3
      : clamp(6 - errRate * 8, 1, 7); // non-setters cap at 7
    derived.set = {
      score: clamp(setScore, 1, 10),
      attempts: totalSetActions,
    };
  }

  // Speed: not derived from stats
  // derived.speed stays undefined

  return derived;
}

/**
 * Get effective ratings for a player, blending archetype baseline with stat-derived scores.
 *
 * @param {Object} player - player object with .position, .archetype
 * @param {Array} statEntries - all stat entries
 * @param {Array} matches - all matches
 * @returns {{ ratings: Object, statDerived: Object, hasStats: boolean }}
 */
export function getEffectiveRatings(player, statEntries) {
  // Coach's base ratings take priority over archetype
  const arch = player.archetype ? ARCHETYPES[player.archetype] : null;
  const baseline = player.baseRatings || (arch ? arch.ratings : (POSITION_DEFAULTS[player.position] || POSITION_DEFAULTS.outside));

  const statLine = getPlayerSummary(statEntries, player.id);
  const derived = deriveRatingsFromStats(statLine);
  const hasStats = Object.keys(derived).length > 0;

  const ratings = {};
  for (const attr of ATTRIBUTES) {
    const base = baseline[attr] || 5;
    const d = derived[attr];

    if (!d || CONFIDENCE_THRESHOLDS[attr] === Infinity) {
      ratings[attr] = base;
      continue;
    }

    const confidence = Math.min(d.attempts / CONFIDENCE_THRESHOLDS[attr], 1.0);
    const blended = base * (1 - confidence * BLEND_FACTOR) + d.score * confidence * BLEND_FACTOR;
    ratings[attr] = clamp(Math.round(blended * 10) / 10, 1, 10);
  }

  return { ratings, statDerived: derived, hasStats, baseline };
}
