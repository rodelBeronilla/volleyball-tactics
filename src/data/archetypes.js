/**
 * Player archetypes and composition analysis.
 *
 * Comprehensive archetype library covering every distinct player type in volleyball.
 * Each archetype is a unique rating signature that the auto-detection engine
 * matches against player base ratings via cosine similarity.
 *
 * Attributes rated 1–10:
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
  // ── Outside Hitter (OH) — 6 archetypes ──
  'oh-power': {
    position: 'outside', label: 'Power OH',
    description: 'Dominant high-ball hitter, cross-court kills, strong top-spin serve',
    ratings: { attack: 9, block: 6, serve: 8, pass: 4, defense: 4, set: 3, speed: 5 },
    color: '#1d4ed8',
  },
  'oh-allround': {
    position: 'outside', label: 'All-Round OH',
    description: 'Balanced hitter-passer, consistent in all rotations, serve-receive anchor',
    ratings: { attack: 7, block: 5, serve: 6, pass: 7, defense: 7, set: 4, speed: 6 },
    color: '#2563eb',
  },
  'oh-defensive': {
    position: 'outside', label: 'Defensive OH',
    description: 'Serve-receive specialist with smart shot selection and high dig rate',
    ratings: { attack: 5, block: 4, serve: 5, pass: 9, defense: 8, set: 4, speed: 7 },
    color: '#3b82f6',
  },
  'oh-pin': {
    position: 'outside', label: 'Pin Hitter',
    description: 'Line-shot specialist, excels hitting from the pin, strong off-speed game',
    ratings: { attack: 8, block: 5, serve: 6, pass: 5, defense: 5, set: 3, speed: 7 },
    color: '#60a5fa',
  },
  'oh-six-rotation': {
    position: 'outside', label: '6-Rotation OH',
    description: 'Stays in all rotations, back-row attack threat, never comes off the court',
    ratings: { attack: 7, block: 5, serve: 7, pass: 8, defense: 7, set: 4, speed: 7 },
    color: '#93c5fd',
  },
  'oh-serving': {
    position: 'outside', label: 'Serving OH',
    description: 'Jump serve weapon, aggressive service game, can run the offense from the line',
    ratings: { attack: 6, block: 4, serve: 10, pass: 5, defense: 5, set: 3, speed: 6 },
    color: '#1e40af',
  },

  // ── Middle Blocker (MB) — 5 archetypes ──
  'mb-blocker': {
    position: 'middle', label: 'Blocking MB',
    description: 'Elite read blocker, dominates the net, shuts down opposing hitters',
    ratings: { attack: 6, block: 10, serve: 5, pass: 3, defense: 3, set: 2, speed: 4 },
    color: '#b91c1c',
  },
  'mb-quick': {
    position: 'middle', label: 'Quick Attacker',
    description: 'Fast-tempo hitter, runs 1s and slides, deceptive with the setter',
    ratings: { attack: 8, block: 6, serve: 5, pass: 3, defense: 3, set: 2, speed: 9 },
    color: '#dc2626',
  },
  'mb-hybrid': {
    position: 'middle', label: 'Hybrid MB',
    description: 'Balanced blocker-attacker, contributes both offensively and defensively at the net',
    ratings: { attack: 7, block: 8, serve: 5, pass: 3, defense: 3, set: 2, speed: 6 },
    color: '#ef4444',
  },
  'mb-slide': {
    position: 'middle', label: 'Slide Specialist',
    description: 'Runs slide attacks and combination plays, lateral movement along the net',
    ratings: { attack: 8, block: 5, serve: 4, pass: 2, defense: 3, set: 2, speed: 10 },
    color: '#f87171',
  },
  'mb-serving': {
    position: 'middle', label: 'Serving MB',
    description: 'Strong jump serve from the middle, keeps points going on serve rotation',
    ratings: { attack: 7, block: 7, serve: 8, pass: 3, defense: 3, set: 2, speed: 5 },
    color: '#991b1b',
  },

  // ── Setter (S) — 5 archetypes ──
  's-distributor': {
    position: 'setter', label: 'Distributor',
    description: 'Orchestrator with deceptive hands, reads the block, runs complex offense',
    ratings: { attack: 3, block: 4, serve: 5, pass: 6, defense: 5, set: 10, speed: 6 },
    color: '#a16207',
  },
  's-athletic': {
    position: 'setter', label: 'Athletic Setter',
    description: 'Physical presence at the net, dumps and blocks, competitive front-row player',
    ratings: { attack: 6, block: 7, serve: 6, pass: 5, defense: 4, set: 7, speed: 5 },
    color: '#ca8a04',
  },
  's-defensive': {
    position: 'setter', label: 'Defensive Setter',
    description: 'Floor general with great defense, keeps the ball alive, steady back-row setter',
    ratings: { attack: 3, block: 3, serve: 5, pass: 7, defense: 7, set: 8, speed: 6 },
    color: '#eab308',
  },
  's-jump-serve': {
    position: 'setter', label: 'Jump-Serve Setter',
    description: 'Aggressive server who also sets, tough serving rotation for opponents',
    ratings: { attack: 4, block: 4, serve: 9, pass: 5, defense: 4, set: 8, speed: 5 },
    color: '#fbbf24',
  },
  's-tempo': {
    position: 'setter', label: 'Tempo Setter',
    description: 'Quick-sets middles consistently, speeds up the offense, great connection with MBs',
    ratings: { attack: 3, block: 4, serve: 5, pass: 5, defense: 5, set: 9, speed: 8 },
    color: '#d97706',
  },

  // ── Opposite (OPP) — 5 archetypes ──
  'opp-cannon': {
    position: 'opposite', label: 'Cannon OPP',
    description: 'Primary scorer, high ball out of back row, biggest serve on the team',
    ratings: { attack: 10, block: 5, serve: 9, pass: 2, defense: 3, set: 2, speed: 5 },
    color: '#15803d',
  },
  'opp-balanced': {
    position: 'opposite', label: 'Balanced OPP',
    description: 'Solid all-around, good block, decent back-row defense, reliable scoring',
    ratings: { attack: 7, block: 7, serve: 6, pass: 4, defense: 6, set: 3, speed: 5 },
    color: '#16a34a',
  },
  'opp-blocker': {
    position: 'opposite', label: 'Blocking OPP',
    description: 'Right-side blocking anchor, forms a wall with the middle, strong net presence',
    ratings: { attack: 6, block: 9, serve: 5, pass: 3, defense: 4, set: 3, speed: 4 },
    color: '#22c55e',
  },
  'opp-backrow': {
    position: 'opposite', label: 'Back-Row OPP',
    description: 'Excels hitting D-balls from behind the 3m line, effective in all 6 rotations',
    ratings: { attack: 8, block: 5, serve: 7, pass: 4, defense: 5, set: 2, speed: 7 },
    color: '#4ade80',
  },
  'opp-utility': {
    position: 'opposite', label: 'Utility OPP',
    description: 'Swiss army knife — can pass, defend, and score; plugs gaps in any rotation',
    ratings: { attack: 6, block: 6, serve: 6, pass: 6, defense: 6, set: 4, speed: 6 },
    color: '#86efac',
  },

  // ── Libero (L) — 4 archetypes ──
  'l-passer': {
    position: 'libero', label: 'Passing Libero',
    description: 'Elite serve-receive, platform control, steady hands, pass-first mentality',
    ratings: { attack: 1, block: 1, serve: 1, pass: 10, defense: 6, set: 5, speed: 6 },
    color: '#c2410c',
  },
  'l-defender': {
    position: 'libero', label: 'Defensive Libero',
    description: 'Incredible range, digs everything, high-energy, covers the entire back court',
    ratings: { attack: 1, block: 1, serve: 1, pass: 6, defense: 10, set: 4, speed: 9 },
    color: '#ea580c',
  },
  'l-allround': {
    position: 'libero', label: 'All-Round Libero',
    description: 'Strong in both passing and defense, reliable second setter, floor quarterback',
    ratings: { attack: 1, block: 1, serve: 1, pass: 8, defense: 8, set: 6, speed: 7 },
    color: '#f97316',
  },
  'l-setter': {
    position: 'libero', label: 'Setting Libero',
    description: 'Sets from back row when setter digs, excellent hands, offensive facilitator',
    ratings: { attack: 1, block: 1, serve: 1, pass: 7, defense: 7, set: 8, speed: 6 },
    color: '#fb923c',
  },

  // ── Defensive Specialist (DS) — 3 archetypes ──
  'ds-passer': {
    position: 'ds', label: 'Passing DS',
    description: 'Comes in to stabilize serve-receive, steady platform, consistent passers',
    ratings: { attack: 2, block: 2, serve: 5, pass: 9, defense: 7, set: 4, speed: 6 },
    color: '#7c3aed',
  },
  'ds-serving': {
    position: 'ds', label: 'Serving DS',
    description: 'Sub for back-row serving specialist, tough float or jump serve, then plays defense',
    ratings: { attack: 3, block: 2, serve: 9, pass: 6, defense: 6, set: 3, speed: 5 },
    color: '#8b5cf6',
  },
  'ds-allround': {
    position: 'ds', label: 'All-Round DS',
    description: 'Versatile back-row player, can pass, serve, and defend at a high level',
    ratings: { attack: 3, block: 2, serve: 7, pass: 7, defense: 7, set: 4, speed: 6 },
    color: '#a78bfa',
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
    .filter(a => a.value > 1)
    .sort((a, b) => a.value - b.value)
    .slice(0, 2);
}

/**
 * Compute lineup-wide attribute averages from starters + libero.
 */
function computeLineupProfile(starters, libero) {
  const sums = {};
  const counts = {};
  ATTRIBUTES.forEach(a => { sums[a] = 0; counts[a] = 0; });

  const allPlayers = [...starters.map(s => s.player)];
  if (libero) allPlayers.push(libero);

  for (const p of allPlayers) {
    // Use baseRatings first, then archetype ratings
    const ratings = p.baseRatings || (p.archetype && ARCHETYPES[p.archetype]?.ratings);
    if (!ratings) continue;
    for (const attr of ATTRIBUTES) {
      sums[attr] += ratings[attr] || 0;
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

  const starters = [];
  for (let pos = 1; pos <= 6; pos++) {
    const pid = lineup.slots[pos];
    if (pid && rosterById[pid]) {
      starters.push({ slot: pos, player: rosterById[pid] });
    }
  }

  const libero = lineup.liberoId ? rosterById[lineup.liberoId] : null;

  if (starters.length < 6) {
    issues.push({ severity: 'error', text: `Only ${starters.length}/6 starters assigned` });
  }

  const posCount = {};
  starters.forEach(s => {
    posCount[s.player.position] = (posCount[s.player.position] || 0) + 1;
  });

  if (lineup.system === '5-1') {
    if ((posCount.setter || 0) !== 1) issues.push({ severity: 'error', text: `5-1 needs exactly 1 setter (have ${posCount.setter || 0})` });
    if ((posCount.outside || 0) < 2) issues.push({ severity: 'warning', text: `5-1 typically has 2 outside hitters (have ${posCount.outside || 0})` });
    if ((posCount.middle || 0) < 2) issues.push({ severity: 'warning', text: `5-1 typically has 2 middle blockers (have ${posCount.middle || 0})` });
    if ((posCount.opposite || 0) !== 1) issues.push({ severity: 'warning', text: `5-1 needs 1 opposite (have ${posCount.opposite || 0})` });

    const setterSlot = starters.find(s => s.player.position === 'setter')?.slot;
    const oppSlot = starters.find(s => s.player.position === 'opposite')?.slot;
    if (setterSlot && oppSlot) {
      if (Math.abs(setterSlot - oppSlot) === 3) {
        strengths.push('Setter and opposite correctly opposite each other');
      } else {
        issues.push({ severity: 'warning', text: 'Setter and opposite should be 3 positions apart' });
        suggestions.push(`Move opposite to position ${((setterSlot + 2) % 6) + 1} for 5-1 alignment`);
      }
    }

    const ohSlots = starters.filter(s => s.player.position === 'outside').map(s => s.slot);
    if (ohSlots.length === 2 && Math.abs(ohSlots[0] - ohSlots[1]) === 3) {
      strengths.push('Outside hitters correctly opposite each other');
    } else if (ohSlots.length === 2) {
      suggestions.push('Outside hitters should be 3 positions apart');
    }

    const mbSlots = starters.filter(s => s.player.position === 'middle').map(s => s.slot);
    if (mbSlots.length === 2 && Math.abs(mbSlots[0] - mbSlots[1]) === 3) {
      strengths.push('Middle blockers correctly opposite each other');
    } else if (mbSlots.length === 2) {
      suggestions.push('Middle blockers should be 3 positions apart');
    }
  }

  if (!libero) {
    suggestions.push('Assign a libero for back-row substitution');
  } else {
    strengths.push(`Libero (${libero.name}) will sub for middles in back row`);
  }

  const profile = computeLineupProfile(starters, libero);
  const highAttrs = ATTRIBUTES.filter(a => profile[a] >= 7);
  const lowAttrs = ATTRIBUTES.filter(a => profile[a] > 0 && profile[a] <= 3.5);

  highAttrs.forEach(a => strengths.push(`Strong ${ATTRIBUTE_LABELS[a]} across lineup (avg ${profile[a]})`));
  lowAttrs.forEach(a => issues.push({ severity: 'warning', text: `Weak ${ATTRIBUTE_LABELS[a]} across lineup (avg ${profile[a]})` }));

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, Math.min(100, 100 - errorCount * 25 - warningCount * 10 + strengths.length * 5));

  return { issues, strengths, suggestions, score, profile };
}
