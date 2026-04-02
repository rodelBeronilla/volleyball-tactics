const tabs = [
  { id: 'court', label: 'Court', icon: '⬡' },
  { id: 'stats', label: 'Stats', icon: '▥' },
  { id: 'roster', label: 'Roster', icon: '☰' },
  { id: 'lineups', label: 'Lineups', icon: '▤' },
  { id: 'analysis', label: 'Analysis', icon: '◈' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function BottomNav({ activeTab, dispatch }) {
  return (
    <nav className="flex bg-[var(--color-surface-2)] border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => dispatch({ type: 'SET_TAB', tab: t.id })}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
            t.id === activeTab ? 'text-[var(--color-accent)]' : 'text-gray-500'
          }`}
        >
          <span className="text-lg">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
