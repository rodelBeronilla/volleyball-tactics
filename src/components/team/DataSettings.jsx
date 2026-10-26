import { useRef } from 'react';
import { getStorageUsage, exportAllData, parseImportData, compactOldEntries } from '../../utils/storageManager';
import { clearAll } from '../../utils/storage';
import { Card, SectionTitle } from '../shell/ui';
import { buttonClass } from '../shell/styles';

/** Team → Data: what's stored in this browser and how to move or reset it. */
export default function DataSettings({ state, dispatch }) {
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
