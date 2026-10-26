import { useState } from 'react';
import Page, { Tabs } from '../shell/Page';
import { Card } from '../shell/ui';
import { buttonClass } from '../shell/styles';
import LiveEntry from '../stats/LiveEntry';
import PlayByPlayEntry from '../stats/PlayByPlayEntry';
import VideoReviewEntry from '../stats/VideoReviewEntry';
import MatchForm from '../stats/MatchForm';

const MODES = [
  { id: 'live', label: 'Live courtside' },
  { id: 'pbp', label: 'Rally by rally' },
  { id: 'video', label: 'From video' },
];

const MODE_HELP = {
  live: 'One tap per touch while the match is on. Pick the player, then what they did.',
  pbp: 'Build each rally touch by touch, then log who won it. Rotation and serve follow automatically.',
  video: 'Run the clock alongside the video and log touches against the timestamp.',
};

export default function RecordPage({ section, page, state, dispatch, activeMatch }) {
  const [mode, setMode] = useState('live');
  const [showForm, setShowForm] = useState(false);
  const inProgress = state.matches.filter(m => !m.completed);

  const form = showForm && (
    <MatchForm
      lineups={state.lineups}
      activeLineupId={state.activeLineupId}
      onSave={data => { dispatch({ type: 'CREATE_MATCH', ...data }); setShowForm(false); }}
      onClose={() => setShowForm(false)}
    />
  );

  if (!activeMatch) {
    return (
      <Page section={section} page={page} actions={<button className={buttonClass.primary} onClick={() => setShowForm(true)}>+ New match</button>}>
        <div className="grid gap-4 lg:grid-cols-3">
          {MODES.map(m => (
            <Card key={m.id} className="p-5">
              <div className="font-bold">{m.label}</div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{MODE_HELP[m.id]}</p>
            </Card>
          ))}
        </div>

        {inProgress.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">In progress</h2>
            <div className="grid gap-2 lg:grid-cols-2">
              {inProgress.map(m => (
                <button
                  key={m.id}
                  onClick={() => dispatch({ type: 'SET_ACTIVE_MATCH', matchId: m.id })}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-left hover:border-[var(--color-muted)]"
                >
                  <span><span className="font-semibold">vs {m.opponent}</span> <span className="text-sm text-[var(--color-muted)]">{m.date}</span></span>
                  <span className="text-sm font-semibold text-[var(--color-accent)]">Resume →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-[var(--color-muted)]">
          Every touch is stored as an event, and the Analytics pages update as you go.
        </p>
        {form}
      </Page>
    );
  }

  const props = {
    match: activeMatch,
    players: state.players,
    lineups: state.lineups,
    dispatch,
    currentRotation: state.currentRotation,
    activeSetNumber: state.activeSetNumber,
  };

  return (
    <Page
      section={section}
      page={page}
      title={`Recording: vs ${activeMatch.opponent}`}
      desc={MODE_HELP[mode]}
      controls={<Tabs items={MODES} value={mode} onChange={setMode} label="Entry mode" />}
      actions={<button className={buttonClass.secondary} onClick={() => dispatch({ type: 'SET_ACTIVE_MATCH', matchId: null })}>Pause</button>}
      scroll={false}
    >
      <div className="flex-1 min-h-0 flex flex-col w-full max-w-3xl lg:mx-8 lg:mb-6 lg:rounded-2xl lg:border lg:border-[var(--color-line)] overflow-hidden">
        {mode === 'live' && <LiveEntry {...props} statEntries={state.statEntries} />}
        {mode === 'pbp' && <PlayByPlayEntry {...props} rallies={state.rallies} />}
        {mode === 'video' && <VideoReviewEntry {...props} />}
      </div>
    </Page>
  );
}
