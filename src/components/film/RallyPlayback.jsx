import { useMemo } from 'react';
import { STATS } from '../../data/statCategories';
import { POSITIONS } from '../../data/positions';
import useRallyPlayback from '../../hooks/useRallyPlayback';
import PlaybackControls from './PlaybackControls';
import TouchTimeline from './TouchTimeline';

/**
 * Step through a completed rally on a court visualization.
 * Animated ball between touches with player circles at positions.
 */
export default function RallyPlayback({ rally, players = [], onClose, dispatch }) {
  const touches = rally?.filmReview?.touches || [];
  const playerPositions = rally?.filmReview?.playerPositions || {};
  const notes = rally?.filmReview?.notes || '';

  const {
    currentTouchIndex,
    isPlaying,
    speed,
    goNext,
    goPrev,
    togglePlay,
    setSpeed,
    goToTouch,
  } = useRallyPlayback(touches.length);

  const currentTouch = touches[currentTouchIndex] || null;

  const playerMap = useMemo(
    () => Object.fromEntries(players.map(p => [p.id, p])),
    [players],
  );

  const getPlayerColor = (player) => {
    if (!player?.position) return '#888';
    return POSITIONS[player.position]?.color || '#888';
  };

  // Ball position: use ballTo of current touch, or ballFrom if no ballTo
  const ballPos = useMemo(() => {
    if (!currentTouch) return null;
    if (currentTouch.ballTo) return currentTouch.ballTo;
    if (currentTouch.ballFrom) return currentTouch.ballFrom;
    return null;
  }, [currentTouch]);

  // Previous ball position for trail line
  const prevBallPos = useMemo(() => {
    if (!currentTouch?.ballFrom) return null;
    return currentTouch.ballFrom;
  }, [currentTouch]);

  const currentPlayer = currentTouch ? playerMap[currentTouch.playerId] : null;
  const actionLabel = currentTouch?.action && STATS[currentTouch.action]
    ? STATS[currentTouch.action].label
    : currentTouch?.action || '';

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
        <button
          onClick={onClose}
          className="text-sm text-white/60 hover:text-white"
        >
          &larr; Back
        </button>
        <h3 className="text-sm font-bold text-white">
          Rally Playback
          <span className="ml-2 text-xs text-white/40">
            R{rally.rotation} | {rally.ourScore}-{rally.theirScore} |{' '}
            <span className={rally.outcome === 'won' ? 'text-green-400' : 'text-red-400'}>
              {rally.outcome === 'won' ? 'W' : 'L'}
            </span>
          </span>
        </h3>
        <div className="w-12" />
      </div>

      {/* Court visualization */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 overflow-hidden">
        <div className="w-full max-w-md aspect-square">
          <svg viewBox="-2 -5 94 100" className="w-full h-full">
            {/* Court background */}
            <rect x="0" y="0" width="90" height="90" rx="2" fill="var(--color-court, #2d6b30)" />

            {/* Net line */}
            <line x1="0" y1="0" x2="90" y2="0" stroke="white" strokeWidth="1.5" opacity="0.8" />
            <text x="45" y="-2" textAnchor="middle" fill="white" fontSize="3" opacity="0.5">
              NET
            </text>

            {/* Center line */}
            <line x1="0" y1="45" x2="90" y2="45" stroke="white" strokeWidth="0.3" opacity="0.3" strokeDasharray="2,2" />

            {/* 3-meter / attack line */}
            <line x1="0" y1="30" x2="90" y2="30" stroke="white" strokeWidth="0.4" opacity="0.4" />

            {/* Court border */}
            <rect x="0" y="0" width="90" height="90" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />

            {/* Player positions */}
            {Object.entries(playerPositions).map(([slotOrId, pos]) => {
              // Try to find the player by matching against slot-based or direct id
              const player = playerMap[slotOrId] || players.find(p => String(p.number) === slotOrId);
              const color = getPlayerColor(player);
              const isCurrentPlayer = currentPlayer && player && player.id === currentPlayer.id;

              return (
                <g key={slotOrId}>
                  {/* Highlight ring for current player */}
                  {isCurrentPlayer && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="5.5"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="1"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="5.5;7;5.5"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle cx={pos.x} cy={pos.y} r="4" fill={color} stroke="white" strokeWidth="0.5" />
                  <text
                    x={pos.x}
                    y={pos.y + 1.2}
                    textAnchor="middle"
                    fill="white"
                    fontSize="3.5"
                    fontWeight="bold"
                  >
                    {player?.number || slotOrId}
                  </text>
                </g>
              );
            })}

            {/* Ball trail line */}
            {prevBallPos && ballPos && (
              <line
                x1={prevBallPos.x}
                y1={prevBallPos.y}
                x2={ballPos.x}
                y2={ballPos.y}
                stroke="#fbbf24"
                strokeWidth="0.8"
                strokeDasharray="2,1"
                opacity="0.6"
              />
            )}

            {/* Ball marker */}
            {ballPos && (
              <g>
                <circle cx={ballPos.x} cy={ballPos.y} r="2.5" fill="#fbbf24" stroke="white" strokeWidth="0.5">
                  <animate
                    attributeName="r"
                    values="2.5;3;2.5"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </svg>
        </div>

        {/* Current touch info */}
        {currentTouch && (
          <div className="mt-2 text-center">
            <div className="text-sm font-bold text-white">
              {currentPlayer ? `#${currentPlayer.number} ${currentPlayer.name}` : 'Unknown'}{' '}
              <span className="text-white/60">{actionLabel}</span>
            </div>
            {currentTouch.note && (
              <div className="text-xs text-white/40 mt-0.5 italic">{currentTouch.note}</div>
            )}
          </div>
        )}
      </div>

      {/* Playback controls */}
      <div className="px-4 py-3 bg-[var(--color-surface-2)] border-t border-white/5">
        <PlaybackControls
          currentIndex={currentTouchIndex}
          totalTouches={touches.length}
          isPlaying={isPlaying}
          onPrev={goPrev}
          onNext={goNext}
          onTogglePlay={togglePlay}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Touch timeline */}
      <div className="px-4 py-2 bg-[var(--color-surface)] border-t border-white/5">
        <TouchTimeline
          touches={touches}
          players={players}
          activeTouchIndex={currentTouchIndex}
          onSelectTouch={goToTouch}
          onDeleteTouch={null}
        />
      </div>

      {/* Rally notes */}
      {notes && (
        <div className="px-4 py-2 bg-[var(--color-surface-2)] border-t border-white/5">
          <div className="text-xs text-white/40 mb-0.5">Notes</div>
          <div className="text-xs text-white/70">{notes}</div>
        </div>
      )}
    </div>
  );
}
