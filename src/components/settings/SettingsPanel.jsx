import { useRef, useState } from 'react';
import { getStorageUsage, exportAllData, parseImportData, compactOldEntries } from '../../utils/storageManager';
import { clearAll } from '../../utils/storage';
import TeamPanel from '../team/TeamPanel';

export default function SettingsPanel({ state, dispatch }) {
  const fileRef = useRef(null);
  const [subView, setSubView] = useState('settings'); // 'settings' | 'team'
  const usage = getStorageUsage();
  const activeLineup = state.lineups.find(l => l.id === state.activeLineupId) || null;

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

  const handleResetDemo = () => {
    if (!window.confirm('Replace everything with the demo roster and simulated season? Your current data will be lost.')) return;
    clearAll();
    window.location.reload();
  };

  const handleClearAll = () => {
    if (!window.confirm('Delete ALL data (players, lineups, matches, stats)? This cannot be undone.')) return;
    dispatch({
      type: 'IMPORT_DATA',
      data: { players: [], lineups: [], matches: [], statEntries: [], rallies: [], nightPlans: [], practicePlans: [] },
    });
  };

  if (subView === 'team') {
    return (
      <div className="flex-1 flex flex-col bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
          <button onClick={() => setSubView('settings')} className="text-gray-400 text-sm">← Back</button>
          <h2 className="text-lg font-bold text-white">Team</h2>
        </div>
        <TeamPanel state={state} dispatch={dispatch} activeLineup={activeLineup} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-surface)] overflow-y-auto">
      <div className="px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
        <h2 className="text-lg font-bold text-white">More</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* About */}
        <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 text-xs text-gray-400 space-y-1.5">
          <div className="text-sm font-bold text-white">Volleyball Tactics</div>
          <p>
            Rotation playbook, stat tracking and lineup analytics for a 6v6 team.
            The roster is fictional and the match history is a simulated demo season.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <a href={import.meta.env.BASE_URL} className="text-[var(--color-accent)] font-semibold">
              ← All tools
            </a>
            <a href={`${import.meta.env.BASE_URL}setter-signals/`} className="text-[var(--color-accent)] font-semibold">
              Setter Signals →
            </a>
            <a href={`${import.meta.env.BASE_URL}serve-receive/`} className="text-[var(--color-accent)] font-semibold">
              Serve Receive →
            </a>
          </div>
          <a
            href="https://github.com/rodelBeronilla/volleyball-tactics"
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[var(--color-accent)] font-semibold"
          >
            Source on GitHub →
          </a>
        </div>

        {/* Team management */}
        <button
          onClick={() => setSubView('team')}
          className="w-full py-3 rounded-lg bg-[var(--color-surface-2)] text-white text-sm font-bold active:scale-[0.98] transition-transform border border-white/5 flex items-center justify-between px-4"
        >
          <span>Team — Roster & Lineups</span>
          <span className="text-gray-500">→</span>
        </button>

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

        {/* Reset to demo */}
        <button
          onClick={handleResetDemo}
          className="w-full py-3 rounded-lg bg-[var(--color-surface-3)] text-gray-300 text-sm font-medium active:scale-[0.98] transition-transform"
        >
          Reset to Demo Data
        </button>

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
