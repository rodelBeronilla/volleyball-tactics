import { useState } from 'react';

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:00`;
  return `${m}:00`;
}

export default function DrillBlockCard({
  block,
  drill,
  index,
  totalBlocks,
  startMinute,
  players,
  dispatch,
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  const endMinute = startMinute + (block.duration || 0);
  const timeLabel = `${formatTime(startMinute)} - ${formatTime(endMinute)}`;

  const handleDurationChange = (val) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0 && n <= 120) {
      dispatch({
        type: 'UPDATE_DRILL_BLOCK',
        payload: { blockId: block.id, updates: { duration: n } },
      });
    }
  };

  const handleNotesChange = (val) => {
    dispatch({
      type: 'UPDATE_DRILL_BLOCK',
      payload: { blockId: block.id, updates: { coachNotes: val } },
    });
  };

  const togglePlayer = (playerId) => {
    const current = block.targetPlayerIds || [];
    const next = current.includes(playerId)
      ? current.filter((id) => id !== playerId)
      : [...current, playerId];
    dispatch({
      type: 'UPDATE_DRILL_BLOCK',
      payload: { blockId: block.id, updates: { targetPlayerIds: next } },
    });
  };

  const handleRemove = () => {
    dispatch({
      type: 'REMOVE_DRILL_FROM_PLAN',
      payload: { blockId: block.id },
    });
  };

  const handleReorder = (direction) => {
    dispatch({
      type: 'REORDER_DRILL_BLOCKS',
      payload: { blockId: block.id, direction },
    });
  };

  const targeted = block.targetPlayerIds || [];

  return (
    <div className="bg-surface-2 border border-white/5 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 p-3 pb-2">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => handleReorder('up')}
            disabled={index === 0}
            className="w-6 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => handleReorder('down')}
            disabled={index === totalBlocks - 1}
            className="w-6 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Index badge */}
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-accent/15 text-accent text-[10px] font-bold shrink-0">
          {index + 1}
        </span>

        {/* Name and time */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-100 truncate">
            {drill ? drill.name : 'Unknown Drill'}
          </h4>
          <span className="text-[10px] text-gray-500 tabular-nums">
            {timeLabel}
          </span>
        </div>

        {/* Duration input */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={1}
            max={120}
            value={block.duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-12 bg-surface-3 border border-white/10 rounded px-1.5 py-1 text-xs text-center text-gray-200 tabular-nums focus:outline-none focus:border-accent/50"
          />
          <span className="text-[10px] text-gray-500">min</span>
        </div>

        {/* Delete */}
        <button
          onClick={handleRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Skill tags */}
      {drill && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {drill.skillFocus.map((skill) => (
            <span
              key={skill}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 capitalize"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Coach notes toggle */}
      <button
        onClick={() => setNotesOpen(!notesOpen)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gray-500 hover:text-gray-300 border-t border-white/5 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586Z" />
        </svg>
        {notesOpen ? 'Hide details' : 'Notes & Players'}
        <svg
          className={`w-3 h-3 ml-auto transition-transform ${notesOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {notesOpen && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          <textarea
            value={block.coachNotes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Coach notes for this drill block..."
            rows={2}
            className="w-full bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-accent/50"
          />

          {players && players.length > 0 && (
            <div>
              <h5 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                Target Players
              </h5>
              <div className="flex flex-wrap gap-1">
                {players.map((p) => {
                  const active = targeted.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlayer(p.id)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        active
                          ? 'bg-accent/20 text-accent border-accent/40'
                          : 'bg-surface-3 text-gray-400 border-white/5 hover:border-white/15'
                      }`}
                    >
                      #{p.number} {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
