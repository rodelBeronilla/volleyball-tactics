/**
 * Rotation analysis utilities.
 * Derives rotation headlines, front/back row breakdowns, and attack options.
 */

import { SLOT_ROLE_MAP } from '../data/strategyData';

const ROLE_LABELS = {
  S: 'Setter', OH1: 'Outside 1', OH2: 'Outside 2',
  MB1: 'Middle 1', MB2: 'Middle 2', OPP: 'Opposite',
};

/**
 * Analyze a rotation and produce a summary.
 * @param {number} rotation - 1-6
 * @param {Array} placements - array of { rotationalPosition, player, isLiberoIn }
 * @returns {{ headline, frontRow, backRow, attackOptions, serveReceive }}
 */
export function analyzeRotation(rotation, placements) {
  const roleMap = SLOT_ROLE_MAP[rotation] || {};
  const setterSlot = Object.entries(roleMap).find(([, role]) => role === 'S')?.[0];
  const setterPos = setterSlot ? parseInt(setterSlot) : null;
  const setterFront = setterPos === 2 || setterPos === 3 || setterPos === 4;

  // Build front/back row info
  const frontRow = [];
  const backRow = [];

  for (let slot = 1; slot <= 6; slot++) {
    const role = roleMap[slot];
    const placement = placements.find(p => p.rotationalPosition === slot);
    const playerName = placement?.player?.name || ROLE_LABELS[role];
    const isFront = slot === 2 || slot === 3 || slot === 4;
    const isLibero = placement?.isLiberoIn;

    const entry = {
      slot,
      role,
      roleLabel: isLibero ? 'Libero' : ROLE_LABELS[role],
      playerName: isLibero ? playerName + ' (L)' : playerName,
    };

    if (isFront) frontRow.push(entry);
    else backRow.push(entry);
  }

  // Headline
  const headline = setterSlot
    ? `R${rotation}: Setter in ${setterSlot} — ${setterFront ? '2' : '3'}-hitter offense`
    : `R${rotation}`;

  // Attack options based on who's where
  const attackOptions = [];
  for (let slot = 1; slot <= 6; slot++) {
    const role = roleMap[slot];
    const isFront = slot === 2 || slot === 3 || slot === 4;
    const placement = placements.find(p => p.rotationalPosition === slot);
    const isLibero = placement?.isLiberoIn;

    if (role === 'S') continue;
    if (isLibero) continue; // Libero can't attack above net height

    if (isFront) {
      switch (role) {
        case 'OH1':
        case 'OH2':
          attackOptions.push('4-ball (outside)');
          break;
        case 'MB1':
        case 'MB2':
          attackOptions.push('Quick (1)');
          attackOptions.push('Slide');
          break;
        case 'OPP':
          attackOptions.push('2-ball (right side)');
          break;
      }
    } else {
      switch (role) {
        case 'OH1':
        case 'OH2':
          attackOptions.push('Pipe (back row)');
          break;
        case 'OPP':
          attackOptions.push('D-ball (back row)');
          break;
      }
    }
  }

  // Serve receive pattern
  const passers = backRow
    .filter(p => p.role !== 'S')
    .map(p => p.playerName);
  const serveReceive = passers.length > 0
    ? `${passers.length}-passer: ${passers.join(', ')}`
    : 'No back-row passers';

  return {
    headline,
    frontRow,
    backRow,
    attackOptions: [...new Set(attackOptions)], // dedupe
    serveReceive,
  };
}
