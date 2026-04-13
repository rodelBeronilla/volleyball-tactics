import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { load, save } from '../utils/storage';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW } from '../data/defaults';
import { deriveRotation, isBackRow } from '../utils/rotations';
import { getFormation, findDynamicSetterPos } from '../data/formations';
import { computeFullProfile } from '../utils/playerProfileEngine';
import { ATTRIBUTES } from '../data/archetypes';
import { createNightPlanShell, computeFlowSub } from '../data/systems';

const initialState = {
  players: load('players', DEFAULT_PLAYERS),
  lineups: load('lineups', [DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW]),
  activeLineupId: load('activeLineupId', 'lineup-1'),
  currentRotation: load('currentRotation', 1),
  activeFormationId: load('activeFormationId', 'sr-5-1'),
  activeResponsibilityId: load('activeResponsibilityId', null),
  activeTab: 'court',
  editingPlayer: null,
  editingLineup: null,
  selectedSlot: null,
  showRoutes: false,
  showHeatmap: false,
  showCoverage: false,
  courtPhase: 'receive', // 'receive' | 'offense' | 'defense'

  // Stat tracking
  experimentNotes: load('experimentNotes', []),
  matches: load('matches', []),
  statEntries: load('statEntries', []),
  rallies: load('rallies', []),
  activeMatchId: load('activeMatchId', null),
  activeSetNumber: load('activeSetNumber', 1),

  // Game Day
  nightPlans: load('nightPlans', []),
  activeNightPlanId: load('activeNightPlanId', null),

  // Practice Planner
  practicePlans: load('practicePlans', []),
  activePracticePlanId: load('activePracticePlanId', null),
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_FORMATION':
      return { ...state, activeFormationId: action.id };

    case 'SET_RESPONSIBILITY':
      return { ...state, activeResponsibilityId: action.id };

    case 'SET_ACTIVE_LINEUP':
      return { ...state, activeLineupId: action.id, currentRotation: 1 };

    // Player CRUD
    case 'ADD_PLAYER': {
      const id = 'p' + Date.now();
      const newPlayer = {
        ...action.player,
        id,
        ratingHistory: action.player.baseRatings
          ? [{ date: new Date().toISOString().slice(0, 10), ratings: { ...action.player.baseRatings }, source: 'initial' }]
          : [],
      };
      return { ...state, players: [...state.players, newPlayer], editingPlayer: null };
    }
    case 'UPDATE_PLAYER': {
      const updated = state.players.map(p => {
        if (p.id !== action.player.id) return p;
        const merged = { ...p, ...action.player };
        // Append rating snapshot if baseRatings changed
        if (action.player.baseRatings) {
          const history = [...(p.ratingHistory || [])];
          const lastEntry = history[history.length - 1];
          const ratingsChanged = !lastEntry || ATTRIBUTES.some(a => (lastEntry.ratings[a] || 0) !== (action.player.baseRatings[a] || 0));
          if (ratingsChanged) {
            history.push({ date: new Date().toISOString().slice(0, 10), ratings: { ...action.player.baseRatings }, source: 'coach' });
          }
          merged.ratingHistory = history;
        }
        return merged;
      });
      return { ...state, players: updated, editingPlayer: null };
    }
    case 'DELETE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.id),
        lineups: state.lineups.map(l => ({
          ...l,
          slots: Object.fromEntries(
            Object.entries(l.slots).map(([k, v]) => [k, v === action.id ? null : v])
          ),
          liberoId: l.liberoId === action.id ? null : l.liberoId,
        })),
      };
    case 'SET_EDITING_PLAYER':
      return { ...state, editingPlayer: action.player };

    // Lineup CRUD
    case 'ADD_LINEUP': {
      const id = 'lineup-' + Date.now();
      const lineup = {
        id,
        name: action.name || 'New Lineup',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        system: '5-1',
        slots: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
        liberoId: null,
      };
      return { ...state, lineups: [...state.lineups, lineup], activeLineupId: id };
    }
    case 'UPDATE_LINEUP':
      return {
        ...state,
        lineups: state.lineups.map(l =>
          l.id === action.lineup.id ? { ...action.lineup, updatedAt: new Date().toISOString() } : l
        ),
        editingLineup: null,
      };
    case 'DELETE_LINEUP': {
      const remaining = state.lineups.filter(l => l.id !== action.id);
      return {
        ...state,
        lineups: remaining,
        activeLineupId: remaining.length > 0 ? remaining[0].id : null,
      };
    }
    case 'ASSIGN_SLOT': {
      const lineups = state.lineups.map(l => {
        if (l.id !== state.activeLineupId) return l;
        const slots = { ...l.slots };
        for (const k of Object.keys(slots)) {
          if (slots[k] === action.playerId) slots[k] = null;
        }
        slots[action.slot] = action.playerId;
        return { ...l, slots, updatedAt: new Date().toISOString() };
      });
      return { ...state, lineups };
    }
    case 'SET_LIBERO': {
      const lineups = state.lineups.map(l =>
        l.id === state.activeLineupId ? { ...l, liberoId: action.playerId } : l
      );
      return { ...state, lineups };
    }
    case 'SET_EDITING_LINEUP':
      return { ...state, editingLineup: action.lineup };

    // Strategy card: player selection
    case 'SELECT_PLAYER':
      return { ...state, selectedSlot: action.slot };

    case 'DESELECT_PLAYER':
      return { ...state, selectedSlot: null };

    case 'TOGGLE_ROUTES':
      return { ...state, showRoutes: !state.showRoutes };

    case 'TOGGLE_HEATMAP':
      return { ...state, showHeatmap: !state.showHeatmap };

    case 'TOGGLE_COVERAGE':
      return { ...state, showCoverage: !state.showCoverage };

    case 'SET_COURT_PHASE':
      return { ...state, courtPhase: action.phase };

    // Clear selection on rotation change
    case 'SET_ROTATION':
      return { ...state, currentRotation: action.rotation, selectedSlot: null };

    case 'NEXT_ROTATION':
      return { ...state, currentRotation: state.currentRotation === 6 ? 1 : state.currentRotation + 1, selectedSlot: null };

    case 'PREV_ROTATION':
      return { ...state, currentRotation: state.currentRotation === 1 ? 6 : state.currentRotation - 1, selectedSlot: null };

    // Drag: update formation override position
    case 'MOVE_PLAYER_ON_COURT': {
      const clampedX = Math.max(5, Math.min(85, action.x));
      const clampedY = Math.max(5, Math.min(85, action.y));
      const lineups = state.lineups.map(l => {
        if (l.id !== state.activeLineupId) return l;
        const overrides = { ...(l.overrides || {}) };
        const rotKey = `r${state.currentRotation}`;
        overrides[rotKey] = { ...(overrides[rotKey] || {}), [action.slot]: { x: clampedX, y: clampedY } };
        return { ...l, overrides };
      });
      return { ...state, lineups };
    }

    // ── Match lifecycle ──
    case 'CREATE_MATCH': {
      const id = 'match-' + Date.now();
      const match = {
        id,
        opponent: action.opponent || 'Opponent',
        date: action.date || new Date().toISOString().slice(0, 10),
        lineupId: action.lineupId || state.activeLineupId,
        sets: [{ number: 1, ourScore: 0, theirScore: 0, won: null }],
        completed: false,
        createdAt: new Date().toISOString(),
      };
      return { ...state, matches: [...state.matches, match], activeMatchId: id, activeSetNumber: 1 };
    }
    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === action.matchId ? { ...m, ...action.updates } : m
        ),
      };
    case 'DELETE_MATCH':
      return {
        ...state,
        matches: state.matches.filter(m => m.id !== action.matchId),
        statEntries: state.statEntries.filter(e => e.matchId !== action.matchId),
        activeMatchId: state.activeMatchId === action.matchId ? null : state.activeMatchId,
      };
    case 'END_MATCH':
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === action.matchId ? { ...m, completed: true } : m
        ),
        activeMatchId: null,
      };
    case 'SET_ACTIVE_MATCH':
      return { ...state, activeMatchId: action.matchId };

    // ── Set management ──
    case 'ADD_SET': {
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          const nextNum = m.sets.length + 1;
          return { ...m, sets: [...m.sets, { number: nextNum, ourScore: 0, theirScore: 0, won: null }] };
        }),
        activeSetNumber: state.matches.find(m => m.id === action.matchId)?.sets.length + 1 || 1,
      };
    }
    case 'UPDATE_SET_SCORE': {
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          return {
            ...m,
            sets: m.sets.map(s =>
              s.number === action.setNumber
                ? { ...s, ourScore: action.ourScore, theirScore: action.theirScore, won: action.ourScore > action.theirScore ? true : action.theirScore > action.ourScore ? false : null }
                : s
            ),
          };
        }),
      };
    }
    case 'SET_ACTIVE_SET':
      return { ...state, activeSetNumber: action.setNumber };

    // ── Stat entries ──
    case 'RECORD_STAT': {
      const entry = {
        id: 'stat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        matchId: action.matchId,
        setNumber: action.setNumber,
        playerId: action.playerId,
        rotation: action.rotation,
        stat: action.stat,
        timestamp: Date.now(),
        ...(action.videoTimestamp != null ? { videoTimestamp: action.videoTimestamp } : {}),
      };
      return { ...state, statEntries: [...state.statEntries, entry] };
    }
    case 'UNDO_STAT':
      return { ...state, statEntries: state.statEntries.filter(e => e.id !== action.statId) };

    // ── Data management ──
    case 'IMPORT_DATA':
      return {
        ...state,
        players: action.data.players,
        lineups: action.data.lineups,
        matches: action.data.matches,
        statEntries: action.data.statEntries,
        rallies: action.data.rallies || [],
        experimentNotes: action.data.experimentNotes || [],
        nightPlans: action.data.nightPlans || state.nightPlans,
        practicePlans: action.data.practicePlans || state.practicePlans,
        activeLineupId: action.data.activeLineupId || state.activeLineupId,
        activeFormationId: action.data.activeFormationId || state.activeFormationId,
        activeMatchId: null,
      };
    case 'SET_STAT_ENTRIES':
      return { ...state, statEntries: action.entries };

    // ── Experiment notes ──
    case 'ADD_EXPERIMENT_NOTE': {
      const note = {
        id: 'note-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        text: action.text,
        timestamp: Date.now(),
      };
      return { ...state, experimentNotes: [...state.experimentNotes, note] };
    }
    case 'DELETE_EXPERIMENT_NOTE':
      return { ...state, experimentNotes: state.experimentNotes.filter(n => n.id !== action.noteId) };

    // ── Rallies (structured play-by-play) ──
    case 'ADD_RALLY': {
      const rally = {
        id: 'rally-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        matchId: action.matchId,
        setNumber: action.setNumber,
        rallyNumber: action.rallyNumber,
        rotation: action.rotation,
        ourScore: action.ourScore,
        theirScore: action.theirScore,
        servingTeam: action.servingTeam, // 'us' | 'them'
        outcome: action.outcome, // 'won' | 'lost'
        actions: action.actions || [], // [{ playerId, stat, order }]
      };
      // Flatten rally actions into stat entries for the aggregation pipeline
      const newStatEntries = [];
      for (const a of rally.actions) {
        newStatEntries.push({
          id: 'stat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          matchId: rally.matchId,
          setNumber: rally.setNumber,
          playerId: a.playerId,
          rotation: rally.rotation,
          stat: a.stat,
          rallyId: rally.id,
          timestamp: Date.now(),
        });
      }
      // Also add the rally outcome as a stat entry (team-level, no playerId)
      newStatEntries.push({
        id: 'stat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        matchId: rally.matchId,
        setNumber: rally.setNumber,
        playerId: '__team__',
        rotation: rally.rotation,
        stat: rally.outcome === 'won' ? 'rallyWon' : 'rallyLost',
        rallyId: rally.id,
        servingTeam: rally.servingTeam,
        timestamp: Date.now(),
      });
      return {
        ...state,
        rallies: [...state.rallies, rally],
        statEntries: [...state.statEntries, ...newStatEntries],
      };
    }
    case 'DELETE_RALLY': {
      const rallyId = action.rallyId;
      return {
        ...state,
        rallies: state.rallies.filter(r => r.id !== rallyId),
        statEntries: state.statEntries.filter(e => e.rallyId !== rallyId),
      };
    }
    case 'UNDO_LAST_RALLY': {
      // Remove the most recent rally for this match
      const matchRallies = state.rallies.filter(r => r.matchId === action.matchId);
      if (matchRallies.length === 0) return state;
      const lastRally = matchRallies[matchRallies.length - 1];
      return {
        ...state,
        rallies: state.rallies.filter(r => r.id !== lastRally.id),
        statEntries: state.statEntries.filter(e => e.rallyId !== lastRally.id),
      };
    }

    // ── Game Day: Night Plans ──
    case 'CREATE_NIGHT_PLAN': {
      const plan = createNightPlanShell(action.name, action.date);
      return { ...state, nightPlans: [...state.nightPlans, plan], activeNightPlanId: plan.id };
    }
    case 'UPDATE_NIGHT_PLAN':
      return {
        ...state,
        nightPlans: state.nightPlans.map(p =>
          p.id === action.planId ? { ...p, ...action.updates } : p
        ),
      };
    case 'DELETE_NIGHT_PLAN':
      return {
        ...state,
        nightPlans: state.nightPlans.filter(p => p.id !== action.planId),
        activeNightPlanId: state.activeNightPlanId === action.planId ? null : state.activeNightPlanId,
      };
    case 'SET_ACTIVE_NIGHT_PLAN':
      return { ...state, activeNightPlanId: action.planId };

    case 'SET_SET_SYSTEM': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => si === action.setIndex ? { ...s, system: action.system } : s);
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'SET_SET_LINEUP': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => si === action.setIndex ? { ...s, lineupId: action.lineupId } : s);
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'SET_SET_SERVING_ORDER': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => si === action.setIndex ? { ...s, servingOrder: action.servingOrder } : s);
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'SET_SET_TRIOS': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => si === action.setIndex ? { ...s, trios: action.trios } : s);
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'SET_SET_OPPONENT': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) =>
            mi === action.matchIndex ? { ...m, opponent: action.opponent } : m
          );
          return { ...p, matches };
        }),
      };
    }
    case 'START_SET': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => {
              if (si !== action.setIndex) return s;
              const live = { ...s.live, active: true, currentRotation: 1, ourScore: 0, theirScore: 0, servingTeam: 'us', subHistory: [] };
              // Initialize FLOW trio state from trio config
              if (s.system === 'FLOW' && s.trios) {
                live.trioState = {
                  setters: { onCourt: [...(s.trios.setters.onCourt || [])], benchPlayerId: s.trios.setters.bench },
                  hitters: { onCourt: [...(s.trios.hitters.onCourt || [])], benchPlayerId: s.trios.hitters.bench },
                  middles: { onCourt: [...(s.trios.middles.onCourt || [])], benchPlayerId: s.trios.middles.bench },
                };
              }
              if (s.servingOrder?.length > 0) live.currentServer = s.servingOrder[0];
              return { ...s, live };
            });
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'END_SET': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => {
              if (si !== action.setIndex) return s;
              return {
                ...s,
                completed: true,
                result: { ourScore: s.live.ourScore, theirScore: s.live.theirScore },
                live: { ...s.live, active: false },
              };
            });
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'GAMEDAY_SCORE_POINT': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => {
              if (si !== action.setIndex) return s;
              const live = { ...s.live };
              if (action.team === 'us') live.ourScore++;
              else live.theirScore++;
              return { ...s, live };
            });
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'GAMEDAY_SIDEOUT': {
      return {
        ...state,
        nightPlans: state.nightPlans.map(p => {
          if (p.id !== state.activeNightPlanId) return p;
          const matches = p.matches.map((m, mi) => {
            if (mi !== action.matchIndex) return m;
            const sets = m.sets.map((s, si) => {
              if (si !== action.setIndex) return s;
              const live = { ...s.live };
              // Flip serving team
              live.servingTeam = live.servingTeam === 'us' ? 'them' : 'us';
              // If we gained serve, rotate
              if (live.servingTeam === 'us') {
                live.currentRotation = live.currentRotation === 6 ? 1 : live.currentRotation + 1;
              }
              // FLOW sub: the player who just served subs out
              if (s.system === 'FLOW' && live.currentServer && live.trioState) {
                const sub = computeFlowSub(live.trioState, live.currentServer);
                if (sub) {
                  live.trioState = { ...live.trioState };
                  const trio = { ...live.trioState[sub.trioName] };
                  trio.onCourt = trio.onCourt.map(id => id === sub.outPlayerId ? sub.inPlayerId : id);
                  trio.benchPlayerId = sub.outPlayerId;
                  live.trioState[sub.trioName] = trio;
                  // Update serving order
                  const so = [...(s.servingOrder || [])];
                  const idx = so.indexOf(sub.outPlayerId);
                  if (idx !== -1) so[idx] = sub.inPlayerId;
                  // Store sub history
                  live.subHistory = [...(live.subHistory || []), {
                    timestamp: Date.now(), trioName: sub.trioName,
                    outPlayerId: sub.outPlayerId, inPlayerId: sub.inPlayerId,
                    rotation: live.currentRotation,
                  }];
                  // Update serving order on the set level too
                  return { ...s, servingOrder: so, live };
                }
              }
              // Advance server in serving order
              if (s.servingOrder?.length > 0 && live.servingTeam === 'us') {
                const curIdx = s.servingOrder.indexOf(live.currentServer);
                live.currentServer = s.servingOrder[(curIdx + 1) % s.servingOrder.length];
              }
              return { ...s, live };
            });
            return { ...m, sets };
          });
          return { ...p, matches };
        }),
      };
    }
    case 'GAMEDAY_START_MATCH_STATS': {
      // Bridge: create a match in the Stats system from a Game Day set
      const matchId = 'match-' + Date.now();
      const match = {
        id: matchId,
        opponent: action.opponent || 'Opponent',
        date: action.date || new Date().toISOString().slice(0, 10),
        lineupId: action.lineupId || state.activeLineupId,
        sets: [{ number: 1, ourScore: 0, theirScore: 0, won: null }],
        completed: false,
        createdAt: new Date().toISOString(),
        nightPlanSetRef: action.nightPlanSetRef || null,
      };
      return {
        ...state,
        matches: [...state.matches, match],
        activeMatchId: matchId,
        activeSetNumber: 1,
        currentRotation: 1,
      };
    }

    // ── Practice Planner ──
    case 'CREATE_PRACTICE_PLAN': {
      const plan = {
        id: 'practice-' + Date.now(),
        name: action.name || 'Practice',
        date: action.date || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        blocks: [],
      };
      return { ...state, practicePlans: [...state.practicePlans, plan], activePracticePlanId: plan.id };
    }
    case 'UPDATE_PRACTICE_PLAN':
      return {
        ...state,
        practicePlans: state.practicePlans.map(p =>
          p.id === action.planId ? { ...p, ...action.updates } : p
        ),
      };
    case 'DELETE_PRACTICE_PLAN':
      return {
        ...state,
        practicePlans: state.practicePlans.filter(p => p.id !== action.planId),
        activePracticePlanId: state.activePracticePlanId === action.planId ? null : state.activePracticePlanId,
      };
    case 'SET_ACTIVE_PRACTICE_PLAN':
      return { ...state, activePracticePlanId: action.planId };
    case 'ADD_DRILL_TO_PLAN': {
      return {
        ...state,
        practicePlans: state.practicePlans.map(p => {
          if (p.id !== state.activePracticePlanId) return p;
          const block = {
            id: 'block-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
            drillId: action.drillId,
            duration: action.duration || 10,
            coachNotes: '',
            targetPlayerIds: [],
            playerNotes: {},
          };
          return { ...p, blocks: [...p.blocks, block] };
        }),
      };
    }
    case 'REMOVE_DRILL_FROM_PLAN':
      return {
        ...state,
        practicePlans: state.practicePlans.map(p => {
          if (p.id !== state.activePracticePlanId) return p;
          return { ...p, blocks: p.blocks.filter(b => b.id !== action.blockId) };
        }),
      };
    case 'REORDER_DRILL_BLOCKS': {
      return {
        ...state,
        practicePlans: state.practicePlans.map(p => {
          if (p.id !== state.activePracticePlanId) return p;
          const blocks = [...p.blocks];
          const [moved] = blocks.splice(action.fromIndex, 1);
          blocks.splice(action.toIndex, 0, moved);
          return { ...p, blocks };
        }),
      };
    }
    case 'UPDATE_DRILL_BLOCK':
      return {
        ...state,
        practicePlans: state.practicePlans.map(p => {
          if (p.id !== state.activePracticePlanId) return p;
          return {
            ...p,
            blocks: p.blocks.map(b =>
              b.id === action.blockId ? { ...b, ...action.updates } : b
            ),
          };
        }),
      };

    // ── Film Review (extends existing rallies) ──
    case 'CREATE_FILM_RALLY': {
      const rallyId = 'rally-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      // Build actions[] for the stat pipeline from touches
      const actions = (action.touches || []).map((t, i) => ({
        playerId: t.playerId,
        stat: t.action,
        order: i + 1,
      }));
      const rally = {
        id: rallyId,
        matchId: action.matchId || null,
        setNumber: action.setNumber || null,
        rallyNumber: action.rallyNumber || null,
        rotation: action.rotation,
        ourScore: action.ourScore || 0,
        theirScore: action.theirScore || 0,
        servingTeam: action.servingTeam || 'us',
        outcome: action.outcome || 'won',
        actions,
        filmReview: {
          version: 1,
          touches: action.touches || [],
          tags: action.tags || [],
          notes: action.notes || '',
          playerPositions: action.playerPositions || {},
        },
      };
      // Flatten to stat entries
      const newStatEntries = actions.filter(a => a.playerId).map(a => ({
        id: 'stat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        matchId: rally.matchId,
        setNumber: rally.setNumber,
        playerId: a.playerId,
        rotation: rally.rotation,
        stat: a.stat,
        rallyId: rally.id,
        timestamp: Date.now(),
      }));
      return {
        ...state,
        rallies: [...state.rallies, rally],
        statEntries: [...state.statEntries, ...newStatEntries],
      };
    }
    case 'UPDATE_RALLY_FILM_REVIEW':
      return {
        ...state,
        rallies: state.rallies.map(r =>
          r.id === action.rallyId ? { ...r, filmReview: { ...r.filmReview, ...action.filmReview } } : r
        ),
      };
    case 'DELETE_RALLY_FILM_REVIEW':
      return {
        ...state,
        rallies: state.rallies.map(r => {
          if (r.id !== action.rallyId) return r;
          const { filmReview: _removed, ...rest } = r;
          return rest;
        }),
      };

    // ── Enhanced Stats ──
    case 'SYNC_SET_SCORE_FROM_RALLIES': {
      const matchRallies = state.rallies.filter(r => r.matchId === action.matchId && r.setNumber === action.setNumber);
      let ourScore = 0, theirScore = 0;
      for (const r of matchRallies) {
        if (r.outcome === 'won') ourScore++;
        else theirScore++;
      }
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          return {
            ...m,
            sets: m.sets.map(s =>
              s.number === action.setNumber ? { ...s, ourScore, theirScore } : s
            ),
          };
        }),
      };
    }

    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to localStorage on change
  useEffect(() => { save('players', state.players); }, [state.players]);
  useEffect(() => { save('lineups', state.lineups); }, [state.lineups]);
  useEffect(() => { save('activeLineupId', state.activeLineupId); }, [state.activeLineupId]);
  useEffect(() => { save('currentRotation', state.currentRotation); }, [state.currentRotation]);
  useEffect(() => { save('activeFormationId', state.activeFormationId); }, [state.activeFormationId]);
  useEffect(() => { save('activeResponsibilityId', state.activeResponsibilityId); }, [state.activeResponsibilityId]);
  useEffect(() => { save('experimentNotes', state.experimentNotes); }, [state.experimentNotes]);
  useEffect(() => { save('matches', state.matches); }, [state.matches]);
  useEffect(() => { save('statEntries', state.statEntries); }, [state.statEntries]);
  useEffect(() => { save('rallies', state.rallies); }, [state.rallies]);
  useEffect(() => { save('activeMatchId', state.activeMatchId); }, [state.activeMatchId]);
  useEffect(() => { save('activeSetNumber', state.activeSetNumber); }, [state.activeSetNumber]);
  useEffect(() => { save('nightPlans', state.nightPlans); }, [state.nightPlans]);
  useEffect(() => { save('activeNightPlanId', state.activeNightPlanId); }, [state.activeNightPlanId]);
  useEffect(() => { save('practicePlans', state.practicePlans); }, [state.practicePlans]);
  useEffect(() => { save('activePracticePlanId', state.activePracticePlanId); }, [state.activePracticePlanId]);

  // Derived: active lineup
  const activeLineup = state.lineups.find(l => l.id === state.activeLineupId) || null;

  // Derived: active match
  const activeMatch = state.matches.find(m => m.id === state.activeMatchId) || null;

  // Derived: current rotation slots (who is where)
  const currentSlots = activeLineup
    ? deriveRotation(activeLineup.slots, state.currentRotation)
    : {};

  // Derived: formation based on court phase
  // Map phase ID → formation ID. PLAN steps use the PREVIOUS formation.
  const PHASE_FORMATION = {
    'serve': 'serve',
    'receive-plan': 'serve',       // arrows preview, players still at serve positions
    'receive': 'sr-5-1',           // players move to receive
    'pass-plan': 'sr-5-1',         // arrows preview, players still at receive
    'pass': 'pass',                // setter at target, hitters loaded
    'attack-plan': 'pass',         // arrows preview attack options
    'attack': 'offense',           // hitters at attack zones
    'defense-plan': 'offense',     // arrows preview defensive transition
    'defense': 'def-perimeter',    // defense formed
    'transition-plan': 'def-perimeter', // arrows preview counter-attack transition
    'transition': 'transition',    // setter released, hitters approaching
  };
  const formationId = PHASE_FORMATION[state.courtPhase] || state.activeFormationId;
  const formation = getFormation(formationId);
  const placements = [];

  // Dynamic setter position — works even if setter isn't in the default slot 1
  const dynamicSetterPos = activeLineup
    ? findDynamicSetterPos(activeLineup, state.players, state.currentRotation)
    : null;

  // Phases where setter should be at target (right-front setting position)
  const SETTER_TARGET_PHASES = new Set(['pass', 'pass-plan', 'attack-plan', 'attack', 'offense', 'transition', 'transition-plan']);
  const setterAtTarget = SETTER_TARGET_PHASES.has(state.courtPhase);

  if (activeLineup && formation) {
    const rotPlacements = formation.placements[state.currentRotation] || {};
    const overrides = activeLineup.overrides?.[`r${state.currentRotation}`] || {};

    // Pre-determine which ONE middle the libero subs for
    // (only one libero can be on court — pick the first back-row middle found)
    let liberoSubPos = null;
    if (activeLineup.liberoId) {
      for (const pos of [5, 6, 1]) { // check back row positions
        const pid = currentSlots[pos];
        if (!pid) continue;
        const pl = state.players.find(p => p.id === pid);
        if (pl?.position === 'middle') { liberoSubPos = pos; break; }
      }
    }

    for (let pos = 1; pos <= 6; pos++) {
      let playerId = currentSlots[pos];
      let isLiberoIn = false;

      // Libero swap: only for the ONE designated back-row middle
      if (pos === liberoSubPos && activeLineup.liberoId) {
        playerId = activeLineup.liberoId;
        isLiberoIn = true;
      }

      const player = state.players.find(p => p.id === playerId);

      // Dynamic setter target: if this is the setter's position and we're in a setter-target phase,
      // override coords to put setter at the setting position regardless of static formation data
      let coords;
      if (setterAtTarget && pos === dynamicSetterPos && player?.position === 'setter') {
        coords = overrides[pos] || { x: 68, y: 8 }; // Setter target position
      } else {
        coords = overrides[pos] || rotPlacements[pos] || { x: 45, y: 45 };
      }

      placements.push({
        rotationalPosition: pos,
        playerId,
        player,
        isLiberoIn,
        x: coords.x,
        y: coords.y,
      });
    }
  }

  const getPlayer = useCallback((id) => state.players.find(p => p.id === id), [state.players]);

  // Reactive player profiles — recomputes when stat data changes
  const playerProfiles = useMemo(() => {
    if (state.statEntries.length === 0) return {};
    const profiles = {};
    for (const p of state.players) {
      profiles[p.id] = computeFullProfile(p, state.statEntries, state.matches);
    }
    return profiles;
  }, [state.players, state.statEntries, state.matches]);

  return {
    state,
    dispatch,
    activeLineup,
    activeMatch,
    currentSlots,
    placements,
    formation,
    getPlayer,
    playerProfiles,
  };
}
