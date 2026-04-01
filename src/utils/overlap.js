/**
 * Check overlap legality for pre-serve positioning.
 * placements: [{ rotationalPosition, x, y }, ...]
 * Returns array of violation objects.
 *
 * Rules (court: net at y=0, end line at y=90):
 * - Front row must have LOWER y than corresponding back row
 * - Left side must have LOWER x than center/right in same row
 */
export function checkOverlapLegality(placements) {
  const byPos = {};
  placements.forEach(p => { byPos[p.rotationalPosition] = p; });

  const violations = [];

  // Front-Back: front player must be closer to net (lower y)
  const frontBackPairs = [[4, 5], [3, 6], [2, 1]];
  for (const [front, back] of frontBackPairs) {
    if (byPos[front] && byPos[back] && byPos[front].y >= byPos[back].y) {
      violations.push({
        rule: 'front-back',
        pos1: front,
        pos2: back,
        description: `Position ${front} must be closer to net than ${back}`,
      });
    }
  }

  // Left-Right front row: 4 left of 3, 3 left of 2
  const frontLR = [[4, 3], [3, 2]];
  for (const [left, right] of frontLR) {
    if (byPos[left] && byPos[right] && byPos[left].x >= byPos[right].x) {
      violations.push({
        rule: 'left-right',
        pos1: left,
        pos2: right,
        description: `Position ${left} must be left of ${right}`,
      });
    }
  }

  // Left-Right back row: 5 left of 6, 6 left of 1
  const backLR = [[5, 6], [6, 1]];
  for (const [left, right] of backLR) {
    if (byPos[left] && byPos[right] && byPos[left].x >= byPos[right].x) {
      violations.push({
        rule: 'left-right',
        pos1: left,
        pos2: right,
        description: `Position ${left} must be left of ${right}`,
      });
    }
  }

  return violations;
}
