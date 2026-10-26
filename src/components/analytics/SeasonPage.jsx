import { useMemo } from 'react';
import Page from '../shell/Page';
import Icon from '../shell/Icon';
import MatchDetail from '../stats/MatchDetail';
import { Card, Empty, SectionTitle, StatTile } from '../shell/ui';
import { buttonClass, th, thNum, td, tdNum } from '../shell/styles';
import { seasonSummary, matchRows, pct, hitFmt } from '../../utils/seasonSummary';
import { href, navigate } from '../../router';

export function SeasonTiles({ summary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatTile label="Record" value={`${summary.wins}–${summary.losses}`} sub={`${summary.setsWon}–${summary.setsLost} in sets`} />
      <StatTile label="Side-out" value={pct(summary.sideOutRate)} sub="points won on their serve" />
      <StatTile label="Break point" value={pct(summary.breakPointRate)} sub="points won on our serve" />
      <StatTile label="Hitting" value={hitFmt(summary.hitPct)} sub={`${summary.killsPerSet.toFixed(1)} kills per set`} />
      <StatTile label="Passing" value={summary.passAvg === null ? '—' : summary.passAvg.toFixed(2)} sub="serve-receive average, 0–3" />
      <StatTile
        label="Best rotation"
        value={summary.bestRotation ? `R${summary.bestRotation.rotation}` : '—'}
        sub={summary.bestRotation ? `${pct(summary.bestRotation.rate)} side-out` : 'no rally data'}
      />
    </div>
  );
}

export default function SeasonPage({ section, page, matchId, state, dispatch }) {
  const { matches, rallies, statEntries, players } = state;
  const summary = useMemo(() => seasonSummary(matches, rallies, statEntries), [matches, rallies, statEntries]);
  const rows = useMemo(() => matchRows(matches, rallies, statEntries), [matches, rallies, statEntries]);

  const match = matchId && matches.find(m => m.id === matchId);
  if (match) {
    const won = match.sets.filter(s => s.won === true).length;
    const lost = match.sets.filter(s => s.won === false).length;
    return (
      <Page
        section={section}
        page={page}
        title={`vs ${match.opponent}`}
        desc={`${match.date} · ${match.completed ? `${won > lost ? 'Won' : 'Lost'} ${won}–${lost}` : 'In progress'}`}
        controls={
          <a href={href('/analytics/season')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">
            <Icon name="back" className="w-4 h-4" /> All matches
          </a>
        }
        actions={
          <button
            className={buttonClass.danger}
            onClick={() => {
              if (!window.confirm(`Delete the match vs ${match.opponent} and its stats?`)) return;
              dispatch({ type: 'DELETE_MATCH', matchId: match.id });
              navigate('/analytics/season', { replace: true });
            }}
          >
            Delete match
          </button>
        }
      >
        <MatchDetail match={match} statEntries={statEntries} players={players} />
      </Page>
    );
  }

  const open = row => {
    if (row.match.completed) navigate(`/analytics/season/${row.match.id}`);
    else {
      dispatch({ type: 'SET_ACTIVE_MATCH', matchId: row.match.id });
      navigate('/game/record');
    }
  };

  return (
    <Page section={section} page={page}>
      {matches.length === 0 ? (
        <Empty title="No matches yet" action={<a href={href('/game/record')} className={buttonClass.primary}>Record a match</a>}>
          Record a match and its results and box score show up here.
        </Empty>
      ) : (
        <>
          <SeasonTiles summary={summary} />

          <SectionTitle aside={`${summary.rallies} rallies · ${summary.events.toLocaleString()} events`}>Results</SectionTitle>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-line)]">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Opponent</th>
                  <th className={th}>Result</th>
                  <th className={th}>Sets</th>
                  <th className={thNum} title="Team hitting %">Hit</th>
                  <th className={thNum} title="Points won on their serve">Side-out</th>
                  <th className={thNum} title="Points won on our serve">Break</th>
                  <th className={thNum}>Kills</th>
                  <th className={thNum}>Aces</th>
                  <th className={thNum}>Blocks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.match.id}
                    onClick={() => open(row)}
                    onKeyDown={e => { if (e.key === 'Enter') open(row); }}
                    tabIndex={0}
                    className="border-b border-[var(--color-line)]/60 last:border-0 cursor-pointer hover:bg-white/[0.03] focus:bg-white/[0.05] outline-none"
                  >
                    <td className={`${td} text-[var(--color-muted)]`}>{row.match.date}</td>
                    <td className={`${td} font-semibold`}>{row.match.opponent}</td>
                    <td className={td}>
                      {row.won === null ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-900/30 text-yellow-400">Live</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.won ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {row.won ? 'W' : 'L'} {row.setsWon}–{row.setsLost}
                        </span>
                      )}
                    </td>
                    <td className={`${td} text-[var(--color-muted)] tabular-nums`}>
                      {row.match.sets.map(s => `${s.ourScore}–${s.theirScore}`).join(', ')}
                    </td>
                    <td className={tdNum}>{hitFmt(row.hitPct)}</td>
                    <td className={tdNum}>{pct(row.sideOutRate)}</td>
                    <td className={tdNum}>{pct(row.breakPointRate)}</td>
                    <td className={tdNum}>{row.kills}</td>
                    <td className={tdNum}>{row.aces}</td>
                    <td className={tdNum}>{row.blocks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </Page>
  );
}
