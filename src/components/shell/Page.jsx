import { pathOf } from '../../nav';
import { href } from '../../router';

/**
 * Segmented control used for in-page views (Offense / Receive / Defense, tool tabs, …).
 * `items`: [{ id, label }]
 */
export function Tabs({ items, value, onChange, label }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-line)] w-max max-w-full overflow-x-auto" role="tablist" aria-label={label}>
      {items.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === value}
          onClick={() => onChange(t.id)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            t.id === value ? 'bg-[var(--color-surface-4)] text-[var(--color-ink)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Standard page frame: section tabs (mobile), title and description, optional
 * in-page controls and actions, then the body.
 *
 * `scroll`: the body scrolls inside the page (default). Pass false for pages that
 * manage their own height, like the embedded tools and the court.
 */
export default function Page({ section, page, title, desc, controls, actions, scroll = true, wide = false, children }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Mobile: the section's pages as tabs (desktop has them in the sidebar) */}
      {section.pages.length > 1 && (
        <nav className="lg:hidden flex gap-1 px-3 pt-2 overflow-x-auto shrink-0 border-b border-[var(--color-line)]" aria-label={section.label}>
          {section.pages.map(p => (
            <a
              key={p.id}
              href={href(pathOf(section.id, p.id))}
              aria-current={p.id === page?.id ? 'page' : undefined}
              className={`px-3 pb-2 pt-1 text-sm font-semibold whitespace-nowrap border-b-2 ${
                p.id === page?.id ? 'border-[var(--color-accent)] text-[var(--color-ink)]' : 'border-transparent text-[var(--color-muted)]'
              }`}
            >
              {p.label}
            </a>
          ))}
        </nav>
      )}

      <header className={`shrink-0 px-4 lg:px-8 pt-3 lg:pt-7 pb-3 lg:pb-4 ${controls || actions || title ? '' : 'hidden lg:block'}`}>
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {/* Phones show the section tabs instead of a title, except on detail pages with their own title */}
            <h1 className={`${title ? 'text-lg' : 'hidden'} lg:block lg:text-2xl font-extrabold tracking-tight`}>{title ?? page?.title}</h1>
            <p className="hidden lg:block mt-1 text-sm text-[var(--color-muted)] max-w-3xl">{desc ?? page?.desc}</p>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
        {controls && <div className={`${title ? 'mt-3' : 'mt-0'} lg:mt-4 flex flex-wrap items-center gap-2`}>{controls}</div>}
      </header>

      <div className={`flex-1 min-h-0 ${scroll ? 'overflow-y-auto' : 'flex flex-col'}`}>
        {scroll ? (
          <div className={`px-4 lg:px-8 pb-10 ${controls || actions || title ? '' : 'pt-3 lg:pt-0'} ${wide ? '' : 'max-w-6xl'}`}>{children}</div>
        ) : children}
      </div>
    </div>
  );
}
