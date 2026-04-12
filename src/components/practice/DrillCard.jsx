const DIFF_BADGE = {
  beginner: 'bg-emerald-500/20 text-emerald-300',
  intermediate: 'bg-amber-500/20 text-amber-300',
  advanced: 'bg-rose-500/20 text-rose-300',
};

const SKILL_CHIP = {
  passing: 'bg-blue-500/20 text-blue-300',
  serving: 'bg-green-500/20 text-green-300',
  hitting: 'bg-red-500/20 text-red-300',
  blocking: 'bg-yellow-500/20 text-yellow-300',
  defense: 'bg-purple-500/20 text-purple-300',
  setting: 'bg-orange-500/20 text-orange-300',
  transition: 'bg-cyan-500/20 text-cyan-300',
};

const CATEGORY_LABEL = {
  warmup: 'Warm Up',
  drill: 'Drill',
  game: 'Game-Like',
  cooldown: 'Cool Down',
};

export default function DrillCard({ drill, onAdd, expanded, onToggle }) {
  return (
    <div
      className="bg-surface-2 border border-white/5 rounded-xl overflow-hidden transition-all"
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-3 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-gray-100 leading-tight">
              {drill.name}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">
                {drill.defaultDuration} min
              </span>
              <span className="text-xs text-gray-600">|</span>
              <span className="text-xs text-gray-400">
                {CATEGORY_LABEL[drill.category] || drill.category}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                  DIFF_BADGE[drill.difficulty] || 'bg-gray-500/20 text-gray-300'
                }`}
              >
                {drill.difficulty}
              </span>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {drill.skillFocus.map((skill) => (
            <span
              key={skill}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                SKILL_CHIP[skill] || 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {skill}
            </span>
          ))}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
          <p className="text-xs text-gray-300 leading-relaxed">
            {drill.description}
          </p>

          {drill.variations && drill.variations.length > 0 && (
            <div>
              <h5 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                Variations
              </h5>
              <ul className="space-y-0.5">
                {drill.variations.map((v, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                    <span className="text-gray-600 shrink-0">-</span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drill.teamWeaknesses && drill.teamWeaknesses.length > 0 && (
            <div>
              <h5 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                Addresses Weaknesses
              </h5>
              <div className="flex flex-wrap gap-1">
                {drill.teamWeaknesses.map((w) => (
                  <span
                    key={w}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent capitalize"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-500">
              {drill.playerCount.min}-{drill.playerCount.max} players
            </span>
            {onAdd && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(drill);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent/90 hover:bg-accent text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14m-7-7h14" />
                </svg>
                Add to Plan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
