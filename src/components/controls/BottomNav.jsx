const tabs = [
  { id: 'court', label: 'Court', icon: '⬡' },
  { id: 'gameday', label: 'Game Day', icon: '📋' },
  { id: 'stats', label: 'Stats', icon: '▥' },
  { id: 'practice', label: 'Practice', icon: '⏱' },
  { id: 'film', label: 'Film', icon: '▶' },
  { id: 'more', label: 'More', icon: '⚙' },
];

export default function BottomNav({ activeTab, dispatch }) {
  return (
    <nav
      className="flex bg-[var(--color-surface-2)] border-t border-white/10 shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="tablist"
    >
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === activeTab}
          aria-label={t.label}
          onClick={() => dispatch({ type: 'SET_TAB', tab: t.id })}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
            t.id === activeTab ? 'text-[var(--color-accent)]' : 'text-gray-500'
          }`}
        >
          <span className="text-lg leading-none">{t.icon}</span>
          <span className="text-xs leading-none font-medium">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
