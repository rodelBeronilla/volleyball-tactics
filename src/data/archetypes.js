/**
 * Player archetypes and composition analysis.
 *
 * Archetypes refine the base position (OH, MB, S, OPP, L) with
 * play-style tendencies that affect lineup composition decisions.
 */

export const ARCHETYPES = {
  // Outside Hitter archetypes
  'oh-power': {
    position: 'outside',
    label: 'Power OH',
    description: 'High ball, cross-court dominant, strong serve',
    strengths: ['kill%', 'serve', 'block'],
    weaknesses: ['passing', 'speed'],
    color: '#2563eb',
  },
  'oh-allround': {
    position: 'outside',
    label: 'All-Round OH',
    description: 'Balanced hitter-passer, serve-receive anchor',
    strengths: ['passing', 'kill%', 'defense'],
    weaknesses: [],
    color: '#3b82f6',
  },
  'oh-defensive': {
    position: 'outside',
    label: 'Defensive OH',
    description: 'Serve-receive specialist, high dig rate, smart shots',
    strengths: ['passing', 'defense', 'serve-receive'],
    weaknesses: ['kill%', 'block'],
    color: '#60a5fa',
  },

  // Middle Blocker archetypes
  'mb-blocker': {
    position: 'middle',
    label: 'Blocking MB',
    description: 'Read blocker, dominates the net, slower transition',
    strengths: ['block', 'intimidation'],
    weaknesses: ['speed', 'back-row'],
    color: '#dc2626',
  },
  'mb-quick': {
    position: 'middle',
    label: 'Quick MB',
    description: 'Fast tempo attacker, slides, combination plays',
    strengths: ['speed', 'kill%', 'transition'],
    weaknesses: ['block-solo'],
    color: '#ef4444',
  },

  // Setter archetypes
  's-distributer': {
    position: 'setter',
    label: 'Distributor Setter',
    description: 'Runs complex offense, deceptive hands, orchestrator',
    strengths: ['setting', 'decision-making', 'deception'],
    weaknesses: ['attack', 'block'],
    color: '#d97706',
  },
  's-athletic': {
    position: 'setter',
    label: 'Athletic Setter',
    description: 'Dumps, blocks well, physical presence at net',
    strengths: ['setting', 'attack', 'block'],
    weaknesses: ['deception'],
    color: '#f59e0b',
  },

  // Opposite archetypes
  'opp-cannon': {
    position: 'opposite',
    label: 'Cannon OPP',
    description: 'Primary scorer, high ball out of back row, big serve',
    strengths: ['kill%', 'serve', 'back-row-attack'],
    weaknesses: ['defense', 'passing'],
    color: '#16a34a',
  },
  'opp-balanced': {
    position: 'opposite',
    label: 'Balanced OPP',
    description: 'Solid all-around, good block, decent back-row',
    strengths: ['block', 'kill%', 'defense'],
    weaknesses: [],
    color: '#22c55e',
  },

  // Libero archetypes
  'l-passer': {
    position: 'libero',
    label: 'Passing Libero',
    description: 'Elite serve-receive, platform control, steady hands',
    strengths: ['serve-receive', 'passing', 'consistency'],
    weaknesses: ['defense-range'],
    color: '#ea580c',
  },
  'l-defender': {
    position: 'libero',
    label: 'Defensive Libero',
    description: 'Incredible range, digs everything, high-energy',
    strengths: ['defense', 'range', 'hustle'],
    weaknesses: ['serve-receive'],
    color: '#f97316',
  },
};

/**
 * Analyze lineup composition and return fit scores + suggestions.
 */
export function analyzeComposition(players, lineup) {
  const issues = [];
  const strengths = [];
  const suggestions = [];

  if (!lineup) return { issues, strengths, suggestions, score: 0 };

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
    // Ideal 5-1: 1 setter, 2 outside, 2 middle, 1 opposite
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

    // Check setter is opposite the opposite (across the net)
    const setterSlot = starters.find(s => s.player.position === 'setter')?.slot;
    const oppSlot = starters.find(s => s.player.position === 'opposite')?.slot;
    if (setterSlot && oppSlot) {
      // In a standard 5-1, setter and opposite should be 3 apart (across rotation)
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

  // Archetype analysis
  starters.forEach(s => {
    if (s.player.archetype) {
      const arch = ARCHETYPES[s.player.archetype];
      if (arch) {
        strengths.push(`${s.player.name}: ${arch.label} — ${arch.description}`);
      }
    }
  });

  // Score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 10 + strengths.length * 5);

  return { issues, strengths, suggestions, score: Math.min(100, score) };
}
