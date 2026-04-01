import { useEffect, useRef } from 'react';
import { getStrategy } from '../../data/strategyData';
import { POSITIONS } from '../../data/positions';

const ROLE_TO_POSITION = {
  S: 'setter', OH1: 'outside', OH2: 'outside',
  MB1: 'middle', MB2: 'middle', OPP: 'opposite',
};

const FIELD_ICONS = {
  primary: '🎯',
  transition: '➡️',
  blocking: '🛡️',
  defense: '🏐',
  communication: '📢',
  reads: '👁️',
  tip: '💡',
  serve: '🔥',
};

const FIELD_LABELS = {
  primary: 'Primary Role',
  transition: 'Transition',
  blocking: 'Blocking',
  defense: 'Defense',
  communication: 'Communication',
  reads: 'Key Reads',
  tip: 'Coaching Tip',
  serve: 'Serve Strategy',
};

export default function PlayerStrategyCard({ selectedSlot, rotation, placements, onClose }) {
  const cardRef = useRef(null);

  // Close on outside tap
  useEffect(() => {
    const handle = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay listener to avoid triggering on the same tap
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handle);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handle);
    };
  }, [onClose]);

  if (selectedSlot == null) return null;

  const strategy = getStrategy(rotation, selectedSlot);
  if (!strategy) return null;

  const placement = placements.find(p => p.rotationalPosition === selectedSlot);
  const player = placement?.player;
  const posKey = ROLE_TO_POSITION[strategy.role] || 'ds';
  const posInfo = POSITIONS[posKey];
  const isLibero = placement?.isLiberoIn;
  const displayColor = isLibero ? POSITIONS.libero.color : posInfo?.color || '#666';

  const fields = ['primary', 'transition', 'blocking', 'defense', 'communication', 'reads', 'tip', 'serve'];

  return (
    <div
      ref={cardRef}
      className="fixed bottom-12 left-0 right-0 z-50 animate-slide-up"
    >
      <div
        className="mx-2 rounded-t-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(30,30,40,0.98) 0%, rgba(20,20,30,0.99) 100%)',
          borderTop: `3px solid ${displayColor}`,
          maxHeight: '55vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: displayColor }}
          >
            {player?.number || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base truncate">
              {player?.name || 'Unknown'}
            </div>
            <div className="text-xs" style={{ color: displayColor }}>
              {isLibero ? 'Libero' : posInfo?.label || 'Player'} · R{rotation} · Pos {selectedSlot}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Strategy fields */}
        <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: '42vh' }}>
          {fields.map(field => {
            const value = strategy[field];
            if (!value) return null;
            return (
              <div key={field} className="flex gap-2">
                <span className="text-base shrink-0 mt-0.5">{FIELD_ICONS[field]}</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    {FIELD_LABELS[field]}
                  </div>
                  <div className="text-sm text-gray-200 leading-snug">{value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
