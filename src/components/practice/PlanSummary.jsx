import { useMemo } from 'react';
import { DRILLS } from '../../data/drills';

const SKILL_BAR_COLORS = {
  passing: 'bg-blue-500',
  serving: 'bg-green-500',
  hitting: 'bg-red-500',
  blocking: 'bg-yellow-500',
  defense: 'bg-purple-500',
  setting: 'bg-orange-500',
  transition: 'bg-cyan-500',
};

export default function PlanSummary({ plan, players }) {
  const drillMap = useMemo(() => {
    const map = {};
    DRILLS.forEach((d) => { map[d.id] = d; });
    return map;
  }, []);

  const totalDuration = useMemo(() => {
    return (plan.blocks || []).reduce((sum, b) => sum + (b.duration || 0), 0);
  }, [plan.blocks]);

  const skillMinutes = useMemo(() => {
    const minutes = {};
    (plan.blocks || []).forEach((block) => {
      const drill = drillMap[block.drillId];
      if (!drill) return;
      const perSkill = block.duration / drill.skillFocus.length;
      drill.skillFocus.forEach((skill) => {
        minutes[skill] = (minutes[skill] || 0) + perSkill;
      });
    });
    return Object.entries(minutes).sort((a, b) => b[1] - a[1]);
  }, [plan.blocks, drillMap]);

  const playerMinutes = useMemo(() => {
    const pMinutes = {};
    (plan.blocks || []).forEach((block) => {
      const targetIds = block.targetPlayerIds || [];
      if (targetIds.length === 0) return;
      targetIds.forEach((pid) => {
        pMinutes[pid] = (pMinutes[pid] || 0) + block.duration;
      });
    });
    return Object.entries(pMinutes)
      .map(([id, mins]) => {
        const player = (players || []).find((p) => p.id === id);
        return { id, name: player ? `#${player.number} ${player.name}` : id, minutes: mins };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [plan.blocks, players]);

  const maxSkillMin = skillMinutes.length > 0 ? skillMinutes[0][1] : 1;

  if (!plan.blocks || plan.blocks.length === 0) {
    return (
      <div className="p-3 bg-surface-3/50 border-t border-white/5 text-center">
        <p className="text-xs text-gray-500">Add drills to see a summary.</p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-surface-3/50 border-t border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Plan Summary
        </h4>
        <span className="text-sm font-bold text-accent tabular-nums">
          {totalDuration} min total
        </span>
      </div>

      {skillMinutes.length > 0 && (
        <div>
          <h5 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
            Skill Coverage
          </h5>
          <div className="space-y-1">
            {skillMinutes.map(([skill, mins]) => (
              <div key={skill} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 capitalize w-16 shrink-0">
                  {skill}
                </span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      SKILL_BAR_COLORS[skill] || 'bg-gray-500'
                    }`}
                    style={{ width: `${(mins / maxSkillMin) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums w-10 text-right">
                  {Math.round(mins)} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {playerMinutes.length > 0 && (
        <div>
          <h5 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
            Player Focus Time
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {playerMinutes.map((p) => (
              <span
                key={p.id}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-gray-300 border border-white/5"
              >
                {p.name}: {p.minutes} min
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
