/**
 * Volleyball stat categories — comprehensive official set.
 *
 * Covers NCAA/FIVB standard box score stats plus additional
 * trackable events for CV and manual play-by-play entry.
 * Each stat is a single event (one tap = one record).
 */

export const STATS = {
  // ── Attack ──
  kill:           { label: 'Kill',           group: 'attack',  positive: true,  attribute: 'attack' },
  attackError:    { label: 'Att Error',      group: 'attack',  positive: false, attribute: 'attack' },
  attackBlocked:  { label: 'Blocked',        group: 'attack',  positive: false, attribute: 'attack' },
  attackTip:      { label: 'Tip Kill',       group: 'attack',  positive: true,  attribute: 'attack' },
  attackTooled:   { label: 'Tooled',         group: 'attack',  positive: true,  attribute: 'attack' },
  attackAttempt:  { label: 'Attempt',        group: 'attack',  positive: true,  attribute: 'attack' }, // zero-kill attempt (kept in play)

  // ── Serve ──
  ace:            { label: 'Ace',            group: 'serve',   positive: true,  attribute: 'serve' },
  serveInPlay:    { label: 'In Play',        group: 'serve',   positive: true,  attribute: 'serve' },
  serviceError:   { label: 'Svc Error',      group: 'serve',   positive: false, attribute: 'serve' },

  // ── Serve Receive / Pass ──
  passPerfect:    { label: 'Perfect (3)',    group: 'pass',    positive: true,  attribute: 'pass' },
  passGood:       { label: 'Good (2)',       group: 'pass',    positive: true,  attribute: 'pass' },
  passPoor:       { label: 'Poor (1)',       group: 'pass',    positive: false, attribute: 'pass' },
  passError:      { label: 'Error (0)',      group: 'pass',    positive: false, attribute: 'pass' },

  // ── Block ──
  blockSolo:      { label: 'Solo Block',     group: 'block',   positive: true,  attribute: 'block' },
  blockAssist:    { label: 'Blk Assist',     group: 'block',   positive: true,  attribute: 'block' },
  blockError:     { label: 'Blk Error',      group: 'block',   positive: false, attribute: 'block' },
  blockTouch:     { label: 'Blk Touch',      group: 'block',   positive: true,  attribute: 'block' }, // touched but not stuff block

  // ── Defense / Dig ──
  dig:            { label: 'Dig',            group: 'defense', positive: true,  attribute: 'defense' },
  defenseError:   { label: 'Def Error',      group: 'defense', positive: false, attribute: 'defense' },
  freeBall:       { label: 'Free Ball',      group: 'defense', positive: true,  attribute: 'defense' },
  coverDig:       { label: 'Cover',          group: 'defense', positive: true,  attribute: 'defense' }, // coverage after own team's attack

  // ── Setting ──
  assist:         { label: 'Assist',         group: 'set',     positive: true,  attribute: 'set' },
  setError:       { label: 'Set Error',      group: 'set',     positive: false, attribute: 'set' },
  ballHandlingError: { label: 'BHE',         group: 'set',     positive: false, attribute: 'set' },
  setAttempt:     { label: 'Set Att',        group: 'set',     positive: true,  attribute: 'set' }, // set that didn't lead to kill

  // ── Rally Outcomes (team-level) ──
  rallyWon:       { label: 'Won',            group: 'rally',   positive: true,  attribute: null },
  rallyLost:      { label: 'Lost',           group: 'rally',   positive: false, attribute: null },

  // ── Violations / Misc ──
  violation:      { label: 'Violation',      group: 'misc',    positive: false, attribute: null }, // net/center/rotation violation
  substitution:   { label: 'Sub',            group: 'misc',    positive: true,  attribute: null }, // tracks substitution events
};

export const STAT_GROUPS = [
  { id: 'attack',  label: 'Attack',  stats: ['kill', 'attackTip', 'attackTooled', 'attackAttempt', 'attackError', 'attackBlocked'] },
  { id: 'serve',   label: 'Serve',   stats: ['ace', 'serveInPlay', 'serviceError'] },
  { id: 'pass',    label: 'Pass',    stats: ['passPerfect', 'passGood', 'passPoor', 'passError'] },
  { id: 'block',   label: 'Block',   stats: ['blockSolo', 'blockAssist', 'blockTouch', 'blockError'] },
  { id: 'defense', label: 'Defense', stats: ['dig', 'coverDig', 'freeBall', 'defenseError'] },
  { id: 'set',     label: 'Setting', stats: ['assist', 'setAttempt', 'setError', 'ballHandlingError'] },
  { id: 'rally',   label: 'Rally',   stats: ['rallyWon', 'rallyLost'] },
  { id: 'misc',    label: 'Misc',    stats: ['violation', 'substitution'] },
];

/** Stat groups for player-specific entry (excludes rally outcomes and misc) */
export const PLAYER_STAT_GROUPS = STAT_GROUPS.filter(g => g.id !== 'rally' && g.id !== 'misc');

/** Quick lookup: all stat keys */
export const STAT_KEYS = Object.keys(STATS);
