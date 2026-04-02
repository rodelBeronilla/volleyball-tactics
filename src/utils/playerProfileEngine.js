/**
 * Autonomous Player Profile Engine.
 *
 * Computes a complete player profile from stat data — ratings, archetype detection,
 * tendencies, strengths/weaknesses, rotation performance, trends, and impact score.
 * This is the brain of the analytics system. Profiles recompute reactively when data changes.
 */

import { ARCHETYPES, ATTRIBUTES } from '../data/archetypes';
import { STATS } from '../data/statCategories';
import { aggregateByRotation, computeStatLine, countSetsPlayed } from './statAggregation';

// ── Rating derivation (extracted from statRatings.js pattern) ──

const CONFIDENCE_THRESHOLDS = {
  attack: 30, block: 20, serve: 20, pass: 30, defense: 20, set: 20, speed: Infinity,
};

const POSITION_DEFAULTS = {
  setter:   { attack: 3, block: 5, serve: 5, pass: 6, defense: 5, set: 8, speed: 6 },
  outside:  { attack: 7, block: 5, serve: 6, pass: 6, defense: 6, set: 4, speed: 6 },
  middle:   { attack: 7, block: 8, serve: 5, pass: 3, defense: 3, set: 2, speed: 6 },
  opposite: { attack: 8, block: 6, serve: 7, pass: 4, defense: 4, set: 3, speed: 5 },
  libero:   { attack: 1, block: 1, serve: 1, pass: 8, defense: 8, set: 4, speed: 7 },
  ds:       { attack: 3, block: 2, serve: 5, pass: 7, defense: 7, set: 4, speed: 6 },
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

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

function deriveRatingsFromStats(sl) {
  if (!sl) return {};
  const d = {};

  if (sl.attackAttempts > 0) {
    d.attack = { score: mapToRating(sl.hitPct, [[-0.10,1],[0,3],[0.15,5],[0.25,7],[0.35,9],[0.45,10]]), attempts: sl.attackAttempts };
  }
  if (sl.totalBlocks > 0 || sl.blockError > 0) {
    const att = sl.totalBlocks + (sl.blockError || 0);
    const eff = (sl.totalBlocks - (sl.blockError || 0) * 0.5) / sl.setsPlayed;
    d.block = { score: mapToRating(eff, [[-0.5,1],[0,3],[0.3,5],[0.7,7],[1.0,9],[1.5,10]]), attempts: att };
  }
  if (sl.totalServes > 0) {
    const aceR = (sl.ace || 0) / sl.totalServes;
    const errR = (sl.serviceError || 0) / sl.totalServes;
    d.serve = { score: clamp(aceR * 20 - errR * 10 + 5, 1, 10), attempts: sl.totalServes };
  }
  if (sl.totalPasses > 0) {
    d.pass = { score: mapToRating(sl.passAvg, [[0,1],[0.5,2],[1.0,3],[1.5,5],[2.0,7],[2.5,9],[3.0,10]]), attempts: sl.totalPasses };
  }
  if ((sl.dig || 0) > 0 || (sl.defenseError || 0) > 0) {
    const att = (sl.dig || 0) + (sl.defenseError || 0);
    const eff = ((sl.dig || 0) - (sl.defenseError || 0) * 0.5) / sl.setsPlayed;
    d.defense = { score: mapToRating(eff, [[-1,1],[0,2],[1,4],[2,6],[3,8],[5,10]]), attempts: att };
  }
  if ((sl.assist || 0) > 0 || (sl.setError || 0) > 0 || (sl.ballHandlingError || 0) > 0) {
    const total = (sl.assist || 0) + (sl.setError || 0) + (sl.ballHandlingError || 0);
    const errR = total > 0 ? ((sl.setError || 0) + (sl.ballHandlingError || 0)) / total : 0;
    const aps = sl.assistsPerSet;
    const score = aps > 3
      ? mapToRating(aps, [[0,2],[5,5],[8,7],[10,8],[12,9],[15,10]]) - errR * 3
      : clamp(6 - errR * 8, 1, 7);
    d.set = { score: clamp(score, 1, 10), attempts: total };
  }
  return d;
}

// ── Cosine similarity for archetype matching ──

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (const attr of ATTRIBUTES) {
    const va = a[attr] || 0;
    const vb = b[attr] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function detectArchetype(effectiveRatings, position, locked, manualArchetype) {
  if (locked && manualArchetype && ARCHETYPES[manualArchetype]) {
    return { detectedArchetype: manualArchetype, archetypeConfidence: 1.0, archetypeMatch: [] };
  }

  const candidates = Object.entries(ARCHETYPES)
    .filter(([, a]) => a.position === position)
    .map(([id, a]) => ({ id, similarity: cosineSimilarity(effectiveRatings, a.ratings) }))
    .sort((a, b) => b.similarity - a.similarity);

  const best = candidates[0];
  const threshold = 0.92; // high similarity required for auto-detection

  return {
    detectedArchetype: best && best.similarity >= threshold ? best.id : (manualArchetype || null),
    archetypeConfidence: best ? Math.round(best.similarity * 100) / 100 : 0,
    archetypeMatch: candidates,
  };
}

// ── Trend computation ──

function computeTrend(values) {
  if (!values || values.length < 2) return { direction: 'stable', slope: 0, recent: values?.[values.length - 1] ?? null, overall: null };

  const n = values.length;
  const overall = values.reduce((s, v) => s + v, 0) / n;
  const recent = values.slice(-3).reduce((s, v) => s + v, 0) / Math.min(3, values.length);

  // Least-squares slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  const threshold = 0.02;
  const direction = slope > threshold ? 'improving' : slope < -threshold ? 'declining' : 'stable';

  return { direction, slope: Math.round(slope * 1000) / 1000, recent: Math.round(recent * 100) / 100, overall: Math.round(overall * 100) / 100 };
}

// ── Tendency detection ──

function detectTendencies(statLine, rotationBreakdown, matchHistory) {
  const tendencies = [];
  if (!statLine) return tendencies;

  // Front-row vs back-row dominance
  const frontRots = [2, 3, 4];
  const backRots = [1, 5, 6];
  const frontStats = frontRots.map(r => rotationBreakdown[r]).filter(Boolean);
  const backStats = backRots.map(r => rotationBreakdown[r]).filter(Boolean);

  if (frontStats.length > 0 && backStats.length > 0) {
    const frontHit = frontStats.reduce((s, sl) => s + (sl.hitPct || 0), 0) / frontStats.length;
    const backHit = backStats.reduce((s, sl) => s + (sl.hitPct || 0), 0) / backStats.length;
    if (frontHit - backHit > 0.08) {
      tendencies.push({ label: 'Front-row dominant', evidence: `hitPct ${(frontHit*100).toFixed(0)}% front vs ${(backHit*100).toFixed(0)}% back`, confidence: clamp((frontHit - backHit) * 5, 0.3, 1) });
    } else if (backHit - frontHit > 0.08) {
      tendencies.push({ label: 'Back-row threat', evidence: `hitPct ${(backHit*100).toFixed(0)}% back vs ${(frontHit*100).toFixed(0)}% front`, confidence: clamp((backHit - frontHit) * 5, 0.3, 1) });
    }
  }

  // Best/worst rotation
  const rotEntries = Object.entries(rotationBreakdown).filter(([, sl]) => sl && sl.attackAttempts > 0);
  if (rotEntries.length >= 3) {
    const sorted = rotEntries.sort((a, b) => (b[1].hitPct || 0) - (a[1].hitPct || 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    tendencies.push({ label: `Strong in R${best[0]}`, evidence: `hitPct ${((best[1].hitPct||0)*100).toFixed(0)}%, ${best[1].totalKills||0} kills`, confidence: 0.8 });
    if ((best[1].hitPct || 0) - (worst[1].hitPct || 0) > 0.1) {
      tendencies.push({ label: `Struggles in R${worst[0]}`, evidence: `hitPct ${((worst[1].hitPct||0)*100).toFixed(0)}%`, confidence: 0.7 });
    }
  }

  // Serve aggressiveness
  if (statLine.totalServes > 5) {
    const aceRate = (statLine.ace || 0) / statLine.totalServes;
    const errRate = (statLine.serviceError || 0) / statLine.totalServes;
    if (aceRate > 0.08 && errRate > 0.12) {
      tendencies.push({ label: 'Aggressive server', evidence: `${(aceRate*100).toFixed(0)}% ace rate, ${(errRate*100).toFixed(0)}% error rate`, confidence: 0.75 });
    } else if (aceRate < 0.03 && errRate < 0.06) {
      tendencies.push({ label: 'Conservative server', evidence: `Low risk: ${(errRate*100).toFixed(0)}% errors, ${(aceRate*100).toFixed(0)}% aces`, confidence: 0.7 });
    }
  }

  // Shot selection
  if (statLine.attackVariety) {
    const { tipPct, tooledPct } = statLine.attackVariety;
    if (tipPct > 0.2) {
      tendencies.push({ label: 'Frequent tipper', evidence: `${(tipPct*100).toFixed(0)}% of attacks are tips`, confidence: 0.7 });
    }
    if (tooledPct > 0.15) {
      tendencies.push({ label: 'Uses the block', evidence: `${(tooledPct*100).toFixed(0)}% tooled kills`, confidence: 0.7 });
    }
  }

  // Late-set fade (compare early sets vs late sets)
  if (matchHistory && matchHistory.length >= 3) {
    // This would need per-set data which we can approximate from match trends
    const recent3 = matchHistory.slice(-3);
    const early3 = matchHistory.slice(0, 3);
    if (recent3.length >= 3 && early3.length >= 3) {
      const recentAvg = recent3.reduce((s, m) => s + (m.statLine?.hitPct || 0), 0) / 3;
      const earlyAvg = early3.reduce((s, m) => s + (m.statLine?.hitPct || 0), 0) / 3;
      if (recentAvg - earlyAvg > 0.05) {
        tendencies.push({ label: 'Improving over season', evidence: `hitPct ${(earlyAvg*100).toFixed(0)}% early → ${(recentAvg*100).toFixed(0)}% recent`, confidence: 0.8 });
      } else if (earlyAvg - recentAvg > 0.05) {
        tendencies.push({ label: 'Declining performance', evidence: `hitPct ${(earlyAvg*100).toFixed(0)}% early → ${(recentAvg*100).toFixed(0)}% recent`, confidence: 0.8 });
      }
    }
  }

  return tendencies;
}

// ── Impact score ──

function computeImpactScore(statLine, position) {
  if (!statLine) return { score: 0, factors: [] };

  const factors = [];
  let total = 0;
  let maxPossible = 0;

  const add = (label, value, weight) => {
    const contribution = Math.round(value * weight);
    factors.push({ label, contribution, value: Math.round(value * 100) / 100 });
    total += contribution;
    maxPossible += weight * 10;
  };

  // Position-weighted scoring
  switch (position) {
    case 'outside':
    case 'opposite':
      if (statLine.hitPct !== null) add('Hit efficiency', mapToRating(statLine.hitPct, [[-0.1,1],[0,3],[0.15,5],[0.25,7],[0.35,9],[0.45,10]]), 3);
      add('Kills/set', mapToRating(statLine.killsPerSet, [[0,1],[1,3],[2,5],[3,7],[4,9],[5,10]]), 2.5);
      if (statLine.passAvg !== null) add('Pass average', mapToRating(statLine.passAvg, [[0,1],[1,3],[1.5,5],[2,7],[2.5,9],[3,10]]), 1.5);
      add('Digs/set', mapToRating(statLine.digsPerSet, [[0,1],[0.5,3],[1,5],[2,7],[3,9],[5,10]]), 1);
      break;
    case 'middle':
      if (statLine.hitPct !== null) add('Hit efficiency', mapToRating(statLine.hitPct, [[-0.1,1],[0,3],[0.2,5],[0.3,7],[0.4,9],[0.5,10]]), 2.5);
      add('Blocks/set', mapToRating(statLine.blocksPerSet, [[0,1],[0.3,4],[0.7,6],[1.0,8],[1.5,10]]), 3);
      add('Kills/set', mapToRating(statLine.killsPerSet, [[0,1],[0.5,3],[1,5],[2,7],[3,9]]), 1.5);
      break;
    case 'setter':
      add('Assists/set', mapToRating(statLine.assistsPerSet, [[0,1],[3,3],[6,5],[9,7],[11,9],[14,10]]), 3);
      if (statLine.passAvg !== null) add('Pass average', mapToRating(statLine.passAvg, [[0,1],[1,3],[1.5,5],[2,7],[2.5,9],[3,10]]), 1.5);
      add('Digs/set', mapToRating(statLine.digsPerSet, [[0,1],[0.5,3],[1,5],[2,7],[3,10]]), 1);
      add('Blocks/set', mapToRating(statLine.blocksPerSet, [[0,1],[0.2,4],[0.5,6],[0.8,8],[1.2,10]]), 1.5);
      break;
    case 'libero':
    case 'ds':
      if (statLine.passAvg !== null) add('Pass average', mapToRating(statLine.passAvg, [[0,1],[0.5,2],[1,3],[1.5,5],[2,7],[2.5,9],[3,10]]), 3.5);
      add('Digs/set', mapToRating(statLine.digsPerSet, [[0,1],[1,3],[2,5],[3,7],[4,9],[6,10]]), 3);
      break;
    default:
      add('Overall', 5, 1);
  }

  const score = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
  return { score: clamp(score, 0, 100), factors };
}

// ── Strengths & weaknesses ──

// ── Main profile computation ──

/**
 * Compute a complete player profile from stat data.
 * This is the single entry point for all profile analytics.
 */
export function computeFullProfile(player, statEntries, matches) {
  const playerEntries = statEntries.filter(e => e.playerId === player.id);
  const hasStats = playerEntries.length > 0;

  // Baseline
  const arch = player.archetype ? ARCHETYPES[player.archetype] : null;
  const baseline = arch ? { ...arch.ratings } : { ...(POSITION_DEFAULTS[player.position] || POSITION_DEFAULTS.outside) };

  if (!hasStats) {
    return {
      effectiveRatings: baseline,
      confidence: Object.fromEntries(ATTRIBUTES.map(a => [a, 0])),
      detectedArchetype: player.archetype || null,
      archetypeConfidence: player.archetype ? 0.5 : 0,
      archetypeMatch: [],
      tendencies: [],
      strengths: [],
      weaknesses: [],
      rotationProfile: {},
      trends: {},
      impactScore: 0,
      impactFactors: [],
      hasStats: false,
      baseline,
    };
  }

  // Aggregate stats
  const counts = {};
  const STAT_KEYS = Object.keys(STATS);
  STAT_KEYS.forEach(k => { counts[k] = 0; });
  for (const e of playerEntries) {
    if (e.stat in counts) counts[e.stat]++;
  }
  const setsPlayed = countSetsPlayed(statEntries, player.id);
  const statLine = computeStatLine(counts, setsPlayed);

  // Derive ratings from stats
  const derived = deriveRatingsFromStats(statLine);

  // Compute effective ratings with dynamic blend factor
  const effectiveRatings = {};
  const confidence = {};
  for (const attr of ATTRIBUTES) {
    const base = baseline[attr] || 5;
    const d = derived[attr];

    if (!d || CONFIDENCE_THRESHOLDS[attr] === Infinity) {
      effectiveRatings[attr] = base;
      confidence[attr] = 0;
      continue;
    }

    const conf = Math.min(d.attempts / CONFIDENCE_THRESHOLDS[attr], 1.0);
    confidence[attr] = Math.round(conf * 100) / 100;
    // Dynamic blend: 0.4 at low confidence → 0.8 at full confidence
    const blendFactor = 0.4 + 0.4 * conf;
    const blended = base * (1 - conf * blendFactor) + d.score * conf * blendFactor;
    effectiveRatings[attr] = clamp(Math.round(blended * 10) / 10, 1, 10);
  }

  // Archetype detection
  const archetypeInfo = detectArchetype(effectiveRatings, player.position, player.archetypeLocked, player.archetype);

  // Per-rotation breakdown
  const byRotation = aggregateByRotation(statEntries, {});
  const rotationProfile = {};
  for (let r = 1; r <= 6; r++) {
    const playerCounts = byRotation[r]?.[player.id];
    if (!playerCounts) continue;
    const hasData = Object.values(playerCounts).some(v => v > 0);
    if (!hasData) continue;
    const rotSets = Math.max(1, Math.ceil(setsPlayed / 6)); // rough per-rotation sets estimate
    const sl = computeStatLine(playerCounts, rotSets);
    const isFront = r === 2 || r === 3 || r === 4;
    rotationProfile[r] = {
      statLine: sl,
      isFrontRow: isFront,
      keyMetric: sl.hitPct !== null
        ? { name: 'hitPct', value: sl.hitPct }
        : sl.passAvg !== null
          ? { name: 'passAvg', value: sl.passAvg }
          : { name: 'actions', value: Object.values(playerCounts).reduce((s, v) => s + v, 0) },
    };
  }

  // Match history for trends
  const matchHistory = matches
    .filter(m => statEntries.some(e => e.matchId === m.id && e.playerId === player.id))
    .sort((a, b) => (a.date || a.createdAt || '').localeCompare(b.date || b.createdAt || ''))
    .map(m => {
      const matchCounts = {};
      STAT_KEYS.forEach(k => { matchCounts[k] = 0; });
      statEntries.filter(e => e.matchId === m.id && e.playerId === player.id).forEach(e => {
        if (e.stat in matchCounts) matchCounts[e.stat]++;
      });
      const matchSets = countSetsPlayed(statEntries.filter(e => e.matchId === m.id), player.id);
      return { matchId: m.id, opponent: m.opponent, date: m.date, statLine: computeStatLine(matchCounts, matchSets) };
    });

  // Trends per attribute
  const trends = {};
  if (matchHistory.length >= 2) {
    const hitPctValues = matchHistory.map(m => m.statLine.hitPct).filter(v => v !== null);
    if (hitPctValues.length >= 2) trends.attack = computeTrend(hitPctValues);

    const passValues = matchHistory.map(m => m.statLine.passAvg).filter(v => v !== null);
    if (passValues.length >= 2) trends.pass = computeTrend(passValues);

    const blockValues = matchHistory.map(m => m.statLine.blocksPerSet).filter(v => v > 0);
    if (blockValues.length >= 2) trends.block = computeTrend(blockValues);

    const digValues = matchHistory.map(m => m.statLine.digsPerSet).filter(v => v > 0);
    if (digValues.length >= 2) trends.defense = computeTrend(digValues);

    const assistValues = matchHistory.map(m => m.statLine.assistsPerSet).filter(v => v > 0);
    if (assistValues.length >= 2) trends.set = computeTrend(assistValues);
  }

  // Tendencies
  const tendencies = detectTendencies(statLine, rotationProfile, matchHistory);

  // Impact score
  const { score: impactScore, factors: impactFactors } = computeImpactScore(statLine, player.position);

  // Strengths & weaknesses (simplified — avoid circular dependency)
  const strengths = [];
  const weaknesses = [];
  const metricChecks = [
    { area: 'Attack', value: statLine.hitPct, threshold: [0.2, 0.35], label: 'hitPct' },
    { area: 'Pass', value: statLine.passAvg, threshold: [1.8, 2.3], label: 'passAvg' },
    { area: 'Block', value: statLine.blocksPerSet, threshold: [0.5, 1.0], label: 'blk/set' },
    { area: 'Defense', value: statLine.digsPerSet, threshold: [1.5, 3.0], label: 'dig/set' },
    { area: 'Serve', value: statLine.totalServes > 0 ? (statLine.ace || 0) / statLine.totalServes : null, threshold: [0.04, 0.1], label: 'aceRate' },
  ];

  for (const m of metricChecks) {
    if (m.value === null || m.value === undefined) continue;
    if (m.value >= m.threshold[1]) {
      strengths.push({ area: m.area, metric: m.label, value: Math.round(m.value * 1000) / 1000 });
    } else if (m.value < m.threshold[0]) {
      weaknesses.push({ area: m.area, metric: m.label, value: Math.round(m.value * 1000) / 1000 });
    }
  }

  return {
    effectiveRatings,
    confidence,
    ...archetypeInfo,
    tendencies,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    rotationProfile,
    matchHistory,
    trends,
    impactScore,
    impactFactors,
    hasStats: true,
    baseline,
    statLine,
  };
}
