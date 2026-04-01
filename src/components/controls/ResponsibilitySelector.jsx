import { RESPONSIBILITY_SETS } from '../../data/responsibilities';

export default function ResponsibilitySelector({ activeResponsibilityId, dispatch }) {
  const options = [{ id: null, name: 'Off' }, ...RESPONSIBILITY_SETS];

  return (
    <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto bg-[var(--color-surface)] border-b border-white/5">
      <span className="text-xs text-gray-500 self-center mr-1 whitespace-nowrap">Duties:</span>
      {options.map(o => (
        <button
          key={o.id || 'off'}
          onClick={() => dispatch({ type: 'SET_RESPONSIBILITY', id: o.id })}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            o.id === activeResponsibilityId
              ? 'bg-yellow-600 text-white'
              : 'bg-[var(--color-surface-3)] text-gray-400'
          }`}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}
