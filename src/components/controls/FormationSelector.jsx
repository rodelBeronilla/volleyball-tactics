import { FORMATIONS } from '../../data/formations';

export default function FormationSelector({ activeFormationId, dispatch, compact }) {
  if (compact) {
    return (
      <>
        {FORMATIONS.map(f => (
          <button
            key={f.id}
            onClick={() => dispatch({ type: 'SET_FORMATION', id: f.id })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${
              f.id === activeFormationId
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-3)] text-gray-400'
            }`}
          >
            {f.name}
          </button>
        ))}
      </>
    );
  }

  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-[var(--color-surface-2)] border-b border-white/5">
      {FORMATIONS.map(f => (
        <button
          key={f.id}
          onClick={() => dispatch({ type: 'SET_FORMATION', id: f.id })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            f.id === activeFormationId
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface-3)] text-gray-400'
          }`}
        >
          {f.name}
        </button>
      ))}
    </div>
  );
}
