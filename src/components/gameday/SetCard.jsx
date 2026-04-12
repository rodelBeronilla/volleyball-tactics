import { useState, useMemo, useCallback } from 'react';
import { SYSTEMS, checkFriction } from '../../data/systems';
import { POSITIONS } from '../../data/positions';
import FrictionWarning from './FrictionWarning';

const SYSTEM_IDS = ['LOCKED_IN', 'FLOW', 'GROW'];

const SYSTEM_COLORS = {
  LOCKED_IN: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  FLOW: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  GROW: 'bg-green-500/20 border-green-500/50 text-green-300',
};

const SYSTEM_ACTIVE = {
  LOCKED_IN: 'bg-blue-500 border-blue-400 text-white',
  FLOW: 'bg-purple-500 border-purple-400 text-white',
  GROW: 'bg-green-500 border-green-400 text-white',
};

function ServingOrderChip({ player, index }) {
  const pos = player?.position || 'ds';
  const color = POSITIONS[pos]?.color || '#6b7280';

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}60`,
        color,
      }}
    >
      <span className="text-gray-500 text-[10px]">{index + 1}</span>
      <span className="font-bold">#{player?.number ?? '?'}</span>
      <span className="truncate max-w-[3.5rem]">{player?.name ?? 'Empty'}</span>
    </div>
  );
}

export default function SetCard({
  set,
  matchIndex,
  players,
  lineups,
  dispatch,
  onGoLive,
}) {
  const [expanded, setExpanded] = useState(false);

  const playerMap = useMemo(
    () => Object.fromEntries((players || []).map((p) => [p.id, p])),
    [players],
  );

  const setIndex = set.setIndex;
  const system = set.system;
  const lineupId = set.lineupId;

  const selectedLineup = useMemo(
    () => (lineups || []).find((l) => l.id === lineupId) || null,
    [lineups, lineupId],
  );

  // Build serving order from lineup slots if not explicitly set
  const servingOrder = set.servingOrder || [];

  const handleSystemChange = useCallback(
    (sys) => {
      dispatch({
        type: 'SET_SET_SYSTEM',
        matchIndex,
        setIndex,
        system: sys === system ? null : sys,
      });
    },
    [dispatch, matchIndex, setIndex, system],
  );

  const handleLineupChange = useCallback(
    (e) => {
      const lid = e.target.value || null;
      dispatch({ type: 'SET_SET_LINEUP', matchIndex, setIndex, lineupId: lid });

      // Auto-populate serving order from lineup slots
      if (lid) {
        const lineup = (lineups || []).find((l) => l.id === lid);
        if (lineup?.slots) {
          const order = [1, 2, 3, 4, 5, 6]
            .map((slot) => lineup.slots[slot])
            .filter(Boolean);
          dispatch({
            type: 'SET_SET_SERVING_ORDER',
            matchIndex,
            setIndex,
            servingOrder: order,
          });
        }
      }
    },
    [dispatch, matchIndex, setIndex, lineups],
  );

  const handleTrioPlayerChange = useCallback(
    (trioName, slot, playerId) => {
      const currentTrios = set.trios || {
        setters: { onCourt: [], bench: null },
        hitters: { onCourt: [], bench: null },
        middles: { onCourt: [], bench: null },
      };
      const trio = { ...currentTrios[trioName] };

      if (slot === 'bench') {
        trio.bench = playerId || null;
      } else {
        const onCourt = [...(trio.onCourt || [])];
        onCourt[slot] = playerId || null;
        trio.onCourt = onCourt;
      }

      dispatch({
        type: 'SET_SET_TRIOS',
        matchIndex,
        setIndex,
        trios: { ...currentTrios, [trioName]: trio },
      });
    },
    [dispatch, matchIndex, setIndex, set.trios],
  );

  // Determine if set is ready to go live
  const isReady = system && lineupId && servingOrder.length === 6;
  const isLive = set.live?.active;
  const isCompleted = set.completed;

  // Status badge
  let statusLabel = 'Not configured';
  let statusColor = 'text-gray-500';
  if (isCompleted) {
    statusLabel = `Done ${set.result?.ourScore ?? 0}-${set.result?.theirScore ?? 0}`;
    statusColor = 'text-green-400';
  } else if (isLive) {
    statusLabel = 'LIVE';
    statusColor = 'text-yellow-400';
  } else if (isReady) {
    statusLabel = 'Ready';
    statusColor = 'text-blue-400';
  } else if (system) {
    statusLabel = SYSTEMS[system]?.name || system;
    statusColor = 'text-gray-400';
  }

  // Get all players assigned to serve order for friction check
  const courtPlayerIds = servingOrder.filter(Boolean);

  // Available players for trio selection (those not already assigned)
  const assignedInTrios = useMemo(() => {
    if (!set.trios) return new Set();
    const ids = new Set();
    for (const trio of Object.values(set.trios)) {
      (trio.onCourt || []).forEach((id) => id && ids.add(id));
      if (trio.bench) ids.add(trio.bench);
    }
    return ids;
  }, [set.trios]);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isLive
          ? 'border-yellow-500/40 bg-yellow-500/5'
          : isCompleted
            ? 'border-green-500/20 bg-(--color-surface-2)'
            : 'border-white/10 bg-(--color-surface-2)'
      }`}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">
            Set {setIndex + 1}
          </span>
          <span className={`text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
          {/* System picker chips */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              System
            </label>
            <div className="flex gap-2">
              {SYSTEM_IDS.map((sys) => (
                <button
                  key={sys}
                  onClick={() => handleSystemChange(sys)}
                  disabled={isLive || isCompleted}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    system === sys
                      ? SYSTEM_ACTIVE[sys]
                      : SYSTEM_COLORS[sys]
                  } ${isLive || isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {SYSTEMS[sys].name}
                </button>
              ))}
            </div>
          </div>

          {/* Lineup selector */}
          {system && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Lineup
              </label>
              <select
                value={lineupId || ''}
                onChange={handleLineupChange}
                disabled={isLive || isCompleted}
                className="w-full px-3 py-2 rounded-lg bg-(--color-surface-3) border border-white/10
                           text-sm text-gray-200 focus:outline-none focus:border-(--color-accent)"
              >
                <option value="">Select lineup...</option>
                {(lineups || []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Serving order */}
          {lineupId && servingOrder.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Serving Order
              </label>
              <div className="flex flex-wrap gap-1.5">
                {servingOrder.map((pid, i) => (
                  <ServingOrderChip
                    key={pid || i}
                    player={playerMap[pid]}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}

          {/* FLOW: Trio configurator */}
          {system === 'FLOW' && lineupId && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Trio Configuration
              </label>
              <div className="space-y-2">
                {['setters', 'hitters', 'middles'].map((trioName) => {
                  const trio = set.trios?.[trioName] || {
                    onCourt: [],
                    bench: null,
                  };
                  const trioLabel =
                    trioName === 'setters'
                      ? 'Setters'
                      : trioName === 'hitters'
                        ? 'Hitters'
                        : 'Middles';

                  return (
                    <div
                      key={trioName}
                      className="p-2 rounded-lg bg-(--color-surface-3) space-y-1.5"
                    >
                      <span className="text-xs font-medium text-gray-300">
                        {trioLabel}
                      </span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {/* On-court slot 1 */}
                        <select
                          value={trio.onCourt?.[0] || ''}
                          onChange={(e) =>
                            handleTrioPlayerChange(trioName, 0, e.target.value)
                          }
                          disabled={isLive || isCompleted}
                          className="px-2 py-1 rounded bg-(--color-surface) border border-white/10
                                     text-xs text-gray-200 max-w-[7rem]"
                        >
                          <option value="">Court 1</option>
                          {players
                            .filter(
                              (p) =>
                                !assignedInTrios.has(p.id) ||
                                p.id === trio.onCourt?.[0],
                            )
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.number} {p.name}
                              </option>
                            ))}
                        </select>

                        {/* On-court slot 2 */}
                        <select
                          value={trio.onCourt?.[1] || ''}
                          onChange={(e) =>
                            handleTrioPlayerChange(trioName, 1, e.target.value)
                          }
                          disabled={isLive || isCompleted}
                          className="px-2 py-1 rounded bg-(--color-surface) border border-white/10
                                     text-xs text-gray-200 max-w-[7rem]"
                        >
                          <option value="">Court 2</option>
                          {players
                            .filter(
                              (p) =>
                                !assignedInTrios.has(p.id) ||
                                p.id === trio.onCourt?.[1],
                            )
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.number} {p.name}
                              </option>
                            ))}
                        </select>

                        <span className="text-gray-600 text-xs">|</span>

                        {/* Bench slot */}
                        <select
                          value={trio.bench || ''}
                          onChange={(e) =>
                            handleTrioPlayerChange(
                              trioName,
                              'bench',
                              e.target.value,
                            )
                          }
                          disabled={isLive || isCompleted}
                          className="px-2 py-1 rounded bg-(--color-surface) border border-white/10
                                     text-xs text-gray-300 opacity-60 max-w-[7rem]"
                        >
                          <option value="">Bench</option>
                          {players
                            .filter(
                              (p) =>
                                !assignedInTrios.has(p.id) ||
                                p.id === trio.bench,
                            )
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.number} {p.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Friction warnings */}
          {courtPlayerIds.length > 0 && (
            <FrictionWarning
              courtPlayerIds={courtPlayerIds}
              players={players}
            />
          )}

          {/* Go Live button */}
          {isReady && !isLive && !isCompleted && (
            <button
              onClick={() => onGoLive?.(matchIndex, setIndex)}
              className="w-full h-12 rounded-xl bg-(--color-accent) text-white font-semibold text-sm
                         active:opacity-80 transition-opacity flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M5 3l8 5-8 5V3z" />
              </svg>
              Go Live
            </button>
          )}

          {/* Completed result */}
          {isCompleted && set.result && (
            <div className="text-center text-sm text-gray-400">
              Final: {set.result.ourScore} - {set.result.theirScore}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
