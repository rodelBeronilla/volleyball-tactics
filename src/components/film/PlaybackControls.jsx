/**
 * Playback transport controls: Prev / Play|Pause / Next, touch counter, speed selector.
 */
export default function PlaybackControls({
  currentIndex,
  totalTouches,
  isPlaying,
  onPrev,
  onNext,
  onTogglePlay,
  speed,
  onSpeedChange,
}) {
  const speeds = [0.5, 1, 2];
  const atStart = currentIndex <= 0;
  const atEnd = currentIndex >= totalTouches - 1;

  return (
    <div className="flex flex-col gap-3 items-center">
      {/* Touch counter */}
      <div className="text-sm font-semibold text-white/70">
        {totalTouches > 0 ? `${currentIndex + 1} of ${totalTouches}` : 'No touches'}
      </div>

      {/* Transport buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={atStart}
          className="w-10 h-10 rounded-full bg-[var(--color-surface-3)] text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
          aria-label="Previous touch"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 13l-6-5 6-5v10z" />
          </svg>
        </button>

        <button
          onClick={onTogglePlay}
          disabled={totalTouches === 0}
          className="w-12 h-12 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect x="4" y="3" width="3" height="12" rx="1" />
              <rect x="11" y="3" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M5 3l10 6-10 6V3z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={atEnd}
          className="w-10 h-10 rounded-full bg-[var(--color-surface-3)] text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
          aria-label="Next touch"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 3l6 5-6 5V3z" />
          </svg>
        </button>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Speed:</span>
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              speed === s
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-3)] text-white/60'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
