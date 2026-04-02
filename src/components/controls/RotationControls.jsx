export default function RotationControls({ currentRotation, dispatch, onRotationChange }) {
  const handleChange = (rotation) => {
    dispatch({ type: 'SET_ROTATION', rotation });
    onRotationChange?.();
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface-2)] shrink-0">
      <button
        onClick={() => handleChange(currentRotation === 1 ? 6 : currentRotation - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-3)] text-white text-lg font-bold active:scale-90 transition-transform"
        aria-label="Previous rotation">
        ‹
      </button>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button key={n}
            onClick={() => handleChange(n)}
            className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
              n === currentRotation ? 'bg-[var(--color-accent)] text-white scale-110' : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}>
            R{n}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleChange(currentRotation === 6 ? 1 : currentRotation + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-3)] text-white text-lg font-bold active:scale-90 transition-transform"
        aria-label="Next rotation">
        ›
      </button>
    </div>
  );
}
