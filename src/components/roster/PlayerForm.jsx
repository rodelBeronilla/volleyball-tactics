import { useState } from 'react';
import { POSITIONS } from '../../data/positions';
import { ARCHETYPES, ATTRIBUTES, ATTRIBUTE_LABELS } from '../../data/archetypes';

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (const attr of ATTRIBUTES) {
    const va = a[attr] || 0;
    const vb = b[attr] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function detectArchetypeFromRatings(ratings, position) {
  const candidates = Object.entries(ARCHETYPES)
    .filter(([, a]) => a.position === position)
    .map(([id, a]) => ({ id, ...a, similarity: cosineSimilarity(ratings, a.ratings) }))
    .sort((a, b) => b.similarity - a.similarity);

  return candidates;
}

function RatingSlider({ label, value, onChange }) {
  const color = value >= 8 ? '#22c55e' : value >= 5 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-14 shrink-0">{label}</span>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${(value / 10) * 100}%, rgba(255,255,255,0.1) ${(value / 10) * 100}%)`,
        }}
      />
      <span className="text-sm font-bold tabular-nums w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export default function PlayerForm({ player, onSave, onClose }) {
  const [name, setName] = useState(player?.name || '');
  const [number, setNumber] = useState(player?.number?.toString() || '');
  const [position, setPosition] = useState(player?.position || 'outside');

  // Initialize base ratings from player's existing baseRatings, or archetype, or position defaults
  const initialRatings = player?.baseRatings
    || (player?.archetype && ARCHETYPES[player.archetype]?.ratings)
    || { attack: 5, block: 5, serve: 5, pass: 5, defense: 5, set: 5, speed: 5 };

  const [ratings, setRatings] = useState({ ...initialRatings });

  const updateRating = (attr, value) => {
    setRatings(prev => ({ ...prev, [attr]: value }));
  };

  // Auto-detect archetype from current ratings
  const archetypeMatches = detectArchetypeFromRatings(ratings, position);
  const bestMatch = archetypeMatches[0];
  const matchPct = bestMatch ? Math.round(bestMatch.similarity * 100) : 0;

  const handlePositionChange = (pos) => {
    setPosition(pos);
    // Adjust default ratings for new position if ratings are all 5s (untouched)
    const allDefault = ATTRIBUTES.every(a => ratings[a] === 5);
    if (allDefault) {
      const posDefaults = {
        setter: { attack: 3, block: 5, serve: 5, pass: 6, defense: 5, set: 8, speed: 6 },
        outside: { attack: 7, block: 5, serve: 6, pass: 6, defense: 6, set: 4, speed: 6 },
        middle: { attack: 7, block: 8, serve: 5, pass: 3, defense: 3, set: 2, speed: 6 },
        opposite: { attack: 8, block: 6, serve: 7, pass: 4, defense: 4, set: 3, speed: 5 },
        libero: { attack: 1, block: 1, serve: 1, pass: 8, defense: 8, set: 4, speed: 7 },
        ds: { attack: 3, block: 2, serve: 5, pass: 7, defense: 7, set: 4, speed: 6 },
      };
      if (posDefaults[pos]) setRatings({ ...posDefaults[pos] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !number) return;
    onSave({
      name: name.trim(),
      number: parseInt(number, 10),
      position,
      baseRatings: { ...ratings },
      archetype: bestMatch?.id || null, // auto-detected, not manually chosen
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--color-surface-2)] rounded-t-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">{player ? 'Edit Player' : 'Add Player'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name + Number row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] text-white border border-white/10 focus:border-[var(--color-accent)] outline-none"
                placeholder="Player name" autoFocus
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-400 mb-1">Number</label>
              <input
                type="number" min="0" max="99" value={number} onChange={e => setNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] text-white border border-white/10 focus:border-[var(--color-accent)] outline-none text-center"
                placeholder="#"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Position</label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(POSITIONS).map(([key, info]) => (
                <button
                  key={key} type="button"
                  onClick={() => handlePositionChange(key)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    key === position ? 'text-white ring-2 ring-white/30' : 'text-white/70 opacity-60'
                  }`}
                  style={{ background: info.color }}
                >
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attribute Scores — sliders */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Rate This Player (1-10)</label>
            <div className="space-y-2 p-3 rounded-xl bg-[var(--color-surface)] border border-white/5">
              {ATTRIBUTES.map(attr => (
                <RatingSlider
                  key={attr}
                  label={ATTRIBUTE_LABELS[attr]}
                  value={ratings[attr]}
                  onChange={v => updateRating(attr, v)}
                />
              ))}
            </div>
          </div>

          {/* Auto-detected archetype */}
          {bestMatch && matchPct > 70 && (
            <div className="p-3 rounded-xl border border-white/5" style={{ background: bestMatch.color + '15', borderColor: bestMatch.color + '30' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">{bestMatch.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{matchPct}% match</span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: bestMatch.color + '33', color: bestMatch.color }}>
                  {matchPct}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{bestMatch.description}</p>
              {archetypeMatches.length > 1 && archetypeMatches[1].similarity > 0.85 && (
                <p className="text-xs text-gray-500 mt-1">
                  Also resembles: {archetypeMatches[1].label} ({Math.round(archetypeMatches[1].similarity * 100)}%)
                </p>
              )}
            </div>
          )}

          {bestMatch && matchPct <= 70 && (
            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-white/5">
              <span className="text-xs text-gray-400">Unique profile — doesn't strongly match any standard archetype</span>
              {archetypeMatches.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Closest: {archetypeMatches[0].label} ({matchPct}%)
                </p>
              )}
            </div>
          )}

          {/* Save/Cancel */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-[var(--color-surface-3)] text-gray-300 font-medium">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-lg bg-[var(--color-accent)] text-white font-bold">
              {player ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
