import { useRef, useEffect } from 'react';
import { STATS } from '../../data/statCategories';

/**
 * Horizontal scrollable strip of touch summary cards.
 * Each card shows player name, action, and a small directional arrow.
 */
export default function TouchTimeline({
  touches = [],
  players = [],
  activeTouchIndex = 0,
  onSelectTouch,
  onDeleteTouch,
}) {
  const scrollRef = useRef(null);
  const activeCardRef = useRef(null);

  // Auto-scroll to active touch
  useEffect(() => {
    if (activeCardRef.current && scrollRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTouchIndex]);

  const getPlayerName = (playerId) => {
    const p = players.find(pl => pl.id === playerId);
    return p ? `#${p.number} ${p.name}` : 'Unknown';
  };

  const getActionLabel = (action) => {
    if (STATS[action]) return STATS[action].label;
    return action || '?';
  };

  if (touches.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-white/30 text-sm">
        No touches yet. Tap a player to start building.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-white/60 uppercase tracking-wide px-1">
        Timeline ({touches.length} touch{touches.length !== 1 ? 'es' : ''})
      </span>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {touches.map((touch, i) => {
          const isActive = i === activeTouchIndex;
          return (
            <div
              key={touch.id || i}
              ref={isActive ? activeCardRef : null}
              onClick={() => onSelectTouch(i)}
              className={`relative flex-shrink-0 w-28 rounded-lg p-2 cursor-pointer transition-all border ${
                isActive
                  ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] shadow-lg'
                  : 'bg-[var(--color-surface-3)] border-white/5 hover:border-white/20'
              }`}
            >
              {/* Delete button */}
              {onDeleteTouch && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTouch(i);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-60 hover:opacity-100"
                  aria-label="Delete touch"
                >
                  x
                </button>
              )}

              {/* Touch number */}
              <div className="text-[10px] text-white/40 mb-0.5">#{i + 1}</div>

              {/* Player name */}
              <div className="text-xs font-semibold text-white truncate">
                {getPlayerName(touch.playerId)}
              </div>

              {/* Action label */}
              <div className="text-[11px] text-white/70 mt-0.5">
                {getActionLabel(touch.action)}
              </div>

              {/* Direction arrow */}
              {touch.ballFrom && touch.ballTo && (
                <div className="mt-1 flex justify-center">
                  <svg width="24" height="14" viewBox="0 0 24 14">
                    <line
                      x1="2"
                      y1="7"
                      x2="20"
                      y2="7"
                      stroke={isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.4)'}
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="18,3 24,7 18,11"
                      fill={isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.4)'}
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
