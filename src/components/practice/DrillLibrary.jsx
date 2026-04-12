import { useState, useMemo } from 'react';
import { DRILLS } from '../../data/drills';
import DrillCard from './DrillCard';
import DrillFilterBar from './DrillFilterBar';

export default function DrillLibrary({ onAddDrill, activePlanId }) {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ skills: [], difficulty: [] });
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let result = DRILLS;

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }

    if (filters.skills.length > 0) {
      result = result.filter((d) =>
        filters.skills.some((s) => d.skillFocus.includes(s))
      );
    }

    if (filters.difficulty.length > 0) {
      result = result.filter((d) => filters.difficulty.includes(d.difficulty));
    }

    return result;
  }, [searchText, filters]);

  const handleAdd = (drill) => {
    if (!activePlanId) return;
    onAddDrill(drill);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5">
        <DrillFilterBar
          filters={filters}
          onFilterChange={setFilters}
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No drills match your filters.</p>
            <button
              onClick={() => {
                setSearchText('');
                setFilters({ skills: [], difficulty: [] });
              }}
              className="mt-2 text-xs text-accent hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              expanded={expandedId === drill.id}
              onToggle={() =>
                setExpandedId(expandedId === drill.id ? null : drill.id)
              }
              onAdd={activePlanId ? handleAdd : null}
            />
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/5 text-center">
        <span className="text-[10px] text-gray-500">
          {filtered.length} of {DRILLS.length} drills shown
        </span>
      </div>
    </div>
  );
}
