import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { load, save } from '../utils/storage';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP } from '../data/defaults';
import { deriveRotation, isBackRow } from '../utils/rotations';
import { getFormation } from '../data/formations';
import { computeFullProfile } from '../utils/playerProfileEngine';

const initialState = {
  players: load('players', DEFAULT_PLAYERS),
  lineups: load('lineups', [DEFAULT_LINEUP]),
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

  // Stat tracking
  experimentNotes: load('experimentNotes', []),
  matches: load('matches', []),
  statEntries: load('statEntries', []),
  rallies: load('rallies', []),
  activeMatchId: load('activeMatchId', null),
  activeSetNumber: load('activeSetNumber', 1),
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
      return { ...state, players: [...state.players, { ...action.player, id }], editingPlayer: null };
    }
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p => p.id === action.player.id ? action.player : p),
        editingPlayer: null,
      };
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

  // Derived: active lineup
  const activeLineup = state.lineups.find(l => l.id === state.activeLineupId) || null;

  // Derived: active match
  const activeMatch = state.matches.find(m => m.id === state.activeMatchId) || null;

  // Derived: current rotation slots (who is where)
  const currentSlots = activeLineup
    ? deriveRotation(activeLineup.slots, state.currentRotation)
    : {};

  // Derived: court placements with formation positions
  const formation = getFormation(state.activeFormationId);
  const placements = [];

  if (activeLineup && formation) {
    const rotPlacements = formation.placements[state.currentRotation] || {};
    const overrides = activeLineup.overrides?.[`r${state.currentRotation}`] || {};

    for (let pos = 1; pos <= 6; pos++) {
      let playerId = currentSlots[pos];
      let isLiberoIn = false;

      // Libero swap: if this position has a middle blocker and they're in back row
      if (playerId && activeLineup.liberoId && isBackRow(pos)) {
        const player = state.players.find(p => p.id === playerId);
        if (player && player.position === 'middle') {
          playerId = activeLineup.liberoId;
          isLiberoIn = true;
        }
      }

      const player = state.players.find(p => p.id === playerId);
      const coords = overrides[pos] || rotPlacements[pos] || { x: 45, y: 45 };

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
