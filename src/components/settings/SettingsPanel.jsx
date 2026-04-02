import { useRef } from 'react';
import { getStorageUsage, exportAllData, parseImportData, compactOldEntries } from '../../utils/storageManager';

export default function SettingsPanel({ state, dispatch }) {
  const fileRef = useRef(null);
  const usage = getStorageUsage();

  const handleExport = () => {
    const data = exportAllData(state);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
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
    const compacted = compactOldEntries(state.statEntries, state.matches, 10);
    dispatch({ type: 'SET_STAT_ENTRIES', entries: compacted });
  };

  const handleClearAll = () => {
    if (!window.confirm('Delete ALL data (players, lineups, matches, stats)? This cannot be undone.')) return;
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-surface)] overflow-y-auto">
      <div className="px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
        <h2 className="text-lg font-bold text-white">Settings</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Storage usage */}
        <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
          <div className="text-xs font-bold text-gray-300 mb-2">Storage Usage</div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usage.percent}%`,
                background: usage.percent > 80 ? '#ef4444' : usage.percent > 50 ? '#eab308' : '#22c55e',
              }}
            />
          </div>
          <div className="text-xs text-gray-400">
            {(usage.used / 1024).toFixed(0)} KB / {(usage.limit / 1024 / 1024).toFixed(0)} MB ({usage.percent}%)
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {state.statEntries.length} stat entries, {state.rallies.length} rallies, {state.matches.length} matches
          </div>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="w-full py-3 rounded-lg bg-[var(--color-surface-3)] text-white text-sm font-bold active:scale-[0.98] transition-transform"
        >
          Export All Data (JSON)
        </button>

        {/* Import */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-lg bg-[var(--color-surface-3)] text-white text-sm font-bold active:scale-[0.98] transition-transform"
        >
          Import Data from File
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

        {/* Compact */}
        {state.statEntries.length > 500 && (
          <button
            onClick={handleCompact}
            className="w-full py-3 rounded-lg bg-[var(--color-surface-3)] text-gray-300 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            Compact Old Data
          </button>
        )}

        {/* Clear */}
        <button
          onClick={handleClearAll}
          className="w-full py-3 rounded-lg bg-red-900/20 text-red-400 text-sm font-bold active:scale-[0.98] transition-transform"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}
