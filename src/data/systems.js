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

/**
 * Validate fairness: nobody sits back-to-back sets.
 * FLOW sets count as ON for everyone (trio rotation).
 * The set's lineup libero plays the back row, so counts as on court even though
 * a libero never appears in the serving order.
 * @param {Object} nightPlan
 * @param {Object[]} players
 * @param {Object[]} [lineups]
 * @returns {{ valid: boolean, violations: { playerId, sets: [number, number] }[] }}
 */
export function validateFairness(nightPlan, players, lineups = []) {
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
    const libero = lineups.find(l => l.id === set.lineupId)?.liberoId;
    if (libero) onCourt.add(libero);
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
