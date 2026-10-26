import { useMemo } from 'react';
import { POSITIONS } from '../../data/positions';
import { aggregateByPlayer, aggregateByRotation, computeStatLine, countSetsPlayed } from '../../utils/statAggregation';
import { hitFmt } from '../../utils/seasonSummary';
import { Card, SectionTitle } from '../shell/ui';
import { th, thNum, td, tdNum } from '../shell/styles';

// Box-score columns: [header, title, value(statLine)]
const COLUMNS = [
  ['K', 'Kills (incl. tips and tooled)', l => l.totalKills],
  ['E', 'Attack errors (incl. blocked)', l => (l.attackError || 0) + (l.attackBlocked || 0)],
  ['TA', 'Total attempts', l => l.attackAttempts],
  ['Hit', 'Hitting %: (K − E) / TA', l => hitFmt(l.hitPct)],
  ['A', 'Assists', l => l.assist || 0],
  ['SA', 'Service aces', l => l.ace || 0],
  ['SE', 'Service errors', l => l.serviceError || 0],
  ['R', 'Serve receptions', l => l.totalPasses],
  ['Pass', 'Passing average (0–3)', l => (l.passAvg === null ? '—' : l.passAvg.toFixed(2))],
  ['Dig', 'Digs', l => l.dig || 0],
  ['BS', 'Block solos', l => l.blockSolo || 0],
  ['BA', 'Block assists', l => l.blockAssist || 0],
];

/** Box score for one match: set scores, a stat table per player and team rotation splits. */
export default function MatchDetail({ match, statEntries, players }) {
  const matchEntries = useMemo(() => statEntries.filter(e => e.matchId === match.id), [statEntries, match.id]);

  const rows = useMemo(() => {
    const byPlayer = aggregateByPlayer(matchEntries);
    return players
      .filter(p => byPlayer[p.id])
      .map(p => ({ player: p, line: computeStatLine(byPlayer[p.id], countSetsPlayed(matchEntries, p.id)) }));
  }, [matchEntries, players]);

  const rotations = useMemo(() => {
    const byRot = aggregateByRotation(matchEntries.filter(e => e.playerId === '__team__'));
    return [1, 2, 3, 4, 5, 6].map(r => {
      const c = byRot[r]?.__team__ || {};
      return { r, won: c.rallyWon || 0, lost: c.rallyLost || 0 };
    });
  }, [matchEntries]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {match.sets.map(s => (
          <div key={s.number} className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
            s.won === true ? 'bg-green-900/20 text-green-400 border-green-800/30'
              : s.won === false ? 'bg-red-900/20 text-red-400 border-red-800/30'
                : 'bg-white/5 text-gray-400 border-white/5'
          }`}>
            Set {s.number}: {s.ourScore}–{s.theirScore}
          </div>
        ))}
      </div>

      <SectionTitle aside={`${matchEntries.length} events`}>Box score</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No stats recorded for this match.</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)]">
              <tr>
                <th className={th}>Player</th>
                {COLUMNS.map(([h, title]) => <th key={h} className={thNum} title={title}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ player, line }) => (
                <tr key={player.id} className="border-b border-[var(--color-line)]/60 last:border-0">
                  <td className={td}>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-white" style={{ background: (POSITIONS[player.position] || POSITIONS.ds).color }}>
                        {player.number}
                      </span>
                      <span className="font-semibold">{player.name}</span>
                    </span>
                  </td>
                  {COLUMNS.map(([h, , value]) => <td key={h} className={tdNum}>{value(line)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SectionTitle>Points by rotation</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {rotations.map(({ r, won, lost }) => (
          <Card key={r} className="p-3 text-center">
            <div className="text-xs text-[var(--color-muted)] font-semibold">R{r}</div>
            <div className={`text-lg font-extrabold tabular-nums ${won > lost ? 'text-green-400' : won < lost ? 'text-red-400' : ''}`}>
              {won}–{lost}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
