import { useRef, useState } from 'react';
import { getStorageUsage, exportAllData, parseImportData, compactOldEntries } from '../../utils/storageManager';
import { clearAll } from '../../utils/storage';
import { summarizeSync } from '../../utils/sync';
import { Card, SectionTitle } from '../shell/ui';
import { buttonClass } from '../shell/styles';

const inputClass = 'w-full rounded-lg bg-white/5 border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]';

/** Team → Data: what's stored in this browser, the shared database, and how to move or reset data. */
export default function DataSettings({ state, dispatch, sync }) {
  const fileRef = useRef(null);
  const usage = getStorageUsage();

  const handleExport = () => {
    const json = JSON.stringify(exportAllData(state), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `volleyball-tactics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseImportData(reader.result);
      if (!parsed) {
        window.alert('Invalid file format. Expected a Volleyball Tactics export file.');
        return;
      }
      if (!window.confirm(`Import ${parsed.players.length} players, ${parsed.lineups.length} lineups, ${parsed.matches.length} matches, and ${parsed.statEntries.length} stat entries? This will replace all current data.`)) return;
      dispatch({ type: 'IMPORT_DATA', data: parsed });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCompact = () => {
    if (!window.confirm('Compact old match data? This reduces storage but is irreversible for individual stat entries in old matches.')) return;
    dispatch({ type: 'SET_STAT_ENTRIES', entries: compactOldEntries(state.statEntries, state.matches, 10) });
  };

  const handleResetDemo = () => {
    if (!window.confirm('Replace everything with the demo roster and simulated season? Your current data will be lost.')) return;
    clearAll();
    window.location.reload();
  };

  const handleClearAll = () => {
    if (!window.confirm('Delete ALL data (players, lineups, matches, stats)? This cannot be undone.')) return;
    dispatch({
      type: 'IMPORT_DATA',
      data: { players: [], lineups: [], matches: [], statEntries: [], rallies: [], nightPlans: [] },
    });
  };

  return (
    <div className="max-w-3xl">
      <Card className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-bold">Stored in this browser</div>
          <div className="text-sm text-[var(--color-muted)] tabular-nums">
            {(usage.used / 1024).toFixed(0)} KB of {(usage.limit / 1024 / 1024).toFixed(0)} MB
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-3">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${usage.percent}%`, background: usage.percent > 80 ? '#ef4444' : usage.percent > 50 ? '#eab308' : '#22c55e' }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          {[
            ['Players', state.players.length],
            ['Matches', state.matches.length],
            ['Rallies', state.rallies.length],
            ['Stat events', state.statEntries.length],
          ].map(([label, n]) => (
            <div key={label}>
              <div className="text-xs text-[var(--color-muted)]">{label}</div>
              <div className="font-bold tabular-nums">{n.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>

      {sync && <SharedDatabase sync={sync} />}

      <SectionTitle>Move your data</SectionTitle>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleExport} className={buttonClass.secondary}>Export all data (JSON)</button>
        <button onClick={() => fileRef.current?.click()} className={buttonClass.secondary}>Import from file</button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        {state.statEntries.length > 500 && (
          <button onClick={handleCompact} className={buttonClass.secondary} title="Roll matches older than the last 10 up into summary rows">
            Compact old matches
          </button>
        )}
      </div>

      <SectionTitle>Start over</SectionTitle>
      <p className="text-sm text-[var(--color-muted)] mb-3">
        The app opens on a fictional roster and a simulated season. Reset to get that back, or clear everything to start your own team.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleResetDemo} className={buttonClass.secondary}>Reset to demo data</button>
        <button onClick={handleClearAll} className={buttonClass.danger}>Clear all data</button>
      </div>
    </div>
  );
}

const STATUS_COLOR = { ok: '#22c55e', syncing: '#eab308', error: '#ef4444', idle: 'rgba(255,255,255,0.3)' };

/** Settings and status for pushing this browser's data to the team's server. */
function SharedDatabase({ sync }) {
  const { settings, updateSettings, status, syncNow } = sync;
  const [draft, setDraft] = useState(settings);
  const dirty = draft.url !== settings.url || draft.token !== settings.token || draft.enabled !== settings.enabled;

  const saveDraft = () => updateSettings({ ...draft, url: draft.url.trim() });
  const lastSync = status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'never';

  return (
    <>
      <SectionTitle>Shared database</SectionTitle>
      <p className="text-sm text-[var(--color-muted)] mb-3">
        Send everything recorded here to your team&apos;s server, so the whole staff, the warehouse and the dashboards
        work from the same data. Changes are pushed a few seconds after you make them.
      </p>
      <Card className="p-5 space-y-3">
        <label className="block text-sm">
          <span className="text-xs text-[var(--color-muted)]">Server URL</span>
          <input
            className={inputClass}
            type="url"
            placeholder="https://vt-api.example.com"
            value={draft.url}
            onChange={e => setDraft({ ...draft, url: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-[var(--color-muted)]">Sync token</span>
          <input
            className={inputClass}
            type="password"
            placeholder="the SYNC_TOKEN configured on the server"
            value={draft.token}
            onChange={e => setDraft({ ...draft, token: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} />
          Sync automatically when data changes
        </label>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button onClick={saveDraft} className={buttonClass.primary} disabled={!dirty}>Save</button>
          <button
            onClick={syncNow}
            className={buttonClass.secondary}
            disabled={status.state === 'syncing' || !settings.url || !settings.token || dirty}
            title={dirty ? 'Save your changes first' : 'Push everything now'}
          >
            {status.state === 'syncing' ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        <div className="flex items-start gap-2 text-sm pt-1" aria-live="polite">
          <span className="mt-1.5 inline-block w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[status.state] }} />
          <div>
            <div>Last sync: <span className="tabular-nums">{lastSync}</span></div>
            {status.error && <div className="text-[#ef4444]">{status.error}</div>}
            {!status.error && status.lastResult && (
              <div className="text-[var(--color-muted)]">{summarizeSync(status.lastResult)}</div>
            )}
            {!status.error && status.lastResult?.rejected?.length > 0 && (
              <ul className="text-xs text-[var(--color-muted)] mt-1 list-disc pl-4">
                {status.lastResult.rejected.slice(0, 5).map(r => (
                  <li key={`${r.table}-${r.id}`}>{r.table} {r.id}: {r.reason}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
