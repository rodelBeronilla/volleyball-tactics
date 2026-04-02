/**
 * Strategy data for 5-1 system.
 * Uses role templates + builder pattern to generate per-rotation, per-slot strategy cards.
 *
 * SLOT_ROLE_MAP[rotation][slot] → role key
 * ROLE_TEMPLATES[role][context] → strategy fields
 * buildStrategy() → STRATEGY_5_1[rotation][slot] → structured object
 */

// Static role map assuming canonical 5-1: slot1=S, slot2=OPP, slot3=MB1, slot4=OH1, slot5=MB2, slot6=OH2
// Used as fallback when no lineup data available (route/strategy pre-generation)
const DEFAULT_BASE_ROLES = { 1: 'S', 2: 'OPP', 3: 'MB1', 4: 'OH1', 5: 'MB2', 6: 'OH2' };

function buildStaticRoleMap() {
  const map = {};
  for (let rot = 1; rot <= 6; rot++) {
    map[rot] = {};
    const shift = rot - 1;
    for (let pos = 1; pos <= 6; pos++) {
      const sourceSlot = ((pos + shift - 1) % 6) + 1;
      map[rot][pos] = DEFAULT_BASE_ROLES[sourceSlot];
    }
  }
  return map;
}

// Static fallback — used for pre-built routes/strategy when no lineup context
export const SLOT_ROLE_MAP = buildStaticRoleMap();

// Position→role abbreviation mapping
const POS_TO_ROLE = {
  setter: 'S', outside: 'OH', middle: 'MB', opposite: 'OPP', libero: 'L', ds: 'DS',
};

/**
 * Dynamic role map — derives roles from actual lineup + roster.
 * Use this at render time when you have lineup and players available.
 *
 * @param {Object} lineup - { slots: {1: playerId, ...}, liberoId }
 * @param {Array} players - player objects with .id and .position
 * @param {number} rotation - 1-6
 * @returns {Object} { 1: 'S', 2: 'OH', 3: 'MB', ... } per position
 */
export function getDynamicRoleMap(lineup, players, rotation) {
  if (!lineup || !players) return SLOT_ROLE_MAP[rotation] || {};

  const shift = rotation - 1;
  const roleMap = {};
  const roleCounts = {}; // Track OH1 vs OH2, MB1 vs MB2

  for (let pos = 1; pos <= 6; pos++) {
    const sourceSlot = ((pos + shift - 1) % 6) + 1;
    const playerId = lineup.slots[sourceSlot];
    const player = playerId ? players.find(p => p.id === playerId) : null;

    if (player) {
      const baseRole = POS_TO_ROLE[player.position] || 'OH';
      // Differentiate OH1/OH2 and MB1/MB2
      if (baseRole === 'OH' || baseRole === 'MB') {
        roleCounts[baseRole] = (roleCounts[baseRole] || 0) + 1;
        roleMap[pos] = baseRole + roleCounts[baseRole];
      } else {
        roleMap[pos] = baseRole;
      }
    } else {
      // Fallback to static
      roleMap[pos] = SLOT_ROLE_MAP[rotation]?.[pos] || 'OH1';
    }
  }

  return roleMap;
}

// Role templates: front row vs back row strategies
const ROLE_TEMPLATES = {
  S: {
    front: {
      primary: 'Setter — run offense from the net',
      transition: 'Release to setting position after block',
      blocking: 'Block opposite hitter, read and seal',
      defense: 'Dig short tips behind block',
      communication: "Call set distribution pre-rally, 'MINE' on second ball",
      reads: 'Read opposing setter hands — quick vs outside',
      tip: 'Dump on 2nd ball when blockers cheat outside',
    },
    back: {
      primary: 'Setter — penetrate to net and run offense',
      transition: 'Sprint to target position (Zone 2.5) after serve/pass',
      blocking: null,
      defense: 'Back-row dig responsibility before penetrating',
      communication: "Call 'IN' when arriving at net, direct traffic pre-serve",
      reads: 'Read pass quality — adjust set selection to pass rating',
      tip: 'Get to target early, face Zone 4 with right shoulder to net',
    },
  },
  OH1: {
    front: {
      primary: 'Pin hitter — terminate from Zone 4',
      transition: '4-step approach from left antenna after pass',
      blocking: 'Block opponent OPP in Zone 2, seal outside',
      defense: 'Cover tip behind your block',
      communication: "Call 'GO' for high ball, 'HELP' for double block",
      reads: 'One blocker = power angle, two = tool or roll shot',
      tip: 'Start approach wide, attack angle maximizes court coverage',
    },
    back: {
      primary: 'Back-row attacker — pipe or D-ball',
      transition: 'Load behind 3m line, approach for back-row attack',
      blocking: null,
      defense: 'Primary passer — platform to target',
      communication: "Call 'PIPE' when available for back-row set",
      reads: 'Read server toss — short toss = float, high toss = jump serve',
      tip: 'Pass and separate — move to attack position immediately',
    },
  },
  OH2: {
    front: {
      primary: 'Left-side hitter — terminate from Zone 4',
      transition: '4-step approach, available for outside set',
      blocking: 'Block opponent right-side, help middle',
      defense: 'Cover short off the block',
      communication: "Call 'SET ME' when single block, 'OUT' on wide balls",
      reads: 'Watch setter eyes for dump attempt',
      tip: 'Mix high hands with roll shots to keep defense guessing',
    },
    back: {
      primary: 'Back-row passer and defender',
      transition: 'Pass then load for pipe if setter calls it',
      blocking: null,
      defense: 'Deep court passer — cover Zone 5/6 seam',
      communication: "Call 'FREE' on free balls, 'DEEP' on deep serves",
      reads: 'Read attacker arm — angle vs line',
      tip: 'Stay balanced on platform, shuffle to ball rather than reaching',
    },
  },
  MB1: {
    front: {
      primary: 'Middle attacker — quick (1) and slide',
      transition: 'Loaded quick approach, 3-step to hitting position',
      blocking: 'Primary blocker — read and close on outside hitters',
      defense: 'Pull off net for tip coverage after block',
      communication: "Call blocking scheme: 'SPREAD' or 'BUNCH'",
      reads: 'Read opposing setter — commit on quick, hold on high sets',
      tip: 'Fast feet on block close, press hands over net, seal with outside',
    },
    back: {
      primary: 'Substituted out for Libero (back row)',
      transition: 'N/A — Libero in',
      blocking: null,
      defense: 'N/A — Libero replaces',
      communication: 'N/A',
      reads: 'N/A',
      tip: 'Use this time to rest and study opponent patterns',
    },
  },
  MB2: {
    front: {
      primary: 'Middle attacker — quick and slide options',
      transition: 'Quick approach, ready for 1-ball or slide',
      blocking: 'Read blocker — close on pin hitters',
      defense: 'Tip coverage short middle after block',
      communication: "Call 'SLIDE' when running slide option",
      reads: 'Read pass quality — bad pass = no quick, get out',
      tip: 'Vary tempo to keep opposing middle honest',
    },
    back: {
      primary: 'Substituted out for Libero (back row)',
      transition: 'N/A — Libero in',
      blocking: null,
      defense: 'N/A — Libero replaces',
      communication: 'N/A',
      reads: 'N/A',
      tip: 'Study opposing hitter tendencies during rest',
    },
  },
  OPP: {
    front: {
      primary: 'Right-side hitter — attack from Zone 2',
      transition: 'Approach from right antenna, available for 2-ball',
      blocking: 'Block opponent outside hitter in Zone 4, seal line',
      defense: 'Dig tips behind the block',
      communication: "Call 'RIGHT' when available, 'TOOL' off the block",
      reads: 'Read opposing OH approach — line vs cross',
      tip: 'Attack high hands over block, use wipe/tool when doubled',
    },
    back: {
      primary: 'Back-row right-side attacker (D-ball)',
      transition: 'Load behind 3m line Zone 1, approach for back-row set',
      blocking: null,
      defense: 'Deep Zone 1 defense, cover right-back cross',
      communication: "Call 'D' when available for back-row right-side attack",
      reads: 'Read opposing middle — if middle commits, back-row attack opens',
      tip: 'Stay deep behind the line, approach into the ball for power',
    },
  },
};

// Serve strategy (only for position 1 — the server)
const SERVE_STRATEGIES = {
  S:   'Float serve Zone 5/6 seam — disrupt passer communication',
  OH1: 'Jump float deep Zone 1 — push passers off the net',
  OH2: 'Float serve short Zone 2/3 — target weak passer',
  MB1: 'Jump serve Zone 6 — power to middle back',
  MB2: 'Float serve Zone 5 — target left-back passer',
  OPP: 'Jump serve cross-court Zone 5 — aggressive top-spin',
};

// Per-rotation overrides for specific context
const ROTATION_OVERRIDES = {
  1: {
    1: { tip: 'Serving rotation — serve then penetrate immediately to set position' },
  },
  2: {
    6: { tip: 'Penetrate from Zone 6 — longer run, get moving on the toss' },
  },
  3: {
    5: { tip: 'Penetrate from Zone 5 — farthest run, cheat position pre-serve' },
  },
  4: {
    4: { primary: 'Setter — front row, set from Zone 4 or dump' },
  },
  5: {
    3: { primary: 'Setter — front row center, set or dump over net' },
  },
  6: {
    2: { primary: 'Setter — front row right, set from Zone 2 or dump right' },
  },
};

/**
 * Build complete strategy data for all rotations.
 * Returns STRATEGY_5_1[rotation][slot] → { primary, transition, blocking, defense, communication, reads, tip, serve? }
 */
function buildStrategy() {
  const result = {};

  for (let rot = 1; rot <= 6; rot++) {
    result[rot] = {};
    for (let slot = 1; slot <= 6; slot++) {
      const role = SLOT_ROLE_MAP[rot][slot];
      const isFront = slot === 2 || slot === 3 || slot === 4;
      const context = isFront ? 'front' : 'back';
      const template = ROLE_TEMPLATES[role][context];

      const entry = { ...template, role };

      // Add serve strategy if in position 1 (serving position)
      if (slot === 1) {
        entry.serve = SERVE_STRATEGIES[role];
      }

      // Apply per-rotation overrides
      const overrides = ROTATION_OVERRIDES[rot]?.[slot];
      if (overrides) {
        Object.assign(entry, overrides);
      }

      result[rot][slot] = entry;
    }
  }

  return result;
}

export const STRATEGY_5_1 = buildStrategy();

/**
 * Get strategy for a specific rotation and slot.
 */
export function getStrategy(rotation, slot) {
  return STRATEGY_5_1[rotation]?.[slot] || null;
}
