import { useState } from 'react';
import { POSITIONS } from '../../data/positions';

export default function PlayerForm({ player, onSave, onClose }) {
  const [name, setName] = useState(player?.name || '');
  const [number, setNumber] = useState(player?.number?.toString() || '');
  const [position, setPosition] = useState(player?.position || 'outside');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !number) return;
    onSave({ name: name.trim(), number: parseInt(number, 10), position });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--color-surface-2)] rounded-t-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">{player ? 'Edit Player' : 'Add Player'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] text-white border border-white/10 focus:border-[var(--color-accent)] outline-none"
              placeholder="Player name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Number</label>
            <input
              type="number"
              min="1"
              max="99"
              value={number}
              onChange={e => setNumber(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] text-white border border-white/10 focus:border-[var(--color-accent)] outline-none"
              placeholder="Jersey #"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(POSITIONS).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPosition(key)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    key === position
                      ? 'text-white ring-2 ring-white/30'
                      : 'text-white/70 opacity-60'
                  }`}
                  style={{ background: info.color }}
                >
                  {info.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-[var(--color-surface-3)] text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-[var(--color-accent)] text-white font-bold"
            >
              {player ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
