import { useState } from 'react';
import LiveEntry from './LiveEntry';
import PlayByPlayEntry from './PlayByPlayEntry';
import VideoReviewEntry from './VideoReviewEntry';
import MatchForm from './MatchForm';
import MatchLog from './MatchLog';
import MatchDetail from './MatchDetail';
import PlayerStats from './PlayerStats';
import AnalysisPanel from '../analysis/AnalysisPanel';

const VIEWS = [
  { id: 'record', label: 'Record' },
  { id: 'matches', label: 'Matches' },
  { id: 'players', label: 'Players' },
  { id: 'analysis', label: 'Analysis' },
];

const RECORD_MODES = [
  { id: 'live', label: 'Live' },
  { id: 'pbp', label: 'Play-by-Play' },
  { id: 'video', label: 'Video Review' },
];

export default function StatsPanel({ state, dispatch, activeMatch, activeLineup, playerProfiles }) {
  const [view, setView] = useState(activeMatch ? 'record' : 'matches');
  const [recordMode, setRecordMode] = useState('live');
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [detailMatchId, setDetailMatchId] = useState(null);

  const detailMatch = detailMatchId ? state.matches.find(m => m.id === detailMatchId) : null;

  const handleCreateMatch = (data) => {
    dispatch({ type: 'CREATE_MATCH', ...data });
    setShowMatchForm(false);
    setView('record');
  };

  const handleResumeMatch = (matchId) => {
    const match = state.matches.find(m => m.id === matchId);
    if (match && !match.completed) {
      dispatch({ type: 'SET_ACTIVE_MATCH', matchId });
      setView('record');
    } else {
      setDetailMatchId(matchId);
    }
  };

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

  const needsMatch = view === 'record';

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Main view tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                v.id === view
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-3)] text-gray-400'
              }`}
            >
              {v.label}
              {v.id === 'record' && activeMatch && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              )}
            </button>
          ))}
        </div>
        {!needsMatch && view !== 'analysis' && (
          <button
            onClick={() => activeMatch ? setView('record') : setShowMatchForm(true)}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold active:scale-95 shrink-0"
          >
            {activeMatch ? 'Resume' : '+ Match'}
          </button>
        )}
      </div>

      {/* Record mode selector */}
      {view === 'record' && activeMatch && (
        <div className="flex gap-1 px-2 py-1 bg-[var(--color-surface)] border-b border-white/5 shrink-0">
          {RECORD_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setRecordMode(m.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                m.id === recordMode ? 'bg-white/10 text-white' : 'text-gray-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Record view */}
      {view === 'record' && (
        activeMatch ? (
          <>
            {recordMode === 'live' && (
              <LiveEntry match={activeMatch} players={state.players} lineups={state.lineups} statEntries={state.statEntries} dispatch={dispatch} currentRotation={state.currentRotation} activeSetNumber={state.activeSetNumber} />
            )}
            {recordMode === 'pbp' && (
              <PlayByPlayEntry match={activeMatch} players={state.players} lineups={state.lineups} rallies={state.rallies} dispatch={dispatch} currentRotation={state.currentRotation} />
            )}
            {recordMode === 'video' && (
              <VideoReviewEntry match={activeMatch} players={state.players} lineups={state.lineups} dispatch={dispatch} currentRotation={state.currentRotation} activeSetNumber={state.activeSetNumber} />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-6">
            <p className="text-lg mb-2 text-white font-bold">Record Stats</p>
            <p className="text-sm mb-4 text-center">Start a match to record stats live, enter play-by-play retroactively, or review game video.</p>
            <button
              onClick={() => setShowMatchForm(true)}
              className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95"
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

      {/* Player profiles */}
      {view === 'players' && (
        <PlayerStats
          players={state.players}
          statEntries={state.statEntries}
        />
      )}

      {/* Analysis */}
      {view === 'analysis' && (
        <AnalysisPanel
          state={state}
          dispatch={dispatch}
          activeLineup={activeLineup}
          playerProfiles={playerProfiles}
        />
      )}

      {/* Match form modal */}
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
