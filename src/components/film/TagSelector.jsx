import { RALLY_TAGS } from '../../data/rallyTags';

/**
 * Multi-select tag chips for rally tagging.
 * Each tag rendered as a colored chip that toggles on tap.
 */
export default function TagSelector({ selectedTags = [], onToggleTag }) {
  const selectedCount = selectedTags.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Tags</span>
        {selectedCount > 0 && (
          <span className="text-xs text-white/40">{selectedCount} selected</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {RALLY_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: isSelected ? tag.color : 'transparent',
                color: isSelected ? '#fff' : tag.color,
                border: `1.5px solid ${tag.color}`,
                opacity: isSelected ? 1 : 0.7,
              }}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
