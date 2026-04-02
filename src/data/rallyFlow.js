/**
 * Rally flow generator — creates a rotation-specific step sequence
 * showing every in-system option for attack and defense.
 *
 * Each step has:
 *   - id: unique step identifier
 *   - label: what's displayed
 *   - description: explanation of what's happening
 *   - formationId: which formation to use for positions
 *   - showRoutes: whether movement arrows are visible
 *   - showCoverage: whether zone overlays are visible
 *   - showOverlap: whether overlap violations show
 *   - ballPos: {x, y} ball position
 *   - ballPath: SVG path for ball flight arc (from previous position)
 *   - ballLabel: text on the ball
 */

import { SLOT_ROLE_MAP } from './strategyData';

const SETTER_TARGET = { x: 68, y: 8 };

// Attack zone coordinates
const ZONES = {
  pin4: { x: 8, y: 3 },    // Zone 4 — left pin (OH attack)
  quick: { x: 38, y: 3 },   // Zone 3 — quick/1-ball (MB)
  slide: { x: 55, y: 3 },   // Zone 3 slide (MB)
  pin2: { x: 82, y: 3 },    // Zone 2 — right pin (OPP)
  pipe: { x: 45, y: 28 },   // Back-row pipe (behind 3m)
  dball: { x: 75, y: 28 },  // Back-row D-ball (right)
  dump: { x: 55, y: 2 },    // Setter dump
};

/**
 * Generate the full rally step sequence for a specific rotation.
 * This is THE function that creates the playbook experience.
 */
export function generateRallySteps(rotation) {
  const roleMap = SLOT_ROLE_MAP[rotation];

  // Determine who's front row and back row
  const frontRow = {}; // pos → role
  const backRow = {};
  for (let pos = 1; pos <= 6; pos++) {
    const role = roleMap[pos];
    if (pos === 2 || pos === 3 || pos === 4) {
      frontRow[pos] = role;
    } else {
      backRow[pos] = role;
    }
  }

  // Find setter position
  let setterPos = null;
  for (let pos = 1; pos <= 6; pos++) {
    if (roleMap[pos] === 'S') { setterPos = pos; break; }
  }
  const setterFront = setterPos === 2 || setterPos === 3 || setterPos === 4;

  // Identify available attack options
  const attackOptions = [];
  for (let pos = 2; pos <= 4; pos++) {
    const role = roleMap[pos];
    if (role === 'S') continue; // setter doesn't attack (usually)
    if (role === 'OH1' || role === 'OH2') {
      attackOptions.push({ pos, role, zone: 'pin4', label: '4-ball (OH)', desc: 'Outside hitter attacks zone 4' });
    }
    if (role === 'MB1' || role === 'MB2') {
      attackOptions.push({ pos, role, zone: 'quick', label: 'Quick (MB)', desc: 'Middle quick attack zone 3' });
      attackOptions.push({ pos, role, zone: 'slide', label: 'Slide (MB)', desc: 'Middle slide behind setter' });
    }
    if (role === 'OPP') {
      attackOptions.push({ pos, role, zone: 'pin2', label: '2-ball (OPP)', desc: 'Opposite attacks zone 2' });
    }
  }

  // Back-row attack options
  for (let pos of [1, 5, 6]) {
    const role = roleMap[pos];
    if (role === 'S') continue;
    if (role === 'OH1' || role === 'OH2') {
      attackOptions.push({ pos, role, zone: 'pipe', label: 'Pipe (OH)', desc: 'Back-row attack center' });
    }
    if (role === 'OPP') {
      attackOptions.push({ pos, role, zone: 'dball', label: 'D-ball (OPP)', desc: 'Back-row attack right' });
    }
  }

  // Setter dump option (front row only)
  if (setterFront) {
    attackOptions.push({ pos: setterPos, role: 'S', zone: 'dump', label: 'Dump (S)', desc: 'Setter tips over on 2nd contact' });
  }

  const steps = [];

  // ═══ 1. SERVE ═══
  steps.push({
    id: 'serve', label: 'Serve', formationId: 'serve',
    description: `R${rotation}: Pre-serve. All players in legal positions. Position 1 serves.`,
    showRoutes: false, showCoverage: false, showOverlap: true,
    ballPos: { x: 75, y: 88 }, ballPath: null, ballLabel: 'Server',
  });

  // ═══ 2. SERVE → RECEIVE ═══
  steps.push({
    id: 'serve-flight', label: '→ Receive', formationId: 'serve',
    description: 'Serve contact! Ball crosses net. Players transition to receive.',
    showRoutes: true, showCoverage: false, showOverlap: false,
    ballPos: { x: 45, y: 30 }, ballPath: 'M 75,88 Q 55,-10 45,30', ballLabel: 'Serve',
  });

  steps.push({
    id: 'receive', label: 'Receive', formationId: 'sr-5-1',
    description: `W formation. ${setterFront ? 'Setter front row — 2 hitters available.' : 'Setter back row — 3 hitters, setter cheating to penetrate.'}`,
    showRoutes: false, showCoverage: false, showOverlap: false,
    ballPos: { x: 48, y: 55 }, ballPath: null, ballLabel: 'Read serve',
  });

  // ═══ 3. PASS → SETTER ═══
  steps.push({
    id: 'pass', label: 'Pass', formationId: 'sr-5-1',
    description: `Passer contacts. Ball arcs to setter.${!setterFront ? ' Setter penetrates from back row to target.' : ''}`,
    showRoutes: true, showCoverage: false, showOverlap: false,
    ballPos: SETTER_TARGET, ballPath: 'M 48,55 Q 58,30 68,8', ballLabel: 'Pass → Set',
  });

  steps.push({
    id: 'set-ready', label: 'Set Up', formationId: 'pass',
    description: `Setter at target. Reading the block.${setterFront ? ' Dump is an option.' : ''} ${attackOptions.length} attack options available.`,
    showRoutes: false, showCoverage: false, showOverlap: false,
    ballPos: SETTER_TARGET, ballPath: null, ballLabel: 'Setter reads',
  });

  // ═══ 4. ATTACK OPTIONS — one step per option ═══
  for (const opt of attackOptions) {
    const targetZone = ZONES[opt.zone];
    steps.push({
      id: `attack-${opt.zone}-${opt.pos}`, label: opt.label, formationId: 'pass',
      description: `Option: ${opt.desc}`,
      showRoutes: false, showCoverage: false, showOverlap: false,
      ballPos: targetZone,
      ballPath: `M ${SETTER_TARGET.x},${SETTER_TARGET.y} Q ${(SETTER_TARGET.x + targetZone.x) / 2},${Math.min(SETTER_TARGET.y, targetZone.y) - 5} ${targetZone.x},${targetZone.y}`,
      ballLabel: opt.label,
      attackOption: opt, // extra metadata
    });
  }

  // ═══ 5. ATTACK EXECUTE + COVERAGE ═══
  steps.push({
    id: 'attack', label: 'Attack!', formationId: 'offense',
    description: 'Hitters at attack zones. 3-2 coverage cup behind attacker.',
    showRoutes: false, showCoverage: true, showOverlap: false,
    ballPos: { x: 30, y: -5 }, ballPath: `M ${ZONES.pin4.x},${ZONES.pin4.y} Q 20,-4 30,-5`, ballLabel: 'Over net!',
  });

  // ═══ 6. DEFENSE ═══
  steps.push({
    id: 'defense-plan', label: '→ Defense', formationId: 'offense',
    description: 'Rally continues! Transition to perimeter defense.',
    showRoutes: true, showCoverage: false, showOverlap: false,
    ballPos: { x: 40, y: -8 }, ballPath: null, ballLabel: 'Opponent has ball',
  });

  steps.push({
    id: 'defense', label: 'Defense', formationId: 'def-perimeter',
    description: 'Perimeter defense (2-0-4). 2 blockers close, 4 diggers on perimeter.',
    showRoutes: false, showCoverage: true, showOverlap: false,
    ballPos: { x: 50, y: 35 }, ballPath: 'M 40,-8 Q 46,12 50,35', ballLabel: 'Opponent attacks',
  });

  // ═══ 7. TRANSITION ═══
  steps.push({
    id: 'dig', label: 'Dig!', formationId: 'def-perimeter',
    description: 'Ball dug! Setter releases to target. Hitters approach for counter.',
    showRoutes: true, showCoverage: false, showOverlap: false,
    ballPos: { x: 50, y: 30 }, ballPath: 'M 50,35 Q 50,32 50,30', ballLabel: 'Dig up!',
  });

  steps.push({
    id: 'transition', label: 'Counter', formationId: 'transition',
    description: `Transition offense. Setter at target. ${attackOptions.length} options again.`,
    showRoutes: false, showCoverage: false, showOverlap: false,
    ballPos: SETTER_TARGET, ballPath: 'M 50,30 Q 60,18 68,8', ballLabel: 'Set → Counter',
  });

  return steps;
}
