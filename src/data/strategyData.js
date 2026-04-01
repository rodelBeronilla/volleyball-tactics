/**
 * Strategy data for 5-1 system.
 * Uses role templates + builder pattern to generate per-rotation, per-slot strategy cards.
 *
 * SLOT_ROLE_MAP[rotation][slot] → role key
 * ROLE_TEMPLATES[role][context] → strategy fields
 * buildStrategy() → STRATEGY_5_1[rotation][slot] → structured object
 */

// Map each rotation × slot → functional role
// In a 5-1: slots rotate but roles stay with players
// Slot assignment follows: S=Setter, OH1=Outside1, OH2=Outside2, MB1=Middle1, MB2=Middle2, OPP=Opposite
// Default lineup: slot1=S, slot2=OPP, slot3=MB1, slot4=OH1, slot5=MB2, slot6=OH2
export const SLOT_ROLE_MAP = {
  1: { 1: 'S',   2: 'OPP', 3: 'MB1', 4: 'OH1', 5: 'MB2', 6: 'OH2' },
  2: { 1: 'OH2', 2: 'S',   3: 'OPP', 4: 'MB1', 5: 'OH1', 6: 'MB2' },
  3: { 1: 'MB2', 2: 'OH2', 3: 'S',   4: 'OPP', 5: 'MB1', 6: 'OH1' },
  4: { 1: 'OH1', 2: 'MB2', 3: 'OH2', 4: 'S',   5: 'OPP', 6: 'MB1' },
  5: { 1: 'MB1', 2: 'OH1', 3: 'MB2', 4: 'OH2', 5: 'S',   6: 'OPP' },
  6: { 1: 'OPP', 2: 'MB1', 3: 'OH1', 4: 'OH2', 5: 'MB2', 6: 'S'   },
};

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
