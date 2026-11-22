// Small shared building blocks so every page uses the same surfaces and type scale

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3 mt-8 first:mt-0">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)]">{children}</h2>
      {aside && <div className="text-xs text-[var(--color-muted)]">{aside}</div>}
    </div>
  );
}

export function StatTile({ label, value, sub, tone }) {
  const color = tone === 'good' ? 'text-green-400' : tone === 'bad' ? 'text-red-400' : 'text-[var(--color-ink)]';
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--color-muted)]">{sub}</div>}
    </Card>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-6 py-14 text-center">
      <p className="font-bold">{title}</p>
      {children && <p className="mt-1 text-sm text-[var(--color-muted)]">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
