/**
 * Decision Engine — evidence-based coaching recommendations.
 */

import { ATTRIBUTES, ATTRIBUTE_LABELS, ARCHETYPES } from '../data/archetypes';

/**
 * Generate a human-readable narrative assessment of a player.
 */
export function generatePlayerNarrative(profile, player) {
  if (!profile || !profile.hasStats) {
    return `${player.name} has no game data yet. Record match stats to build their profile.`;
  }

  const parts = [];

  // Archetype identification
  if (profile.detectedArchetype && ARCHETYPES[profile.detectedArchetype]) {
    const arch = ARCHETYPES[profile.detectedArchetype];
    parts.push(`${player.name} profiles as a ${arch.label} (${Math.round(profile.archetypeConfidence * 100)}% match).`);
  } else {
    parts.push(`${player.name} has a unique profile that doesn't strongly match any standard archetype.`);
  }

  // Trend highlights
  const trendParts = [];
  for (const [attr, trend] of Object.entries(profile.trends || {})) {
    if (trend.direction === 'improving') {
      trendParts.push(`${ATTRIBUTE_LABELS[attr] || attr} improving (${trend.overall} → ${trend.recent})`);
    } else if (trend.direction === 'declining') {
      trendParts.push(`${ATTRIBUTE_LABELS[attr] || attr} declining (${trend.overall} → ${trend.recent})`);
    }
  }
  if (trendParts.length > 0) parts.push(trendParts.join('. ') + '.');

  // Best rotation
  const rotEntries = Object.entries(profile.rotationProfile || {});
  if (rotEntries.length >= 3) {
    const best = rotEntries.sort((a, b) => (b[1].keyMetric?.value || 0) - (a[1].keyMetric?.value || 0))[0];
    if (best) {
      const metric = best[1].keyMetric;
      parts.push(`Strongest in R${best[0]}${metric ? ` (${metric.name}: ${typeof metric.value === 'number' ? (metric.value < 1 ? (metric.value * 100).toFixed(0) + '%' : metric.value.toFixed(1)) : metric.value})` : ''}.`);
    }
  }

  // Strengths
  if (profile.strengths?.length > 0) {
    parts.push(`Strengths: ${profile.strengths.map(s => s.area).join(', ')}.`);
  }

  // Growth areas
  if (profile.weaknesses?.length > 0) {
    parts.push(`Growth areas: ${profile.weaknesses.map(w => `${w.area} (${w.metric}: ${w.value})`).join(', ')}.`);
  }

  // Impact
  if (profile.impactScore > 0) {
    parts.push(`Impact score: ${profile.impactScore}/100.`);
  }

  return parts.join(' ');
}

/**
 * Suggest lineup changes based on data.
 */
export function suggestLineupChanges(players, profiles, lineup) {
  const suggestions = [];
  if (!lineup || Object.keys(profiles).length === 0) return suggestions;

  // Check for declining players
  for (const p of players) {
    const prof = profiles[p.id];
    if (!prof?.hasStats) continue;

    const decliningAttrs = Object.entries(prof.trends || {})
      .filter(([, t]) => t.direction === 'declining')
      .map(([attr]) => ATTRIBUTE_LABELS[attr] || attr);

    if (decliningAttrs.length >= 2) {
      suggestions.push({
        type: 'declining',
        description: `${p.name} is declining in ${decliningAttrs.join(' and ')}`,
        evidence: `Trend over recent matches shows consistent decline`,
        impact: 'medium',
        playerId: p.id,
      });
    }
  }

  // Check for rotation weaknesses
  const rotEntries = Object.entries(profiles).filter(([, p]) => p.hasStats);
  for (let r = 1; r <= 6; r++) {
    const rotPlayers = rotEntries
      .filter(([, p]) => p.rotationProfile?.[r])
      .map(([id, p]) => ({ id, rotation: p.rotationProfile[r] }));

    const weakPlayers = rotPlayers.filter(rp => {
      const metric = rp.rotation.keyMetric;
      return metric && typeof metric.value === 'number' && metric.value < 0.1;
    });

    if (weakPlayers.length > 0) {
      const names = weakPlayers.map(wp => players.find(p => p.id === wp.id)?.name).filter(Boolean);
      suggestions.push({
        type: 'rotation-weakness',
        description: `R${r} has weak performance from ${names.join(', ')}`,
        evidence: `Below-average key metrics in rotation ${r}`,
        impact: 'high',
        rotation: r,
      });
    }
  }

  return suggestions;
}

/**
 * Identify development areas for each player.
 */
export function identifyDevelopmentAreas(players, profiles) {
  const areas = [];

  for (const p of players) {
    const prof = profiles[p.id];
    if (!prof?.hasStats) continue;

    // Compare effective ratings to baseline
    for (const attr of ATTRIBUTES) {
      const base = prof.baseline[attr] || 5;
      const effective = prof.effectiveRatings[attr] || 5;
      const conf = prof.confidence[attr] || 0;

      if (conf > 0.3 && effective < base - 1.5) {
        const trend = prof.trends?.[attr];
        areas.push({
          playerId: p.id,
          playerName: p.name,
          area: ATTRIBUTE_LABELS[attr] || attr,
          baseline: base,
          current: effective,
          gap: Math.round((base - effective) * 10) / 10,
          trend: trend?.direction || 'stable',
          suggestion: `${p.name}'s ${ATTRIBUTE_LABELS[attr] || attr} (${effective}) is below expected ${base}. ${trend?.direction === 'improving' ? 'Trending in the right direction.' : 'Consider focused training.'}`,
        });
      }
    }
  }

  return areas.sort((a, b) => b.gap - a.gap);
}
