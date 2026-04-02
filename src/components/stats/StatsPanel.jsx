import { useState } from 'react';
import LiveEntry from './LiveEntry';
import PlayByPlayEntry from './PlayByPlayEntry';
import VideoReviewEntry from './VideoReviewEntry';
import MatchForm from './MatchForm';
import MatchLog from './MatchLog';
import MatchDetail from './MatchDetail';
import PlayerStats from './PlayerStats';

const VIEWS = [
  { id: 'live', label: 'Live' },
  { id: 'pbp', label: 'PbP' },
  { id: 'video', label: 'Video' },
  { id: 'matches', label: 'Matches' },
  { id: 'players', label: 'Players' },
];

export default function StatsPanel({ state, dispatch, activeMatch }) {
  const [view, setView] = useState(activeMatch ? 'live' : 'matches');
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [detailMatchId, setDetailMatchId] = useState(null);

  const detailMatch = detailMatchId ? state.matches.find(m => m.id === detailMatchId) : null;

  const handleCreateMatch = (data) => {
    dispatch({ type: 'CREATE_MATCH', ...data });
    setShowMatchForm(false);
    setView('live');
  };

  const handleResumeMatch = (matchId) => {
    const match = state.matches.find(m => m.id === matchId);
    if (match && !match.completed) {
      dispatch({ type: 'SET_ACTIVE_MATCH', matchId });
      setView('live');
    } else {
      setDetailMatchId(matchId);
    }
  };

  // If viewing match detail, show that instead
  if (detailMatch) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)]">
        <MatchDetail
          match={detailMatch}
          statEntries={state.statEntries}
          players={state.players}
          onBack={() => setDetailMatchId(null)}
        />
      </div>
    );
  }

  const needsMatch = view === 'live' || view === 'pbp' || view === 'video';

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* View selector */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5">
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                v.id === view
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-3)] text-gray-400'
              }`}
            >
              {v.label}
              {v.id === 'live' && activeMatch && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              )}
            </button>
          ))}
        </div>
        {!needsMatch && (
          <button
            onClick={() => activeMatch ? setView('live') : setShowMatchForm(true)}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold active:scale-95 transition-transform shrink-0"
          >
            {activeMatch ? 'Resume' : '+ Match'}
          </button>
        )}
      </div>

      {/* Live entry */}
      {view === 'live' && (
        activeMatch ? (
          <LiveEntry
            match={activeMatch}
            players={state.players}
            lineups={state.lineups}
            statEntries={state.statEntries}
            dispatch={dispatch}
            currentRotation={state.currentRotation}
            activeSetNumber={state.activeSetNumber}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-4">
            <p className="text-lg mb-3">No active match</p>
            <button
              onClick={() => setShowMatchForm(true)}
              className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95"
            >
              Start New Match
            </button>
          </div>
        )
      )}

      {/* Play-by-Play entry */}
      {view === 'pbp' && (
        activeMatch ? (
          <PlayByPlayEntry
            match={activeMatch}
            players={state.players}
            lineups={state.lineups}
            rallies={state.rallies}
            dispatch={dispatch}
            currentRotation={state.currentRotation}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-4">
            <p className="text-lg mb-3">No active match</p>
            <p className="text-sm mb-3 text-center">Create a match first, then enter play-by-play data retroactively</p>
            <button
              onClick={() => setShowMatchForm(true)}
              className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95"
            >
              Start New Match
            </button>
          </div>
        )
      )}

      {/* Video review entry */}
      {view === 'video' && (
        activeMatch ? (
          <VideoReviewEntry
            match={activeMatch}
            players={state.players}
            lineups={state.lineups}
            dispatch={dispatch}
            currentRotation={state.currentRotation}
            activeSetNumber={state.activeSetNumber}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-4">
            <p className="text-lg mb-3">No active match</p>
            <p className="text-sm mb-3 text-center">Create a match, then enter stats while reviewing recorded video</p>
            <button
              onClick={() => setShowMatchForm(true)}
              className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95"
            >
              Start New Match
            </button>
          </div>
        )
      )}

      {/* Match log */}
      {view === 'matches' && (
        <MatchLog
          matches={state.matches}
          statEntries={state.statEntries}
          onSelect={handleResumeMatch}
          onDelete={(id) => dispatch({ type: 'DELETE_MATCH', matchId: id })}
        />
      )}

      {/* Player stats */}
      {view === 'players' && (
        <PlayerStats
          players={state.players}
          statEntries={state.statEntries}
        />
      )}

      {/* New match form */}
      {showMatchForm && (
        <MatchForm
          lineups={state.lineups}
          activeLineupId={state.activeLineupId}
          onSave={handleCreateMatch}
          onClose={() => setShowMatchForm(false)}
        />
      )}
    </div>
  );
}
