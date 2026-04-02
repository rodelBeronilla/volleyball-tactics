import { useState } from 'react';

export default function MatchForm({ lineups, activeLineupId, onSave, onClose }) {
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineupId, setLineupId] = useState(activeLineupId || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!opponent.trim()) return;
    onSave({ opponent: opponent.trim(), date, lineupId });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--color-surface-2)] rounded-t-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">New Match</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] text-white border border-white/10 focus:border-[var(--color-accent)] outline-none"
              placeholder="Team name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] text-white border border-white/10 focus:border-[var(--color-accent)] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Lineup</label>
            <div className="flex gap-1.5 flex-wrap">
              {lineups.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLineupId(l.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    l.id === lineupId
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-surface-3)] text-gray-400'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg bg-[var(--color-surface-3)] text-gray-300 font-medium">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-3 rounded-lg bg-[var(--color-accent)] text-white font-bold">
              Start Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
