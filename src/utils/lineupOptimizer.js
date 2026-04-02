/**
 * Lineup Optimizer — finds the slot assignment that maximizes composite lineup score.
 *
 * For a 5-1 system with constraints (1S, 2OH, 2MB, 1OPP, opposite pairs 3 apart),
 * the permutation space is small (~24 combinations). Brute-force is instant.
 */

import { ATTRIBUTES } from '../data/archetypes';

/**
 * Generate all valid 5-1 slot assignments for given players.
 * Constraints: S+OPP must be 3 apart, OH1+OH2 must be 3 apart, MB1+MB2 must be 3 apart.
 */
function generateValidAssignments(setter, opposite, outsides, middles) {
  const assignments = [];

  // Valid opposite-pair slot assignments: (1,4), (2,5), (3,6)
  const oppositePairs = [[1, 4], [2, 5], [3, 6]];

  for (const [sSlot, oSlot] of oppositePairs) {
    // Remaining 4 slots
    const remaining = [1, 2, 3, 4, 5, 6].filter(s => s !== sSlot && s !== oSlot);

    // Find which remaining pairs are 3 apart (for OH and MB pairs)
    const pairs = [];
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        if (Math.abs(remaining[i] - remaining[j]) === 3) {
          pairs.push([remaining[i], remaining[j]]);
        }
      }
    }

    // We need exactly 2 pairs from the remaining 4 slots
    if (pairs.length < 2) continue;

    for (let pi = 0; pi < pairs.length; pi++) {
      for (let pj = pi + 1; pj < pairs.length; pj++) {
        const ohPair = pairs[pi];
        const mbPair = pairs[pj];
        // Verify no overlap
        const allSlots = new Set([...ohPair, ...mbPair]);
        if (allSlots.size !== 4) continue;
        // Verify these are exactly the remaining slots
        if (!remaining.every(s => allSlots.has(s))) continue;

        // Try both OH orderings and both MB orderings
        for (const [oh1Slot, oh2Slot] of [ohPair, [ohPair[1], ohPair[0]]]) {
          for (const [mb1Slot, mb2Slot] of [mbPair, [mbPair[1], mbPair[0]]]) {
            const slots = {};
            slots[sSlot] = setter.id;
            slots[oSlot] = opposite.id;
            slots[oh1Slot] = outsides[0].id;
            slots[oh2Slot] = outsides[1].id;
            slots[mb1Slot] = middles[0].id;
            slots[mb2Slot] = middles[1].id;
            assignments.push(slots);
          }
        }
      }
    }
  }

  return assignments;
}

/**
 * Score a slot assignment across all 6 rotations using player profiles.
 * @param {Object} slots - { 1: playerId, ..., 6: playerId }
 * @param {Object} profiles - { playerId: profile } from playerProfileEngine
 * @param {number} weakRotationWeight - extra weight for the weakest rotation (default 1.5)
 * @returns {{ total, rotationScores: { 1: score, ..., 6: score } }}
 */
function scoreAssignment(slots, profiles, weakRotationWeight = 1.5) {
  const rotationScores = {};

  for (let r = 1; r <= 6; r++) {
    let rotScore = 0;
    let contributors = 0;

    // For each slot in this rotation, check player's profile for this rotation
    for (let pos = 1; pos <= 6; pos++) {
      const playerId = slots[pos];
      const profile = profiles[playerId];
      if (!profile) continue;

      // Use effective ratings as base score
      const ratings = profile.effectiveRatings;
      if (!ratings) continue;

      // Weight by what matters in each row position
      const isFront = pos === 2 || pos === 3 || pos === 4;
      if (isFront) {
        rotScore += (ratings.attack || 5) * 0.35 + (ratings.block || 5) * 0.35 + (ratings.serve || 5) * 0.1 + (ratings.set || 5) * 0.1 + (ratings.speed || 5) * 0.1;
      } else {
        rotScore += (ratings.pass || 5) * 0.3 + (ratings.defense || 5) * 0.3 + (ratings.serve || 5) * 0.15 + (ratings.attack || 5) * 0.15 + (ratings.set || 5) * 0.1;
      }
      contributors++;
    }

    rotationScores[r] = contributors > 0 ? rotScore / contributors : 0;
  }

  // Composite: average of all rotations, but penalize weak rotations more
  const scores = Object.values(rotationScores);
  const minScore = Math.min(...scores);
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;

  // Blend: average + extra weight for weakest rotation
  const total = Math.round((avgScore + minScore * (weakRotationWeight - 1)) / weakRotationWeight * 100) / 100;

  return { total, rotationScores };
}

/**
 * Find the optimal slot assignment for a 5-1 system.
 * @param {Array} players - all roster players
 * @param {Object} profiles - { playerId: profile } from playerProfileEngine
 * @returns {{ bestSlots, bestScore, rotationScores, allCandidates }}
 */
export function optimizeSlotAssignment(players, profiles) {
  // Group players by position
  const setters = players.filter(p => p.position === 'setter');
  const opposites = players.filter(p => p.position === 'opposite');
  const outsides = players.filter(p => p.position === 'outside');
  const middles = players.filter(p => p.position === 'middle');

  if (setters.length < 1 || opposites.length < 1 || outsides.length < 2 || middles.length < 2) {
    return { bestSlots: null, bestScore: 0, rotationScores: {}, allCandidates: [], error: 'Insufficient players for 5-1 system' };
  }

  // Try all combinations of player selections + slot assignments
  const allCandidates = [];

  for (const setter of setters) {
    for (const opposite of opposites) {
      // All pairs of outsides
      for (let oi = 0; oi < outsides.length; oi++) {
        for (let oj = oi + 1; oj < outsides.length; oj++) {
          const ohPair = [outsides[oi], outsides[oj]];
          // All pairs of middles
          for (let mi = 0; mi < middles.length; mi++) {
            for (let mj = mi + 1; mj < middles.length; mj++) {
              const mbPair = [middles[mi], middles[mj]];
              const assignments = generateValidAssignments(setter, opposite, ohPair, mbPair);
              for (const slots of assignments) {
                const { total, rotationScores } = scoreAssignment(slots, profiles);
                allCandidates.push({ slots, score: total, rotationScores });
              }
            }
          }
        }
      }
    }
  }

  allCandidates.sort((a, b) => b.score - a.score);
  const best = allCandidates[0];

  return {
    bestSlots: best?.slots || null,
    bestScore: best?.score || 0,
    rotationScores: best?.rotationScores || {},
    allCandidates: allCandidates.slice(0, 10), // top 10
  };
}

/**
 * What-if swap: compute score delta if two slots are swapped.
 */
export function computeSwapDelta(currentSlots, profiles, slotA, slotB) {
  const before = scoreAssignment(currentSlots, profiles);
  const swapped = { ...currentSlots };
  const temp = swapped[slotA];
  swapped[slotA] = swapped[slotB];
  swapped[slotB] = temp;
  const after = scoreAssignment(swapped, profiles);

  const rotationDeltas = {};
  for (let r = 1; r <= 6; r++) {
    rotationDeltas[r] = Math.round((after.rotationScores[r] - before.rotationScores[r]) * 100) / 100;
  }

  return {
    before: before.total,
    after: after.total,
    delta: Math.round((after.total - before.total) * 100) / 100,
    rotationDeltas,
    swappedSlots: swapped,
  };
}
