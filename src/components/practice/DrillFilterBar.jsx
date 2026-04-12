import { SKILL_TAGS, DIFFICULTY_LEVELS } from '../../data/drills';

const SKILL_COLORS = {
  passing: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  serving: 'bg-green-500/20 text-green-300 border-green-500/40',
  hitting: 'bg-red-500/20 text-red-300 border-red-500/40',
  blocking: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  defense: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  setting: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  transition: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
};

const SKILL_COLORS_ACTIVE = {
  passing: 'bg-blue-500 text-white border-blue-400',
  serving: 'bg-green-500 text-white border-green-400',
  hitting: 'bg-red-500 text-white border-red-400',
  blocking: 'bg-yellow-500 text-white border-yellow-400',
  defense: 'bg-purple-500 text-white border-purple-400',
  setting: 'bg-orange-500 text-white border-orange-400',
  transition: 'bg-cyan-500 text-white border-cyan-400',
};

const DIFF_COLORS = {
  beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  advanced: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

const DIFF_COLORS_ACTIVE = {
  beginner: 'bg-emerald-500 text-white border-emerald-400',
  intermediate: 'bg-amber-500 text-white border-amber-400',
  advanced: 'bg-rose-500 text-white border-rose-400',
};

export default function DrillFilterBar({ filters, onFilterChange, searchText, onSearchChange }) {
  const toggleSkill = (skill) => {
    const skills = filters.skills || [];
    const next = skills.includes(skill)
      ? skills.filter((s) => s !== skill)
      : [...skills, skill];
    onFilterChange({ ...filters, skills: next });
  };

  const toggleDifficulty = (diff) => {
    const diffs = filters.difficulty || [];
    const next = diffs.includes(diff)
      ? diffs.filter((d) => d !== diff)
      : [...diffs, diff];
    onFilterChange({ ...filters, difficulty: next });
  };

  const activeSkills = filters.skills || [];
  const activeDiffs = filters.difficulty || [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search drills..."
          className="w-full bg-surface-2 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SKILL_TAGS.map((skill) => {
          const active = activeSkills.includes(skill);
          return (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${
                active ? SKILL_COLORS_ACTIVE[skill] : SKILL_COLORS[skill]
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DIFFICULTY_LEVELS.map((diff) => {
          const active = activeDiffs.includes(diff);
          return (
            <button
              key={diff}
              onClick={() => toggleDifficulty(diff)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${
                active ? DIFF_COLORS_ACTIVE[diff] : DIFF_COLORS[diff]
              }`}
            >
              {diff}
            </button>
          );
        })}
      </div>
    </div>
  );
}
