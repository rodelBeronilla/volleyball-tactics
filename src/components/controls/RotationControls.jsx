import { isFrontRow } from '../../utils/rotations';

export default function RotationControls({ currentRotation, dispatch, currentSlots, getPlayer }) {
  const dots = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface-2)]">
      <button
        onClick={() => dispatch({ type: 'PREV_ROTATION' })}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-surface-3)] text-white text-xl font-bold active:scale-90 transition-transform"
      >
        ‹
      </button>

      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1.5">
          {dots.map(n => (
            <button
              key={n}
              onClick={() => dispatch({ type: 'SET_ROTATION', rotation: n })}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                n === currentRotation
                  ? 'bg-[var(--color-accent)] text-white scale-110'
                  : 'bg-[var(--color-surface-3)] text-gray-400'
              }`}
            >
              R{n}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          Swipe court or tap to change rotation
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: 'NEXT_ROTATION' })}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-surface-3)] text-white text-xl font-bold active:scale-90 transition-transform"
      >
        ›
      </button>
    </div>
  );
}
