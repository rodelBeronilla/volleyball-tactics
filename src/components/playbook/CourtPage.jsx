import { useCallback, useEffect, useMemo, useState } from 'react';
import Court from '../court/Court';
import PlayerStrategyCard from '../court/PlayerStrategyCard';
import RotationControls from '../controls/RotationControls';
import Page, { Tabs } from '../shell/Page';
import { analyzeRotation } from '../../utils/rotationAnalysis';
import { OFFENSE_5_1, DEFENSE_5_1 } from '../../data/responsibilities';
import { POSITIONS } from '../../data/positions';
import { getServeReceiveZones, getDefenseZones, ATTACK_INDICATORS, DEFENSE_SCENARIOS } from '../../data/coverageZones';
import { href } from '../../router';
import { useIsDesktop } from '../../hooks/useMediaQuery';

const VIEWS = [
  { id: 'offense', label: 'Offense' },
  { id: 'receive', label: 'Serve receive' },
  { id: 'defense', label: 'Defense' },
];

// Perimeter (2-0-4) base defense, by where the opponent attacks from
const DEFENSE_POS = {
  left: {
    // Attack from opponent zone 4 → our right side
    2: { x: 78, y: 4 },   // RF — blocking at right pin
    3: { x: 62, y: 4 },   // CF — closing to right pin
    4: { x: 22, y: 22 },  // LF — off net, tip/roll cover
    1: { x: 82, y: 55 },  // RB — right sideline, line dig
    5: { x: 12, y: 48 },  // LB — left side, cross dig
    6: { x: 45, y: 76 },  // CB — deep center, power angle
  },
  right: {
    // Attack from opponent zone 2 → our left side
    4: { x: 12, y: 4 },   // LF — blocking at left pin
    3: { x: 28, y: 4 },   // CF — closing to left pin
    2: { x: 68, y: 22 },  // RF — off net, tip/roll cover
    5: { x: 8, y: 55 },   // LB — left sideline, line dig
    1: { x: 78, y: 48 },  // RB — right side, cross dig
    6: { x: 45, y: 76 },  // CB — deep center, power angle
  },
  middle: {
    // Attack from zone 3 → center
    3: { x: 45, y: 4 },   // CF — blocking middle
    4: { x: 18, y: 4 },   // LF — closing / wing
    2: { x: 72, y: 4 },   // RF — closing / wing
    5: { x: 10, y: 58 },  // LB — left back
    1: { x: 80, y: 58 },  // RB — right back
    6: { x: 45, y: 78 },  // CB — deep center
  },
};

// Defense scenarios, named by where the opponent attacks from
const ATTACK_FROM = { left: 'Their outside (4)', right: 'Their right side (2)', middle: 'Their middle (3)' };

const PHASE_FOR_VIEW = { offense: 'attack', receive: 'receive', defense: 'defense' };

export default function CourtPage({ section, page, state, dispatch, activeLineup, currentSlots, placements, playerProfiles }) {
  const isDesktop = useIsDesktop();
  const [courtView, setCourtView] = useState('offense');
  const [defenseScenario, setDefenseScenario] = useState('left');

  const onSwipeLeft = useCallback(() => dispatch({ type: 'NEXT_ROTATION' }), [dispatch]);
  const onSwipeRight = useCallback(() => dispatch({ type: 'PREV_ROTATION' }), [dispatch]);
  const handleCloseCard = useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]);

  // The formation shown on court follows the view toggle
  useEffect(() => {
    const phase = PHASE_FOR_VIEW[courtView];
    if (phase !== state.courtPhase) dispatch({ type: 'SET_COURT_PHASE', phase });
  }, [courtView, state.courtPhase, dispatch]);

  // Defense moves players to the spots for the chosen attack direction
  const displayPlacements = useMemo(() => {
    if (courtView !== 'defense' || placements.length === 0) return placements;
    const positions = DEFENSE_POS[defenseScenario];
    return placements.map(p => {
      const pos = positions[p.rotationalPosition];
      if (!pos) return p;
      // A back-row setter stays near right-center, ready to sprint to target
      if (p.player?.position === 'setter' && [1, 5, 6].includes(p.rotationalPosition)) {
        return { ...p, x: 62, y: 42 };
      }
      return { ...p, x: pos.x, y: pos.y };
    });
  }, [courtView, defenseScenario, placements]);

  const coverageZones = useMemo(() => {
    if (displayPlacements.length === 0) return null;
    if (courtView === 'receive') return getServeReceiveZones(displayPlacements);
    if (courtView === 'defense') return getDefenseZones(displayPlacements, defenseScenario);
    return null;
  }, [courtView, defenseScenario, displayPlacements]);

  const rotationInfo = useMemo(
    () => (displayPlacements.length > 0 ? analyzeRotation(state.currentRotation, displayPlacements) : null),
    [state.currentRotation, displayPlacements],
  );

  const responsibilities = (courtView === 'offense' ? OFFENSE_5_1 : DEFENSE_5_1)[state.currentRotation] || {};

  const liberoSub = useMemo(() => {
    if (!activeLineup?.liberoId) return null;
    const libero = state.players.find(p => p.id === activeLineup.liberoId);
    const subFor = placements.find(p => p.isLiberoIn);
    if (!subFor || !libero) return null;
    // The player the libero replaced is whoever the rotation puts in that position
    const replacedId = currentSlots?.[subFor.rotationalPosition];
    return { libero, replacesPlayer: state.players.find(p => p.id === replacedId) || null, slot: subFor.rotationalPosition };
  }, [activeLineup, placements, currentSlots, state.players]);

  const controls = (
    <>
      <Tabs items={VIEWS} value={courtView} onChange={setCourtView} label="Phase" />
      {courtView === 'defense' && (
        <Tabs
          items={DEFENSE_SCENARIOS.map(s => ({ id: s.id, label: ATTACK_FROM[s.id] }))}
          value={defenseScenario}
          onChange={setDefenseScenario}
          label="Attack from"
        />
      )}
    </>
  );

  if (!activeLineup) {
    return (
      <Page section={section} page={page}>
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-8 text-center max-w-md">
          <p className="text-lg font-bold">No lineup yet</p>
          <p className="text-sm text-[var(--color-muted)] mt-1 mb-4">Create a lineup to see it on court.</p>
          <a href={href('/team/lineups')} className="inline-block px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-ink)] text-sm font-bold">
            Go to lineups
          </a>
        </div>
      </Page>
    );
  }

  const selected = state.selectedSlot != null;

  return (
    <Page section={section} page={page} controls={controls} scroll={false}>
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:border-t lg:border-[var(--color-line)]">
        {/* Court */}
        <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center p-1 lg:p-6">
          <Court
            placements={displayPlacements} dispatch={dispatch}
            onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}
            selectedSlot={state.selectedSlot}
            showRoutes={courtView === 'offense'}
            rotation={state.currentRotation}
            playerProfiles={playerProfiles}
            showCoverage={courtView !== 'offense'}
            coverageZones={coverageZones}
            attackIndicator={ATTACK_INDICATORS[defenseScenario] && courtView === 'defense' ? ATTACK_INDICATORS[defenseScenario] : null}
            courtPhase={state.courtPhase}
          />
        </div>

        {/* Rotation summary: side column on desktop, below the court on phones */}
        <aside className="shrink-0 lg:w-[380px] lg:border-l border-t lg:border-t-0 border-[var(--color-line)] bg-[var(--color-surface-2)] lg:bg-transparent flex flex-col min-h-0 max-h-[30vh] lg:max-h-none">
          <div className="hidden lg:block px-5 pt-5">
            <RotationControls currentRotation={state.currentRotation} dispatch={dispatch} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 lg:px-5 py-2 lg:py-4 space-y-3">
            {isDesktop && selected && (
              <PlayerStrategyCard inline selectedSlot={state.selectedSlot} rotation={state.currentRotation}
                placements={placements} onClose={handleCloseCard} />
            )}
            {rotationInfo && (
              <RotationSummary
                rotationInfo={rotationInfo}
                responsibilities={responsibilities}
                courtView={courtView}
                defenseScenario={defenseScenario}
                liberoSub={liberoSub}
                showHint={isDesktop && !selected}
              />
            )}
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <RotationControls currentRotation={state.currentRotation} dispatch={dispatch} />
      </div>

      {!isDesktop && selected && (
        <PlayerStrategyCard selectedSlot={state.selectedSlot} rotation={state.currentRotation}
          placements={placements} onClose={handleCloseCard} />
      )}
    </Page>
  );
}

function RotationSummary({ rotationInfo, responsibilities, courtView, defenseScenario, liberoSub, showHint }) {
  const row = (title, players) => (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)] font-bold mb-1">{title}</div>
      {players.map(p => {
        // A libero can't attack above the net, so it never inherits an attack duty
        const resp = p.roleLabel === 'Libero' && courtView === 'offense' ? 'Dig / cover hitters' : responsibilities[p.slot];
        return (
          <div key={p.slot} className="mb-1.5">
            <div className="text-sm font-semibold">{p.playerName}</div>
            <div className="text-xs text-[var(--color-muted)]">{resp || p.roleLabel}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <div className="font-bold">{rotationInfo.headline}</div>
        {showHint && <div className="text-xs text-[var(--color-muted)] mt-0.5">Tap a player on court for their full job in this rotation.</div>}
      </div>

      {liberoSub && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: POSITIONS.libero.color }}>L</span>
          <span className="text-xs text-orange-300">
            <span className="font-bold">{liberoSub.libero.name}</span> subs in for <span className="font-bold">{liberoSub.replacesPlayer?.name || 'MB'}</span> (pos {liberoSub.slot}, back row)
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {row('Front row', rotationInfo.frontRow)}
        {row('Back row', rotationInfo.backRow)}
      </div>

      {courtView === 'offense' && rotationInfo.attackOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-[var(--color-line)]">
          <span className="text-[11px] uppercase tracking-widest text-[var(--color-muted)] font-bold mr-1">Attacks</span>
          {rotationInfo.attackOptions.map(opt => (
            <span key={opt} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 text-xs border border-green-500/20">{opt}</span>
          ))}
        </div>
      )}
      {courtView === 'receive' && (
        <div className="pt-2 border-t border-[var(--color-line)] text-xs">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)] font-bold">Serve receive</div>
          <div className="text-[var(--color-muted)] mt-0.5">{rotationInfo.serveReceive}</div>
          <div className="text-amber-400/80 mt-0.5">Zones show which passer takes which area. Strongest passers get the biggest zones.</div>
        </div>
      )}
      {courtView === 'defense' && (
        <div className="pt-2 border-t border-[var(--color-line)] text-xs">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)] font-bold">
            {DEFENSE_SCENARIOS.find(s => s.id === defenseScenario)?.desc}
          </div>
          <div className="text-blue-300/80 mt-0.5">Zones show coverage responsibilities. Blockers seal, diggers read the angle.</div>
        </div>
      )}
    </>
  );
}
