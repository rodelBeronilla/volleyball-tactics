import { useReducer, useEffect, useCallback } from 'react';
import { load, save } from '../utils/storage';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP } from '../data/defaults';
import { deriveRotation, isBackRow } from '../utils/rotations';
import { getFormation } from '../data/formations';

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
        // Remove player from any existing slot first
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

    // Clear selection on rotation change
    case 'SET_ROTATION':
      return { ...state, currentRotation: action.rotation, selectedSlot: null };

    case 'NEXT_ROTATION':
      return { ...state, currentRotation: state.currentRotation === 6 ? 1 : state.currentRotation + 1, selectedSlot: null };

    case 'PREV_ROTATION':
      return { ...state, currentRotation: state.currentRotation === 1 ? 6 : state.currentRotation - 1, selectedSlot: null };

    // Drag: update formation override position
    case 'MOVE_PLAYER_ON_COURT': {
      // Custom position overrides stored per lineup per rotation
      const lineups = state.lineups.map(l => {
        if (l.id !== state.activeLineupId) return l;
        const overrides = { ...(l.overrides || {}) };
        const rotKey = `r${state.currentRotation}`;
        overrides[rotKey] = { ...(overrides[rotKey] || {}), [action.slot]: { x: action.x, y: action.y } };
        return { ...l, overrides };
      });
      return { ...state, lineups };
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

  // Derived: active lineup
  const activeLineup = state.lineups.find(l => l.id === state.activeLineupId) || null;

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

  return {
    state,
    dispatch,
    activeLineup,
    currentSlots,
    placements,
    formation,
    getPlayer,
  };
}
