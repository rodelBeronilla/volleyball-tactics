/**
 * Synthetic demo season.
 *
 * Simulates rally-by-rally play for the default roster so the stats,
 * and analysis views have realistic data on first launch. The output
 * uses exactly the same record shapes the live entry screens produce
 * (matches → rallies → flat statEntries), so everything downstream runs
 * through the normal aggregation pipeline.
 *
 * Deterministic: the same seed always produces the same season.
 */

import { deriveRotation } from '../utils/rotations';
import { createNightPlanShell } from './systems';

// Latent skill per player (1–10). Only the simulator sees these; the app has
// to recover them from the event log like it would for a real team.
const SKILL = {
  p1: { serve: 6, pass: 6, attack: 3, block: 2, defense: 6, set: 9 },
  p2: { serve: 6, pass: 6, attack: 7, block: 4, defense: 5, set: 3 },
  p3: { serve: 5, pass: 4, attack: 7, block: 4, defense: 5, set: 3 },
  p4: { serve: 5, pass: 3, attack: 6, block: 8, defense: 3, set: 2 },
  p5: { serve: 6, pass: 5, attack: 6, block: 5, defense: 5, set: 4 },
  p6: { serve: 7, pass: 7, attack: 8, block: 6, defense: 7, set: 4 },
  p7: { serve: 5, pass: 8, attack: 1, block: 1, defense: 8, set: 5 },
  p8: { serve: 7, pass: 6, attack: 3, block: 2, defense: 6, set: 4 },
  p9: { serve: 4, pass: 3, attack: 5, block: 6, defense: 3, set: 2 },
};
const DEFAULT_SKILL = { serve: 5, pass: 5, attack: 5, block: 5, defense: 5, set: 5 };

const SCHEDULE = [
  { opponent: 'Block Party', date: '2026-09-08', lineupId: 'lineup-1', strength: 0.0 },
  { opponent: 'Net Gains', date: '2026-09-15', lineupId: 'lineup-1', strength: 0.04 },
  { opponent: 'Dig Deep', date: '2026-09-22', lineupId: 'lineup-2', strength: -0.03 },
  { opponent: 'Sideout Society', date: '2026-09-29', lineupId: 'lineup-1', strength: 0.06 },
  { opponent: 'Free Ballers', date: '2026-10-06', lineupId: 'lineup-2', strength: -0.02 },
  { opponent: 'Kill Shots', date: '2026-10-13', lineupId: 'lineup-1', strength: 0.03 },
  { opponent: 'Block Party', date: '2026-10-20', lineupId: 'lineup-1', strength: 0.01 },
];
const SETS_PER_MATCH = 3;
const MAX_CONTACTS = 8; // rally length cap before a coin-flip ending

/** mulberry32 — small, fast, seedable PRNG */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const skillOf = (id, key) => (SKILL[id] || DEFAULT_SKILL)[key];
const delta = (id, key) => skillOf(id, key) - 5;

function pickWeighted(rng, ids, key) {
  const weights = ids.map(id => Math.max(1, skillOf(id, key)));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

/**
 * Who is on court in each rotational position. The libero replaces any
 * back-row middle except when that middle is serving.
 */
function courtFor(lineup, rotation, servingTeam, playersById) {
  const slots = deriveRotation(lineup.slots, rotation);
  const court = { ...slots };
  if (lineup.liberoId) {
    for (const pos of servingTeam === 'us' ? [5, 6] : [1, 5, 6]) {
      if (playersById[slots[pos]]?.position === 'middle') court[pos] = lineup.liberoId;
    }
  }
  return court;
}

/**
 * Simulate one rally from our side of the net.
 * @returns {{ outcome: 'won'|'lost', actions: {playerId, stat}[] }}
 */
function simulateRally(rng, court, servingTeam, playersById, opp) {
  const actions = [];
  const log = (playerId, stat) => actions.push({ playerId, stat });
  const pos = id => playersById[id]?.position;

  const front = [2, 3, 4].map(p => court[p]);
  const back = [1, 5, 6].map(p => court[p]);
  const setter = [...front, ...back].find(id => pos(id) === 'setter') || court[1];
  const passers = [...back, ...front.filter(id => pos(id) === 'outside')].filter(id => id !== setter);
  const diggers = back.filter(id => id !== setter);
  const blockers = front.filter(id => id !== setter);
  const hitters = front.filter(id => id !== setter && pos(id) !== 'libero');
  const pipeHitters = back.filter(id => id !== setter && ['outside', 'opposite'].includes(pos(id)));

  // Our attack after a pass/dig of the given quality (1–3)
  const attack = (quality, contacts) => {
    if (rng() < 0.03 - 0.004 * delta(setter, 'set')) {
      log(setter, rng() < 0.5 ? 'setError' : 'ballHandlingError');
      return 'lost';
    }
    const options = quality >= 2 && pipeHitters.length && rng() < 0.15 ? pipeHitters : hitters;
    const hitter = pickWeighted(rng, options.length ? options : [setter], 'attack');
    const a = delta(hitter, 'attack');
    const pKill = 0.32 + 0.035 * a + (quality - 2) * 0.08 - opp;
    const pErr = 0.11 - 0.01 * a;
    const pBlocked = 0.07 + opp / 2;
    const r = rng();
    if (r < pKill) {
      const k = rng();
      log(hitter, k < 0.1 ? 'attackTip' : k < 0.18 ? 'attackTooled' : 'kill');
      log(setter, 'assist');
      return 'won';
    }
    if (r < pKill + pErr) { log(hitter, 'attackError'); log(setter, 'setAttempt'); return 'lost'; }
    if (r < pKill + pErr + pBlocked) { log(hitter, 'attackBlocked'); log(setter, 'setAttempt'); return 'lost'; }
    log(hitter, 'attackAttempt');
    log(setter, 'setAttempt');
    return defend(contacts + 1);
  };

  // Opponent attacks us
  const defend = (contacts) => {
    if (contacts >= MAX_CONTACTS) return rng() < 0.5 ? 'won' : 'lost';
    const r = rng();
    if (r < 0.10 - opp) return 'won'; // opponent hitting error
    if (r < 0.20) { // free ball over
      log(pickWeighted(rng, diggers, 'pass'), 'freeBall');
      return attack(3, contacts + 1);
    }
    if (blockers.length && rng() < 0.08 + 0.01 * delta(blockers[0], 'block')) {
      if (rng() < 0.4) { log(pickWeighted(rng, blockers, 'block'), 'blockSolo'); }
      else {
        const [b1, b2] = [blockers[0], blockers[1] || blockers[0]];
        log(b1, 'blockAssist');
        if (b2 !== b1) log(b2, 'blockAssist');
      }
      return 'won';
    }
    if (blockers.length && rng() < 0.12) log(pickWeighted(rng, blockers, 'block'), 'blockTouch');
    const digger = pickWeighted(rng, diggers, 'defense');
    if (rng() < 0.42 + opp - 0.03 * delta(digger, 'defense')) {
      if (rng() < 0.6) log(digger, 'defenseError');
      return 'lost';
    }
    log(digger, 'dig');
    return attack(rng() < 0.5 ? 2 : 1, contacts + 1);
  };

  let outcome;
  if (servingTeam === 'us') {
    const server = court[1];
    const s = delta(server, 'serve');
    const r = rng();
    if (r < 0.13 - 0.012 * s) { log(server, 'serviceError'); outcome = 'lost'; }
    else if (r < 0.13 - 0.012 * s + 0.06 + 0.012 * s) { log(server, 'ace'); outcome = 'won'; }
    else { log(server, 'serveInPlay'); outcome = defend(1); }
  } else {
    const r = rng();
    if (r < 0.11) outcome = 'won'; // their service error
    else {
      const passer = pickWeighted(rng, passers, 'pass');
      const p = delta(passer, 'pass');
      const q = rng();
      const pErr = 0.08 - 0.01 * p + opp;
      const pPerfect = 0.25 + 0.04 * p;
      if (q < pErr) { log(passer, 'passError'); outcome = 'lost'; }
      else if (q < pErr + pPerfect) { log(passer, 'passPerfect'); outcome = attack(3, 1); }
      else if (q < pErr + pPerfect + 0.4) { log(passer, 'passGood'); outcome = attack(2, 1); }
      else { log(passer, 'passPoor'); outcome = attack(1, 1); }
    }
  }
  return { outcome, actions };
}

const setOver = (a, b) => (a >= 25 || b >= 25) && Math.abs(a - b) >= 2;

/**
 * Build a full demo season.
 * @param {Object[]} players
 * @param {Object[]} lineups
 * @param {number} [seed]
 * @returns {{ matches: Object[], rallies: Object[], statEntries: Object[] }}
 */
export function buildDemoSeason(players, lineups, seed = 2026) {
  const rng = makeRng(seed);
  const playersById = Object.fromEntries(players.map(p => [p.id, p]));
  const matches = [];
  const rallies = [];
  const statEntries = [];
  let statSeq = 0;

  SCHEDULE.forEach((game, gi) => {
    const lineup = lineups.find(l => l.id === game.lineupId) || lineups[0];
    if (!lineup) return;
    const matchId = `demo-match-${gi + 1}`;
    const startTime = Date.parse(`${game.date}T19:00:00Z`);
    const sets = [];
    let servingTeam = gi % 2 === 0 ? 'us' : 'them';

    for (let setNumber = 1; setNumber <= SETS_PER_MATCH; setNumber++) {
      let rotation = 1;
      let our = 0;
      let their = 0;
      let rallyNumber = 0;
      while (!setOver(our, their)) {
        rallyNumber++;
        const court = courtFor(lineup, rotation, servingTeam, playersById);
        const { outcome, actions } = simulateRally(rng, court, servingTeam, playersById, game.strength);
        const rallyId = `${matchId}-s${setNumber}-r${rallyNumber}`;
        const timestamp = startTime + (setNumber - 1) * 30 * 60_000 + rallyNumber * 25_000;
        rallies.push({
          id: rallyId, matchId, setNumber, rallyNumber, rotation,
          ourScore: our, theirScore: their, servingTeam, outcome,
          actions: actions.map((a, i) => ({ ...a, order: i + 1 })),
        });
        for (const a of actions) {
          statEntries.push({
            id: `demo-stat-${++statSeq}`, matchId, setNumber, playerId: a.playerId,
            rotation, stat: a.stat, rallyId, timestamp,
          });
        }
        statEntries.push({
          id: `demo-stat-${++statSeq}`, matchId, setNumber, playerId: '__team__',
          rotation, stat: outcome === 'won' ? 'rallyWon' : 'rallyLost',
          rallyId, servingTeam, timestamp,
        });

        if (outcome === 'won') {
          our++;
          if (servingTeam === 'them') {
            rotation = (rotation % 6) + 1; // sideout: we rotate and serve
            servingTeam = 'us';
          }
        } else {
          their++;
          servingTeam = 'them';
        }
      }
      sets.push({ number: setNumber, ourScore: our, theirScore: their, won: our > their });
      servingTeam = servingTeam === 'us' ? 'them' : 'us';
    }

    matches.push({
      id: matchId,
      opponent: game.opponent,
      date: game.date,
      lineupId: lineup.id,
      sets,
      completed: true,
      createdAt: new Date(startTime).toISOString(),
    });
  });

  return { matches, rallies, statEntries };
}

/**
 * Next week's game night, already planned: four matches, the best lineup for
 * set 1 and the rolling-sub Flow system for set 2, so nobody sits two sets in a row.
 */
export function buildDemoNightPlan(lineups) {
  const plan = createNightPlanShell('Game night', '2026-10-27');
  const byId = Object.fromEntries(lineups.map(l => [l.id, l]));
  const opponents = ['Net Gains', 'Dig Deep', 'Kill Shots', 'Free Ballers'];
  const setPlan = [['LOCKED_IN', 'lineup-1'], ['FLOW', 'lineup-3']];
  // Flow: two of each role on court, the third waits to sub in after a sideout
  const trios = {
    setters: { onCourt: ['p1', 'p7'], bench: 'p8' },
    hitters: { onCourt: ['p6', 'p3'], bench: 'p2' },
    middles: { onCourt: ['p4', 'p9'], bench: 'p5' },
  };
  return {
    ...plan,
    id: 'demo-night-1',
    matches: plan.matches.map((m, mi) => ({
      ...m,
      opponent: opponents[mi],
      sets: m.sets.map((s, si) => {
        const [system, lineupId] = setPlan[si];
        const lineup = byId[lineupId];
        if (!lineup) return s;
        // Serving order follows the lineup's slots, as when a coach picks the lineup
        const servingOrder = [1, 2, 3, 4, 5, 6].map(n => lineup.slots[n]).filter(Boolean);
        return { ...s, system, lineupId, servingOrder, ...(system === 'FLOW' ? { trios } : {}) };
      }),
    })),
  };
}
