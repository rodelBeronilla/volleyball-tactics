import { SECTIONS, pathOf, REPO_URL } from '../../nav';
import { href } from '../../router';
import Icon from './Icon';

/** Desktop: fixed left sidebar listing every section and page. */
export function Sidebar({ section, page }) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)]">
      <a href={href('/')} className="flex items-center gap-2.5 px-5 pt-5 pb-4 font-extrabold tracking-tight text-[var(--color-ink)]">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
        Volleyball Tactics
      </a>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {SECTIONS.map(s => s.id === 'home' ? (
          <a
            key={s.id}
            href={href('/')}
            aria-current={section.id === 'home' ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold ${
              section.id === 'home' ? 'bg-[var(--color-surface-3)] text-[var(--color-ink)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Icon name={s.icon} />
            {s.label}
          </a>
        ) : (
          <div key={s.id} className="mt-5">
            <div className="flex items-center gap-3 px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              <Icon name={s.icon} className="w-4 h-4" />
              {s.label}
            </div>
            {s.pages.map(p => {
              const active = section.id === s.id && page?.id === p.id;
              return (
                <a
                  key={p.id}
                  href={href(pathOf(s.id, p.id))}
                  aria-current={active ? 'page' : undefined}
                  className={`block ml-5 pl-5 pr-3 py-1.5 rounded-lg text-sm border-l ${
                    active
                      ? 'border-[var(--color-accent)] bg-[var(--color-surface-3)] text-[var(--color-ink)] font-semibold'
                      : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {p.label}
                </a>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-[var(--color-line)] text-xs text-[var(--color-muted)] space-y-2">
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[var(--color-ink)]">
          <Icon name="github" className="w-4 h-4" /> Source on GitHub
        </a>
        <p>Fictional roster, simulated season.</p>
      </div>
    </aside>
  );
}

/** Mobile: bottom bar with one entry per section. */
export function BottomBar({ section }) {
  return (
    <nav
      className="lg:hidden flex shrink-0 border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main"
    >
      {SECTIONS.map(s => {
        const active = s.id === section.id;
        return (
          <a
            key={s.id}
            href={href(pathOf(s.id, s.pages[0]?.id))}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-semibold ${
              active ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'
            }`}
          >
            <Icon name={s.icon} className={`w-[22px] h-[22px] ${active ? 'text-[var(--color-accent)]' : ''}`} />
            {s.label}
          </a>
        );
      })}
    </nav>
  );
}
