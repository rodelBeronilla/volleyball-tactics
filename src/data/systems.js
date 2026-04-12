export const SYSTEMS = {
  LOCKED_IN: {
    id: 'LOCKED_IN',
    name: 'Locked In',
    description: 'Competitive 5-1. Fixed 6 for full set. Best lineup, no subs.',
    benchCount: 3,
    allowSubs: false,
  },
  FLOW: {
    id: 'FLOW',
    name: 'Flow',
    description: '4-2 trio rotation. After each sideout, the server subs out for their trio bench player.',
    benchCount: 0,
    allowSubs: true,
    trioConfig: {
      setters: { label: 'Setters', positions: ['setter', 'ds'] },
      hitters: { label: 'Hitters', positions: ['outside', 'opposite'] },
      middles: { label: 'Middles', positions: ['middle'] },
    },
  },
  GROW: {
    id: 'GROW',
    name: 'Grow',
    description: 'Development / core rest. Fixed 6, developmental players get reps.',
    benchCount: 3,
    allowSubs: false,
  },
};

export const SYSTEM_LIST = Object.values(SYSTEMS);

export const FRICTION_PAIRS = [
  { id: 'alistair-david', severity: 'high', description: 'David gets nervous, makes sloppy plays under Alistair intensity' },
  { id: 'alistair-hari', severity: 'high', description: "Hari's body language drops, deflates under Alistair intensity" },
  { id: 'rochelle-hari', severity: 'medium', description: "Rochelle gets frustrated with Hari's play" },
  { id: 'alistair-rodel', severity: 'low', description: 'Short coverage positioning friction — define zones explicitly' },
];

export const BUFFER_PLAYERS = ['jill', 'bryan'];

export const SYNERGY_PAIRS = [
  { id: 'jill-alistair', label: 'Jill + Alistair', description: 'She feeds him + manages his intensity' },
  { id: 'bryan-rodel', label: 'Bryan + Rodel', description: "Bryan's steadiness keeps Rodel loose and confident" },
  { id: 'jill-bryan-alistair', label: 'Best Trio', description: 'Maximum skill with Bryan/Jill buffering Alistair' },
  { id: 'jill-bryan-rodel', label: 'Strong Trio', description: 'No chemistry risk, Bryan keeps Rodel confident' },
];

/**
 * Check for friction among on-court players.
 * @param {string[]} courtPlayerIds - IDs of players currently on court
 * @param {Object} frictionMap - Maps friction pair IDs to { playerA, playerB } player IDs
 * @param {string[]} bufferPlayerIds - Player IDs who can buffer friction
 * @returns {{ id, severity, description, playerAId, playerBId, buffered }[]}
 */
export function checkFriction(courtPlayerIds, frictionMap, bufferPlayerIds = []) {
  const onCourt = new Set(courtPlayerIds);
  const buffers = new Set(bufferPlayerIds);
  const warnings = [];
  for (const pair of FRICTION_PAIRS) {
    const mapping = frictionMap[pair.id];
    if (!mapping) continue;
    if (onCourt.has(mapping.playerA) && onCourt.has(mapping.playerB)) {
      const hasBuffer = [...buffers].some(b => onCourt.has(b));
      warnings.push({
        ...pair,
        playerAId: mapping.playerA,
        playerBId: mapping.playerB,
        buffered: hasBuffer,
      });
    }
  }
  return warnings;
}

/**
 * Validate fairness: nobody sits back-to-back sets.
 * FLOW sets count as ON for everyone (trio rotation).
 * @param {Object} nightPlan
 * @param {Object[]} players
 * @returns {{ valid: boolean, violations: { playerId, sets: [number, number] }[] }}
 */
export function validateFairness(nightPlan, players) {
  if (!nightPlan?.matches) return { valid: true, violations: [] };
  const allIds = players.map(p => p.id);
  const setSequence = [];
  for (const match of nightPlan.matches) {
    for (const set of (match.sets || [])) {
      setSequence.push(set);
    }
  }
  const sittingPerSet = setSequence.map(set => {
    if (set.system === 'FLOW') return new Set();
    const onCourt = new Set(set.servingOrder || []);
    const sitting = new Set();
    for (const pid of allIds) {
      if (!onCourt.has(pid)) sitting.add(pid);
    }
    return sitting;
  });
  const violations = [];
  for (let i = 1; i < sittingPerSet.length; i++) {
    for (const pid of allIds) {
      if (sittingPerSet[i - 1].has(pid) && sittingPerSet[i].has(pid)) {
        violations.push({ playerId: pid, sets: [i - 1, i] });
      }
    }
  }
  return { valid: violations.length === 0, violations };
}

/**
 * Compute FLOW substitution after sideout.
 * @param {Object} trioState - { setters: { onCourt, benchPlayerId }, ... }
 * @param {string} servedPlayerId - Player who just served (subs out)
 * @returns {{ outPlayerId, inPlayerId, trioName } | null}
 */
export function computeFlowSub(trioState, servedPlayerId) {
  for (const [trioName, trio] of Object.entries(trioState)) {
    if (trio.onCourt?.includes(servedPlayerId)) {
      if (!trio.benchPlayerId) return null;
      return {
        outPlayerId: servedPlayerId,
        inPlayerId: trio.benchPlayerId,
        trioName,
      };
    }
  }
  return null;
}

/** Create empty night plan shell (4 matches x 2 sets). */
export function createNightPlanShell(name, date) {
  const matches = [];
  for (let m = 0; m < 4; m++) {
    const sets = [];
    for (let s = 0; s < 2; s++) {
      sets.push({
        setIndex: s,
        system: null,
        lineupId: null,
        servingOrder: [],
        trios: {
          setters: { onCourt: [], bench: null },
          hitters: { onCourt: [], bench: null },
          middles: { onCourt: [], bench: null },
        },
        live: {
          active: false,
          currentRotation: 1,
          currentServer: null,
          ourScore: 0,
          theirScore: 0,
          servingTeam: 'us',
          subHistory: [],
          trioState: {
            setters: { onCourt: [], benchPlayerId: null },
            hitters: { onCourt: [], benchPlayerId: null },
            middles: { onCourt: [], benchPlayerId: null },
          },
          playerMinutes: {},
        },
        completed: false,
        result: null,
      });
    }
    matches.push({ matchIndex: m, opponent: '', sets });
  }
  return {
    id: 'night-' + Date.now(),
    name: name || 'Game Night',
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    matches,
    fairnessValid: true,
  };
}
