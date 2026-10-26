import { useMemo } from 'react';
import Icon from '../shell/Icon';
import { Card, SectionTitle } from '../shell/ui';
import { buttonClass } from '../shell/styles';
import { SeasonTiles } from '../analytics/SeasonPage';
import { SECTIONS, pathOf, REPO_URL } from '../../nav';
import { href } from '../../router';
import { seasonSummary } from '../../utils/seasonSummary';
import courtPreview from '../../assets/previews/court.webp';
import receivePreview from '../../assets/previews/receive.webp';
import setterPreview from '../../assets/previews/setter.webp';

const PREVIEWS = { court: courtPreview, 'serve-receive': receivePreview, 'setter-signals': setterPreview };

export default function HomePage({ state }) {
  const { matches, rallies, statEntries } = state;
  const summary = useMemo(() => seasonSummary(matches, rallies, statEntries), [matches, rallies, statEntries]);
  const playbook = SECTIONS.find(s => s.id === 'playbook');
  const others = SECTIONS.filter(s => s.id !== 'home' && s.id !== 'playbook');

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl px-4 lg:px-8 pt-8 lg:pt-12 pb-12">
        {/* Intro */}
        <p className="text-xs font-bold uppercase tracking-widest text-green-400">Coaching toolkit · 5-1 system</p>
        <h1 className="mt-3 text-3xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] max-w-3xl">
          Plan the rotation, call the set, read the numbers.
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--color-muted)] lg:text-lg leading-relaxed">
          One app for a volleyball team: a playbook for every rotation, stat capture during the match,
          and analytics built from every rally. It runs in the browser, courtside on a phone or on a laptop.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={href('/playbook/court')} className={buttonClass.primary}>Open the playbook</a>
          <a href={href('/analytics/season')} className={buttonClass.secondary}>See the season</a>
        </div>

        {/* Season at a glance */}
        {matches.length > 0 && (
          <>
            <SectionTitle aside={<a href={href('/analytics/season')} className="font-semibold text-[var(--color-accent)]">All results →</a>}>
              This season
            </SectionTitle>
            <SeasonTiles summary={summary} />
          </>
        )}

        {/* Playbook: the three court tools */}
        <SectionTitle>{playbook.label}</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          {playbook.pages.map(p => (
            <a key={p.id} href={href(pathOf('playbook', p.id))} className="group block">
              <Card className="overflow-hidden h-full transition-colors group-hover:border-[var(--color-muted)]">
                <img src={PREVIEWS[p.id]} alt="" width="1200" height="750" loading="lazy" className="aspect-[16/10] w-full object-cover object-top border-b border-[var(--color-line)]" />
                <div className="p-4">
                  <div className="font-bold flex items-center justify-between">
                    {p.title}
                    <Icon name="arrow" className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-ink)]" />
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{p.desc}</p>
                </div>
              </Card>
            </a>
          ))}
        </div>

        {/* The other sections */}
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          {others.map(s => (
            <Card key={s.id} className="p-5">
              <div className="flex items-center gap-2 font-bold">
                <Icon name={s.icon} className="w-5 h-5 text-[var(--color-accent)]" />
                {s.label}
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.blurb}</p>
              <ul className="mt-3 space-y-1">
                {s.pages.map(p => (
                  <li key={p.id}>
                    <a href={href(pathOf(s.id, p.id))} className="text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]">
                      {p.label} →
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <SectionTitle>Under the hood</SectionTitle>
        <Card className="p-5 lg:p-6">
          <div className="grid gap-5 md:grid-cols-4 text-sm">
            {[
              ['Event pipeline', 'Every touch, whether entered live, from video or simulated, is one row in an event log. Box scores, rotation splits and profiles are aggregated from it.'],
              ['Ratings from data', 'Each player rating starts from a baseline and moves toward what the stats show, weighted by how many attempts back it up.'],
              ['Data-quality tests', 'CI checks that set scores reconcile with rallies, every event points at a real player and rally, and roll-ups lose nothing.'],
              ['Seeded demo season', `A rally simulator plays ${matches.length || 7} matches for a fictional roster, so every screen has data on the first visit.`],
            ].map(([title, body]) => (
              <div key={title}>
                <div className="font-bold">{title}</div>
                <p className="mt-1 text-[var(--color-muted)]">{body}</p>
              </div>
            ))}
          </div>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]">
            <Icon name="github" className="w-4 h-4" /> Read how it's built
          </a>
        </Card>

        <p className="mt-8 text-xs text-[var(--color-muted)]">
          Built by Rodel Beronilla. The roster is fictional and the match history is simulated.
        </p>
      </div>
    </div>
  );
}
