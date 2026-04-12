import { useMemo } from 'react';

export default function ScoreTracker({ match, activeSetNumber, dispatch }) {
  const currentSet = match.sets.find(s => s.number === activeSetNumber);
  const ourScore = currentSet?.ourScore || 0;
  const theirScore = currentSet?.theirScore || 0;

  // Detect set point
  const target = activeSetNumber >= 5 ? 15 : 25;
  const isSetPoint = (ourScore >= target - 1 || theirScore >= target - 1)
    && Math.abs(ourScore - theirScore) >= 1;
  const isSetOver = (ourScore >= target || theirScore >= target)
    && Math.abs(ourScore - theirScore) >= 2;

  const setsWon = useMemo(() => {
    let us = 0, them = 0;
    for (const s of match.sets) {
      if (s.won === true) us++;
      else if (s.won === false) them++;
    }
    return { us, them };
  }, [match.sets]);

  const updateScore = (team, delta) => {
    const newOur = team === 'us' ? Math.max(0, ourScore + delta) : ourScore;
    const newTheir = team === 'them' ? Math.max(0, theirScore + delta) : theirScore;
    dispatch({
      type: 'UPDATE_SET_SCORE',
      matchId: match.id,
      setNumber: activeSetNumber,
      ourScore: newOur,
      theirScore: newTheir,
    });
  };

  return (
    <div className="bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
      {/* Score display */}
      <div className="flex items-center justify-center gap-4 px-3 py-2">
        {/* Our score */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateScore('us', -1)}
            className="w-8 h-12 rounded-lg bg-[var(--color-surface-3)] text-gray-400 text-lg font-bold active:scale-90 flex items-center justify-center"
          >−</button>
          <button
            onClick={() => updateScore('us', 1)}
            className="w-16 h-16 rounded-xl bg-green-900/40 text-green-300 text-3xl font-black active:scale-95 flex items-center justify-center border border-green-700/30"
          >
            {ourScore}
          </button>
        </div>

        {/* Center info */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-medium">S{activeSetNumber}</span>
          <span className="text-gray-600 text-lg font-bold">—</span>
          <span className="text-xs text-gray-500">Sets {setsWon.us}-{setsWon.them}</span>
        </div>

        {/* Their score */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateScore('them', 1)}
            className="w-16 h-16 rounded-xl bg-red-900/40 text-red-300 text-3xl font-black active:scale-95 flex items-center justify-center border border-red-700/30"
          >
            {theirScore}
          </button>
          <button
            onClick={() => updateScore('them', -1)}
            className="w-8 h-12 rounded-lg bg-[var(--color-surface-3)] text-gray-400 text-lg font-bold active:scale-90 flex items-center justify-center"
          >−</button>
        </div>
      </div>

      {/* Set point / set over indicator */}
      {isSetOver && (
        <div className="flex items-center justify-center pb-2">
          <button
            onClick={() => dispatch({ type: 'ADD_SET', matchId: match.id })}
            className="px-4 py-1.5 rounded-lg bg-amber-600/30 text-amber-300 text-xs font-bold border border-amber-600/30 active:scale-95"
          >
            Set Over — Start Next Set
          </button>
        </div>
      )}
      {isSetPoint && !isSetOver && (
        <div className="text-center pb-1">
          <span className="text-xs text-amber-400 font-bold">SET POINT</span>
        </div>
      )}
    </div>
  );
}
