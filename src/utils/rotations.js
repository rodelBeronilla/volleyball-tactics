/**
 * Derive slot assignments after N rotations.
 * baseSlots: { 1: playerId, 2: playerId, ..., 6: playerId } (Rotation 1)
 * rotationNumber: 1-6
 * Returns new slots map.
 *
 * Volleyball clockwise rotation:
 *   After 1 rotation: pos 1 gets player from pos 2, pos 2 from 3, etc.
 *   Player at pos 1 moves to pos 6, pos 6 to 5, pos 5 to 4, etc.
 */
export function deriveRotation(baseSlots, rotationNumber) {
  const shift = rotationNumber - 1;
  const result = {};
  for (let pos = 1; pos <= 6; pos++) {
    const sourcePos = ((pos + shift - 1) % 6) + 1;
    result[pos] = baseSlots[sourcePos];
  }
  return result;
}

/**
 * Check if a rotational position is front row.
 */
export function isFrontRow(pos) {
  return pos === 2 || pos === 3 || pos === 4;
}

/**
 * Check if a rotational position is back row.
 */
export function isBackRow(pos) {
  return pos === 1 || pos === 5 || pos === 6;
}

/**
 * Get rotation label (R1 - R6).
 */
export function rotationLabel(n) {
  return `R${n}`;
}
