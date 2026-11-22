// Shared class strings for buttons and tables

export const buttonClass = {
  primary: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-ink)] text-sm font-bold hover:brightness-110 active:scale-[0.98]',
  secondary: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] text-sm font-semibold hover:border-[var(--color-muted)] active:scale-[0.98]',
  danger: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-900/25 text-red-300 text-sm font-semibold hover:bg-red-900/40',
};

// Tables: numbers right-aligned and tabular
export const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] whitespace-nowrap';
export const thNum = th.replace('text-left', 'text-right');
export const td = 'px-3 py-2.5 whitespace-nowrap';
export const tdNum = `${td} text-right tabular-nums`;
