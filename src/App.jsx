import { useCallback, useMemo, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import Court from './components/court/Court';
import PlayerStrategyCard from './components/court/PlayerStrategyCard';
import RotationControls from './components/controls/RotationControls';
import BottomNav from './components/controls/BottomNav';
import StatsPanel from './components/stats/StatsPanel';
import TeamPanel from './components/team/TeamPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import GameDayPanel from './components/gameday/GameDayPanel';
import PracticePanel from './components/practice/PracticePanel';
import FilmReviewPanel from './components/film/FilmReviewPanel';
import { analyzeRotation } from './utils/rotationAnalysis';
import { OFFENSE_5_1, DEFENSE_5_1 } from './data/responsibilities';
import { POSITIONS } from './data/positions';

export default function App() {
  const { state, dispatch, activeLineup, activeMatch, placements, playerProfiles } = useAppState();
  const [courtView, setCourtView] = useState('offense'); // 'offense' | 'defense'

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);
  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

  // Sync court phase from the simple offense/defense toggle
  const courtPhaseForView = courtView === 'offense' ? 'attack' : 'defense';
  useMemo(() => {
    if (courtPhaseForView !== state.courtPhase) {
      dispatch({ type: 'SET_COURT_PHASE', phase: courtPhaseForView });
    }
  }, [courtPhaseForView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotation analysis for the summary panel
  const rotationInfo = useMemo(
    () => placements.length > 0 ? analyzeRotation(state.currentRotation, placements) : null,
    [state.currentRotation, placements]
  );

  // Get responsibilities for current rotation
  const responsibilities = useMemo(() => {
    const data = courtView === 'offense' ? OFFENSE_5_1 : DEFENSE_5_1;
    return data[state.currentRotation] || {};
  }, [courtView, state.currentRotation]);

  // Libero sub info
  const liberoSub = useMemo(() => {
    if (!activeLineup?.liberoId) return null;
    const libero = state.players.find(p => p.id === activeLineup.liberoId);
    const subFor = placements.find(p => p.isLiberoIn);
    if (!subFor || !libero) return null;
    // Find who the libero replaced (the original middle in that slot)
    const originalId = activeLineup.slots
      ? Object.entries(activeLineup.slots).find(([, pid]) => {
          const player = state.players.find(pl => pl.id === pid);
          return player?.position === 'middle';
        })
      : null;
    const originalPlayer = originalId ? state.players.find(p => p.id === originalId[1]) : null;
    return {
      libero,
      replacesPlayer: originalPlayer,
      slot: subFor.rotationalPosition,
    };
  }, [activeLineup, placements, state.players]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* ── Court Tab (simplified) ── */}
        {state.activeTab === 'court' && (
          <>
            {/* Offense / Defense toggle + rotation label */}
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
              <div className="flex bg-[var(--color-surface)] rounded-lg p-0.5">
                <button
                  onClick={() => setCourtView('offense')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                    courtView === 'offense'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400'
                  }`}
                >Offense</button>
                <button
                  onClick={() => setCourtView('defense')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                    courtView === 'defense'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400'
                  }`}
                >Defense</button>
              </div>
              {rotationInfo && (
                <span className="text-xs text-gray-400 ml-2 truncate">{rotationInfo.headline}</span>
              )}
            </div>

            {/* Court */}
            <div className="flex-1 flex items-center justify-center p-1 min-h-0 bg-[var(--color-surface)]">
              {activeLineup ? (
                <Court
                  placements={placements} dispatch={dispatch}
                  onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}
                  selectedSlot={state.selectedSlot}
                  showRoutes={courtView === 'offense'}
                  rotation={state.currentRotation}
                  playerProfiles={playerProfiles}
                  showCoverage={courtView === 'defense'}
                  courtPhase={state.courtPhase}
                />
              ) : (
                <div className="text-gray-500 text-center px-6">
                  <p className="text-lg mb-2 text-white font-bold">Set Up Your Team</p>
                  <p className="text-sm mb-4">Create a lineup to see the playbook.</p>
                  <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'more' })}
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold active:scale-95">
                    Go to Team
                  </button>
                </div>
              )}
            </div>

            {/* Strategy summary below court */}
            {activeLineup && rotationInfo && (
              <div className="px-3 py-2 bg-[var(--color-surface-2)] border-t border-white/5 shrink-0 overflow-y-auto" style={{ maxHeight: '30vh' }}>
                {/* Libero sub callout */}
                {liberoSub && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: POSITIONS.libero.color }}>L</span>
                    <span className="text-xs text-orange-300">
                      <span className="font-bold">{liberoSub.libero.name}</span> subs in for <span className="font-bold">{liberoSub.replacesPlayer?.name || 'MB'}</span> (pos {liberoSub.slot}, back row)
                    </span>
                  </div>
                )}

                {/* Front & back row with responsibilities */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Front Row</div>
                    {rotationInfo.frontRow.map(p => {
                      const resp = responsibilities[p.slot];
                      return (
                        <div key={p.slot} className="mb-1.5">
                          <div className="text-xs text-white font-semibold">{p.playerName}</div>
                          <div className="text-[11px] text-gray-400">{resp || p.roleLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Back Row</div>
                    {rotationInfo.backRow.map(p => {
                      const resp = responsibilities[p.slot];
                      return (
                        <div key={p.slot} className="mb-1.5">
                          <div className="text-xs text-white font-semibold">{p.playerName}</div>
                          <div className="text-[11px] text-gray-400">{resp || p.roleLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attack / block options */}
                {rotationInfo.attackOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mr-1 self-center">
                      {courtView === 'offense' ? 'Attacks' : 'Watch for'}
                    </span>
                    {rotationInfo.attackOptions.map((opt, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300 text-[11px]">{opt}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <RotationControls currentRotation={state.currentRotation} dispatch={dispatch} />

            {state.selectedSlot != null && (
              <PlayerStrategyCard selectedSlot={state.selectedSlot} rotation={state.currentRotation}
                placements={placements} onClose={handleCloseCard} />
            )}
          </>
        )}

        {state.activeTab === 'gameday' && (
          <GameDayPanel state={state} dispatch={dispatch} placements={placements} playerProfiles={playerProfiles} />
        )}
        {state.activeTab === 'stats' && (
          <StatsPanel state={state} dispatch={dispatch} activeMatch={activeMatch}
            activeLineup={activeLineup} playerProfiles={playerProfiles} placements={placements} />
        )}
        {state.activeTab === 'practice' && (
          <PracticePanel state={state} dispatch={dispatch} playerProfiles={playerProfiles} />
        )}
        {state.activeTab === 'film' && (
          <FilmReviewPanel state={state} dispatch={dispatch} placements={placements} playerProfiles={playerProfiles} />
        )}
        {state.activeTab === 'team' && (
          <TeamPanel state={state} dispatch={dispatch} activeLineup={activeLineup} />
        )}
        {state.activeTab === 'more' && (
          <SettingsPanel state={state} dispatch={dispatch} />
        )}
      </div>

      <BottomNav activeTab={state.activeTab} dispatch={dispatch} />
    </div>
  );
}
