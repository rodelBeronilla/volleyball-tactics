import { useState } from 'react';
import { POSITIONS } from '../../data/positions';
import { ARCHETYPES } from '../../data/archetypes';

export default function PlayerForm({ player, onSave, onClose }) {
  const [name, setName] = useState(player?.name || '');
  const [number, setNumber] = useState(player?.number?.toString() || '');
  const [position, setPosition] = useState(player?.position || 'outside');
  const [archetype, setArchetype] = useState(player?.archetype || '');

  // Filter archetypes for current position
  const availableArchetypes = Object.entries(ARCHETYPES).filter(([, a]) => a.position === position);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !number) return;
    onSave({ name: name.trim(), number: parseInt(number, 10), position, archetype: archetype || null });
  };

  const handlePositionChange = (pos) => {
    setPosition(pos);
    // Reset archetype if it doesn't match the new position
    const currentArch = ARCHETYPES[archetype];
    if (currentArch && currentArch.position !== pos) {
      setArchetype('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--color-surface-2)] rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
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
                  onClick={() => handlePositionChange(key)}
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

          {/* Archetype selection */}
          {availableArchetypes.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Play Style (Archetype)</label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setArchetype('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    !archetype
                      ? 'bg-[var(--color-surface-3)] text-white ring-1 ring-white/20'
                      : 'bg-[var(--color-surface)] text-gray-500'
                  }`}
                >
                  None (generic)
                </button>
                {availableArchetypes.map(([key, arch]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setArchetype(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      key === archetype
                        ? 'ring-1 ring-white/20 text-white'
                        : 'text-gray-400'
                    }`}
                    style={{ background: key === archetype ? arch.color + '33' : 'var(--color-surface)' }}
                  >
                    <span className="font-bold">{arch.label}</span>
                    <span className="text-gray-400 ml-2">{arch.description}</span>
                    <div className="flex gap-1 mt-1">
                      {arch.strengths.map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 text-[10px]">{s}</span>
                      ))}
                      {arch.weaknesses.map(w => (
                        <span key={w} className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 text-[10px]">{w}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
