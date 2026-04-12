import { useState, useCallback } from 'react';
import RallyLibrary from './RallyLibrary';
import RallyBuilder from './RallyBuilder';
import RallyPlayback from './RallyPlayback';

/**
 * Main container for the Film Review feature.
 * Two primary views: RallyLibrary (browse) and RallyBuilder (create/edit).
 * When a rally is selected from the library, opens RallyPlayback.
 */
export default function FilmReviewPanel({ state, dispatch, placements, playerProfiles }) {
  // 'library' | 'builder' | 'playback'
  const [view, setView] = useState('library');
  const [selectedRally, setSelectedRally] = useState(null);
  const [editingRally, setEditingRally] = useState(null);

  const handleSelectRally = useCallback((rally) => {
    setSelectedRally(rally);
    setView('playback');
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingRally(null);
    setView('builder');
  }, []);

  const handleAddFilmData = useCallback((rally) => {
    setEditingRally(rally);
    setView('builder');
  }, []);

  const handleBuilderSave = useCallback(() => {
    setEditingRally(null);
    setView('library');
  }, []);

  const handleBuilderCancel = useCallback(() => {
    setEditingRally(null);
    setView('library');
  }, []);

  const handlePlaybackClose = useCallback(() => {
    setSelectedRally(null);
    setView('library');
  }, []);

  // Playback view
  if (view === 'playback' && selectedRally) {
    return (
      <RallyPlayback
        rally={selectedRally}
        players={state.players}
        onClose={handlePlaybackClose}
        dispatch={dispatch}
      />
    );
  }

  // Builder view
  if (view === 'builder') {
    return (
      <RallyBuilder
        rally={editingRally}
        players={state.players}
        matches={state.matches}
        rotation={state.currentRotation || 1}
        dispatch={dispatch}
        onSave={handleBuilderSave}
        onCancel={handleBuilderCancel}
      />
    );
  }

  // Library view (default)
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* View toggle header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5">
        <h2 className="text-lg font-bold text-white">Film Review</h2>
        <div className="flex gap-1 bg-[var(--color-surface-3)] rounded-lg p-0.5">
          <button
            onClick={() => setView('library')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              view === 'library'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Library
          </button>
          <button
            onClick={handleCreateNew}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              view === 'builder'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            + Build
          </button>
        </div>
      </div>

      {/* Library content */}
      <div className="flex-1 overflow-hidden px-4 py-3">
        <RallyLibrary
          rallies={state.rallies}
          matches={state.matches}
          players={state.players}
          onSelectRally={handleSelectRally}
          onCreateNew={handleCreateNew}
          onAddFilmData={handleAddFilmData}
        />
      </div>
    </div>
  );
}
