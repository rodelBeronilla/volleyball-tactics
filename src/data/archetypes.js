/**
 * Player archetypes and composition analysis.
 *
 * Archetypes refine the base position (OH, MB, S, OPP, L) with
 * play-style tendencies expressed as numeric attribute profiles.
 *
 * Each attribute is rated 1–10:
 *   1-3 = below average, 4-5 = average, 6-7 = good, 8-9 = elite, 10 = exceptional
 */

export const ATTRIBUTES = ['attack', 'block', 'serve', 'pass', 'defense', 'set', 'speed'];

export const ATTRIBUTE_LABELS = {
  attack: 'Attack',
  block: 'Block',
  serve: 'Serve',
  pass: 'Pass',
  defense: 'Defense',
  set: 'Set',
  speed: 'Speed',
};

export const ARCHETYPES = {
  // Outside Hitter archetypes
  'oh-power': {
    position: 'outside',
    label: 'Power OH',
    description: 'High ball, cross-court dominant, strong serve',
    ratings: { attack: 9, block: 6, serve: 8, pass: 4, defense: 4, set: 3, speed: 5 },
    color: '#2563eb',
  },
  'oh-allround': {
    position: 'outside',
    label: 'All-Round OH',
    description: 'Balanced hitter-passer, serve-receive anchor',
    ratings: { attack: 7, block: 5, serve: 6, pass: 7, defense: 7, set: 4, speed: 6 },
    color: '#3b82f6',
  },
  'oh-defensive': {
    position: 'outside',
    label: 'Defensive OH',
    description: 'Serve-receive specialist, high dig rate, smart shots',
    ratings: { attack: 5, block: 4, serve: 5, pass: 9, defense: 8, set: 4, speed: 7 },
    color: '#60a5fa',
  },

  // Middle Blocker archetypes
  'mb-blocker': {
    position: 'middle',
    label: 'Blocking MB',
    description: 'Read blocker, dominates the net, slower transition',
    ratings: { attack: 6, block: 9, serve: 5, pass: 3, defense: 3, set: 2, speed: 4 },
    color: '#dc2626',
  },
  'mb-quick': {
    position: 'middle',
    label: 'Quick MB',
    description: 'Fast tempo attacker, slides, combination plays',
    ratings: { attack: 8, block: 6, serve: 5, pass: 3, defense: 3, set: 2, speed: 8 },
    color: '#ef4444',
  },

  // Setter archetypes
  's-distributer': {
    position: 'setter',
    label: 'Distributor Setter',
    description: 'Runs complex offense, deceptive hands, orchestrator',
    ratings: { attack: 3, block: 4, serve: 5, pass: 6, defense: 5, set: 9, speed: 6 },
    color: '#d97706',
  },
  's-athletic': {
    position: 'setter',
    label: 'Athletic Setter',
    description: 'Dumps, blocks well, physical presence at net',
    ratings: { attack: 6, block: 7, serve: 6, pass: 5, defense: 4, set: 7, speed: 5 },
    color: '#f59e0b',
  },

  // Opposite archetypes
  'opp-cannon': {
    position: 'opposite',
    label: 'Cannon OPP',
    description: 'Primary scorer, high ball out of back row, big serve',
    ratings: { attack: 9, block: 5, serve: 9, pass: 3, defense: 3, set: 2, speed: 5 },
    color: '#16a34a',
  },
  'opp-balanced': {
    position: 'opposite',
    label: 'Balanced OPP',
    description: 'Solid all-around, good block, decent back-row',
    ratings: { attack: 7, block: 7, serve: 6, pass: 4, defense: 6, set: 3, speed: 5 },
    color: '#22c55e',
  },

  // Libero archetypes
  'l-passer': {
    position: 'libero',
    label: 'Passing Libero',
    description: 'Elite serve-receive, platform control, steady hands',
    ratings: { attack: 1, block: 1, serve: 1, pass: 10, defense: 6, set: 5, speed: 6 },
    color: '#ea580c',
  },
  'l-defender': {
    position: 'libero',
    label: 'Defensive Libero',
    description: 'Incredible range, digs everything, high-energy',
    ratings: { attack: 1, block: 1, serve: 1, pass: 6, defense: 10, set: 4, speed: 8 },
    color: '#f97316',
  },
};

/**
 * Get the top 2 attributes (highest rated) for an archetype.
 */
export function getTopAttributes(archetype) {
  if (!archetype?.ratings) return [];
  return ATTRIBUTES
    .map(attr => ({ attr, value: archetype.ratings[attr] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
}

/**
 * Get the bottom 2 attributes (lowest rated, excluding floor-1 libero scores).
 */
export function getWeakAttributes(archetype) {
  if (!archetype?.ratings) return [];
  return ATTRIBUTES
    .map(attr => ({ attr, value: archetype.ratings[attr] }))
    .filter(a => a.value > 1) // exclude libero floor values
    .sort((a, b) => a.value - b.value)
    .slice(0, 2);
}

/**
 * Compute lineup-wide attribute averages from starters + libero.
 * Returns { attr: avgValue } for each attribute.
 */
function computeLineupProfile(starters, libero) {
  const sums = {};
  const counts = {};
  ATTRIBUTES.forEach(a => { sums[a] = 0; counts[a] = 0; });

  const allPlayers = [...starters.map(s => s.player)];
  if (libero) allPlayers.push(libero);

  for (const p of allPlayers) {
    const arch = p.archetype ? ARCHETYPES[p.archetype] : null;
    if (!arch) continue;
    for (const attr of ATTRIBUTES) {
      sums[attr] += arch.ratings[attr];
      counts[attr]++;
    }
  }

  const profile = {};
  for (const attr of ATTRIBUTES) {
    profile[attr] = counts[attr] > 0 ? Math.round((sums[attr] / counts[attr]) * 10) / 10 : 0;
  }
  return profile;
}

/**
 * Analyze lineup composition and return fit scores + suggestions.
 */
export function analyzeComposition(players, lineup) {
  const issues = [];
  const strengths = [];
  const suggestions = [];

  if (!lineup) return { issues, strengths, suggestions, score: 0, profile: null };

  const rosterById = {};
  players.forEach(p => { rosterById[p.id] = p; });

  // Get the 6 starters
  const starters = [];
  for (let pos = 1; pos <= 6; pos++) {
    const pid = lineup.slots[pos];
    if (pid && rosterById[pid]) {
      starters.push({ slot: pos, player: rosterById[pid] });
    }
  }

  const libero = lineup.liberoId ? rosterById[lineup.liberoId] : null;

  // Check: do we have all 6 starters?
  if (starters.length < 6) {
    issues.push({ severity: 'error', text: `Only ${starters.length}/6 starters assigned` });
  }

  // Check position composition for 5-1
  const posCount = {};
  starters.forEach(s => {
    posCount[s.player.position] = (posCount[s.player.position] || 0) + 1;
  });

  if (lineup.system === '5-1') {
    if ((posCount.setter || 0) !== 1) {
      issues.push({ severity: 'error', text: `5-1 needs exactly 1 setter (have ${posCount.setter || 0})` });
    }
    if ((posCount.outside || 0) < 2) {
      issues.push({ severity: 'warning', text: `5-1 typically has 2 outside hitters (have ${posCount.outside || 0})` });
    }
    if ((posCount.middle || 0) < 2) {
      issues.push({ severity: 'warning', text: `5-1 typically has 2 middle blockers (have ${posCount.middle || 0})` });
    }
    if ((posCount.opposite || 0) !== 1) {
      issues.push({ severity: 'warning', text: `5-1 needs 1 opposite (have ${posCount.opposite || 0})` });
    }

    // Check setter is opposite the opposite
    const setterSlot = starters.find(s => s.player.position === 'setter')?.slot;
    const oppSlot = starters.find(s => s.player.position === 'opposite')?.slot;
    if (setterSlot && oppSlot) {
      const diff = Math.abs(setterSlot - oppSlot);
      if (diff === 3) {
        strengths.push('Setter and opposite are correctly opposite each other');
      } else {
        issues.push({ severity: 'warning', text: 'Setter and opposite should be 3 positions apart (opposite each other in rotation)' });
        suggestions.push(`Move opposite to position ${((setterSlot + 2) % 6) + 1} for proper 5-1 alignment`);
      }
    }

    // Check outsides are opposite each other
    const ohSlots = starters.filter(s => s.player.position === 'outside').map(s => s.slot);
    if (ohSlots.length === 2) {
      const ohDiff = Math.abs(ohSlots[0] - ohSlots[1]);
      if (ohDiff === 3) {
        strengths.push('Outside hitters are correctly opposite each other');
      } else {
        suggestions.push('Outside hitters should be 3 positions apart for balanced offense');
      }
    }

    // Check middles are opposite each other
    const mbSlots = starters.filter(s => s.player.position === 'middle').map(s => s.slot);
    if (mbSlots.length === 2) {
      const mbDiff = Math.abs(mbSlots[0] - mbSlots[1]);
      if (mbDiff === 3) {
        strengths.push('Middle blockers are correctly opposite each other');
      } else {
        suggestions.push('Middle blockers should be 3 positions apart for balanced blocking');
      }
    }
  }

  // Libero check
  if (!libero) {
    suggestions.push('Assign a libero for back-row substitution');
  } else {
    strengths.push(`Libero (${libero.name}) will sub for middles in back row`);
  }

  // Compute lineup attribute profile
  const profile = computeLineupProfile(starters, libero);
  const profiledCount = starters.filter(s => s.player.archetype && ARCHETYPES[s.player.archetype]).length
    + (libero?.archetype && ARCHETYPES[libero.archetype] ? 1 : 0);

  if (profiledCount > 0) {
    // Attribute-based analysis
    const highAttrs = ATTRIBUTES.filter(a => profile[a] >= 7);
    const lowAttrs = ATTRIBUTES.filter(a => profile[a] > 0 && profile[a] <= 3.5);

    highAttrs.forEach(a => {
      strengths.push(`Strong ${ATTRIBUTE_LABELS[a]} across lineup (avg ${profile[a]})`);
    });
    lowAttrs.forEach(a => {
      issues.push({ severity: 'warning', text: `Weak ${ATTRIBUTE_LABELS[a]} across lineup (avg ${profile[a]})` });
    });

    if (profiledCount < starters.length) {
      suggestions.push(`${starters.length - profiledCount + (libero && !libero.archetype ? 1 : 0)} player(s) have no archetype — assign in Roster for full analysis`);
    }
  } else {
    suggestions.push('Assign archetypes in the Roster tab for attribute-based analysis');
  }

  // Score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 10 + strengths.length * 5);

  return { issues, strengths, suggestions, score: Math.min(100, score), profile };
}
