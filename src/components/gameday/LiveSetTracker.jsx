import { useMemo, useCallback } from 'react';
import { SYSTEMS } from '../../data/systems';
import { POSITIONS } from '../../data/positions';
import FlowSubTracker from './FlowSubTracker';

export default function LiveSetTracker({
  plan,
  matchIndex,
  setIndex,
  players,
  lineups,
  dispatch,
  onEnd,
}) {
  const playerMap = useMemo(
    () => Object.fromEntries((players || []).map((p) => [p.id, p])),
    [players],
  );

  const match = plan?.matches?.[matchIndex];
  const set = match?.sets?.[setIndex];
  const live = set?.live;
  const system = set?.system;
  const servingOrder = set?.servingOrder || [];

  const ourScore = live?.ourScore ?? 0;
  const theirScore = live?.theirScore ?? 0;
  const servingTeam = live?.servingTeam ?? 'us';
  const currentServer = live?.currentServer;
  const currentRotation = live?.currentRotation ?? 1;
  const trioState = live?.trioState;

  const serverPlayer = playerMap[currentServer];

  const handleScoreUs = useCallback(() => {
    dispatch({
      type: 'GAMEDAY_SCORE_POINT',
      matchIndex,
      setIndex,
      team: 'us',
    });
  }, [dispatch, matchIndex, setIndex]);

  const handleScoreThem = useCallback(() => {
    dispatch({
      type: 'GAMEDAY_SCORE_POINT',
      matchIndex,
      setIndex,
      team: 'them',
    });
  }, [dispatch, matchIndex, setIndex]);

  const handleSideout = useCallback(() => {
    dispatch({
      type: 'GAMEDAY_SIDEOUT',
      matchIndex,
      setIndex,
    });
  }, [dispatch, matchIndex, setIndex]);

  const handleEndSet = useCallback(() => {
    dispatch({
      type: 'END_SET',
      matchIndex,
      setIndex,
    });
    onEnd?.();
  }, [dispatch, matchIndex, setIndex, onEnd]);

  if (!set || !live?.active) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        No active set.
      </div>
    );
  }

  const systemName = SYSTEMS[system]?.name || system || 'Unknown';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">
            Match {matchIndex + 1} / Set {setIndex + 1}
          </span>
          <span className="text-sm font-semibold text-gray-200">
            {match?.opponent || 'Opponent'} - {systemName}
          </span>
        </div>
        <button
          onClick={handleEndSet}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300
                     text-xs font-medium active:opacity-80 transition-opacity"
        >
          End Set
        </button>
      </div>

      {/* Score display */}
      <div className="flex items-center justify-center gap-6 py-6 px-4">
        {/* Our score + tap target */}
        <button
          onClick={handleScoreUs}
          className="flex flex-col items-center gap-1 min-w-[6rem] h-28 justify-center
                     rounded-2xl bg-(--color-surface-2) border border-white/10
                     active:bg-(--color-surface-3) transition-colors"
        >
          <span className="text-xs text-gray-400 font-medium uppercase">Us</span>
          <span className="text-5xl font-bold text-white tabular-nums">
            {ourScore}
          </span>
          {servingTeam === 'us' && (
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
          )}
        </button>

        {/* Divider */}
        <span className="text-2xl text-gray-600 font-light">:</span>

        {/* Their score + tap target */}
        <button
          onClick={handleScoreThem}
          className="flex flex-col items-center gap-1 min-w-[6rem] h-28 justify-center
                     rounded-2xl bg-(--color-surface-2) border border-white/10
                     active:bg-(--color-surface-3) transition-colors"
        >
          <span className="text-xs text-gray-400 font-medium uppercase">Them</span>
          <span className="text-5xl font-bold text-gray-400 tabular-nums">
            {theirScore}
          </span>
          {servingTeam === 'them' && (
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
          )}
        </button>
      </div>

      {/* Server + Rotation info */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase">Server:</span>
          {serverPlayer ? (
            <span
              className="px-2 py-1 rounded-md text-xs font-medium border"
              style={{
                backgroundColor: `${POSITIONS[serverPlayer.position]?.color || '#6b7280'}20`,
                borderColor: `${POSITIONS[serverPlayer.position]?.color || '#6b7280'}60`,
                color: POSITIONS[serverPlayer.position]?.color || '#6b7280',
              }}
            >
              #{serverPlayer.number} {serverPlayer.name}
            </span>
          ) : (
            <span className="text-xs text-gray-500">-</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase">Rotation:</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--color-surface-3) border border-white/10">
            <span className="text-sm font-bold text-gray-200">
              {currentRotation}
            </span>
          </div>
        </div>
      </div>

      {/* Rotation indicator - mini court */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-3 gap-1 max-w-[14rem] mx-auto">
          {/* Front row: positions 4, 3, 2 */}
          {[4, 3, 2].map((zone) => {
            // Map rotation to serving order index
            // Rotation 1: zone 1 = server (index 0)
            // Standard mapping: zone = ((index + rotation - 1) % 6) + 1 mapped to court
            const soIndex = (zone - currentRotation + 6) % 6;
            const pid = servingOrder[soIndex];
            const p = playerMap[pid];
            const isServer = pid === currentServer;

            return (
              <div
                key={zone}
                className={`flex flex-col items-center justify-center py-1.5 rounded text-[10px]
                  ${isServer ? 'bg-yellow-500/20 border border-yellow-500/40' : 'bg-(--color-surface-3)'}`}
              >
                <span className="font-bold text-gray-300">
                  {p ? `#${p.number}` : '-'}
                </span>
                <span className="text-gray-500">Z{zone}</span>
              </div>
            );
          })}
          {/* Back row: positions 5, 6, 1 */}
          {[5, 6, 1].map((zone) => {
            const soIndex = (zone - currentRotation + 6) % 6;
            const pid = servingOrder[soIndex];
            const p = playerMap[pid];
            const isServer = pid === currentServer;

            return (
              <div
                key={zone}
                className={`flex flex-col items-center justify-center py-1.5 rounded text-[10px]
                  ${isServer ? 'bg-yellow-500/20 border border-yellow-500/40' : 'bg-(--color-surface-3)'}`}
              >
                <span className="font-bold text-gray-300">
                  {p ? `#${p.number}` : '-'}
                </span>
                <span className="text-gray-500">Z{zone}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sideout button */}
      <div className="px-4 py-3">
        <button
          onClick={handleSideout}
          className="w-full h-14 rounded-xl bg-(--color-surface-3) border-2 border-white/20
                     text-white font-bold text-base active:bg-(--color-accent) active:border-(--color-accent)
                     transition-colors flex items-center justify-center gap-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10h12M12 6l4 4-4 4M16 10H4M8 14l-4-4 4-4" />
          </svg>
          Sideout
        </button>
      </div>

      {/* FLOW sub tracker */}
      {system === 'FLOW' && trioState && (
        <div className="px-4 pb-4">
          <FlowSubTracker
            trioState={trioState}
            servingOrder={servingOrder}
            currentServer={currentServer}
            players={players}
          />
        </div>
      )}

      {/* Sub history log */}
      {live.subHistory?.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Sub History
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {live.subHistory.map((sub, i) => {
              const outP = playerMap[sub.outPlayerId];
              const inP = playerMap[sub.inPlayerId];
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <span className="text-gray-600">R{sub.rotation}</span>
                  <span className="text-red-400">
                    {outP ? `#${outP.number} ${outP.name}` : sub.outPlayerId}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-gray-600"
                  >
                    <path
                      d="M2 6h8M7 3l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-green-400">
                    {inP ? `#${inP.number} ${inP.name}` : sub.inPlayerId}
                  </span>
                  <span className="text-gray-600 capitalize">
                    ({sub.trioName})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
