/**
 * Offensive and defensive responsibilities per rotational position,
 * per formation/system, per rotation (1-6).
 *
 * Each entry maps rotational position (1-6) to a responsibility string.
 */

// 5-1 Offensive Responsibilities
// Describes what each rotational position does on offense in each rotation
export const OFFENSE_5_1 = {
  1: { // Setter at pos 1 (RB) — penetrates
    1: 'Penetrate → set',
    2: 'Pipe / right-side hit',
    3: 'Quick middle / slide',
    4: 'Outside hit (pin)',
    5: 'Back-row attack (D)',
    6: 'Back-row attack (pipe)',
  },
  2: { // Setter at pos 6 (CB)
    1: 'Back-row attack (D)',
    2: 'Right-side hit',
    3: 'Outside hit (4)',
    4: 'Quick middle / slide',
    5: 'Dig → transition',
    6: 'Penetrate → set',
  },
  3: { // Setter at pos 5 (LB)
    1: 'Dig → transition',
    2: 'Outside hit (4)',
    3: 'Right-side hit (2)',
    4: 'Outside hit (pin)',
    5: 'Penetrate → set',
    6: 'Back-row attack (pipe)',
  },
  4: { // Setter at pos 4 (LF) — front row
    1: 'Back-row attack (D)',
    2: 'Quick middle / slide',
    3: 'Outside hit (4)',
    4: 'Set from LF / dump',
    5: 'Right-side hit (2)',
    6: 'Back-row attack (pipe)',
  },
  5: { // Setter at pos 3 (CF)
    1: 'Back-row attack (D)',
    2: 'Outside hit (4)',
    3: 'Set from CF / dump',
    4: 'Quick middle / slide',
    5: 'Dig → transition',
    6: 'Right-side hit (2)',
  },
  6: { // Setter at pos 2 (RF)
    1: 'Dig → transition',
    2: 'Set from RF / dump',
    3: 'Outside hit (4)',
    4: 'Outside hit (pin)',
    5: 'Right-side hit',
    6: 'Quick middle / slide',
  },
};

// 5-1 Defensive Responsibilities
export const DEFENSE_5_1 = {
  1: {
    1: 'Right-back defense / serve',
    2: 'RF block (1-on-1 / assist)',
    3: 'CF block (middle read)',
    4: 'LF block (pin)',
    5: 'LB dig (line/cross)',
    6: 'CB deep read (6-back)',
  },
  2: {
    1: 'RB dig (cross)',
    2: 'RF block (pin)',
    3: 'CF block (middle read)',
    4: 'LF block (outside)',
    5: 'LB dig (line)',
    6: 'CB read → cover tip',
  },
  3: {
    1: 'RB dig (seam)',
    2: 'RF block (right-side)',
    3: 'CF block (slide/quick)',
    4: 'LF block (pin)',
    5: 'LB dig (line)',
    6: 'CB deep read',
  },
  4: {
    1: 'RB dig (cross)',
    2: 'RF block (quick/slide)',
    3: 'CF block (outside)',
    4: 'LF block / set transition',
    5: 'LB dig → cover',
    6: 'CB deep read',
  },
  5: {
    1: 'RB dig (cross)',
    2: 'RF block (outside hit)',
    3: 'CF set / block middle',
    4: 'LF block (slide)',
    5: 'LB dig (line) → cover',
    6: 'CB dig (pipe/cross)',
  },
  6: {
    1: 'RB dig → transition',
    2: 'RF set / block (right)',
    3: 'CF block (outside)',
    4: 'LF block (middle)',
    5: 'LB dig (cross)',
    6: 'CB dig (pipe) → cover',
  },
};

export const RESPONSIBILITY_SETS = [
  { id: 'off-5-1', name: 'Offense (5-1)', type: 'offense', data: OFFENSE_5_1 },
  { id: 'def-5-1', name: 'Defense (5-1)', type: 'defense', data: DEFENSE_5_1 },
];

export function getResponsibilities(setId, rotation) {
  const set = RESPONSIBILITY_SETS.find(s => s.id === setId);
  if (!set) return null;
  return set.data[rotation] || null;
}
