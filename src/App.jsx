import { useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { useServerSync } from './hooks/useServerSync';
import { useRoute, navigate } from './router';
import { resolveRoute, pathOf } from './nav';
import { Sidebar, BottomBar } from './components/shell/Navigation';
import Page, { Tabs } from './components/shell/Page';
import HomePage from './components/home/HomePage';
import CourtPage from './components/playbook/CourtPage';
import ToolFrame from './components/playbook/ToolFrame';
import { TOOLS } from './components/playbook/tools';
import GameDayPanel from './components/gameday/GameDayPanel';
import RecordPage from './components/game/RecordPage';
import SeasonPage from './components/analytics/SeasonPage';
import PlayerStats from './components/stats/PlayerStats';
import RotationAnalytics from './components/analytics/RotationAnalytics';
import CompositionPanel from './components/lineup/CompositionPanel';
import LineupOptimizer from './components/analytics/LineupOptimizer';
import SynergyView from './components/analytics/SynergyView';
import DecisionSupport from './components/analytics/DecisionSupport';
import RosterPanel from './components/roster/RosterPanel';
import LineupPanel from './components/lineup/LineupPanel';
import DataSettings from './components/team/DataSettings';
import { SectionTitle } from './components/shell/ui';
import { buttonClass } from './components/shell/styles';

export default function App() {
  const app = useAppState();
  const { state, dispatch, activeLineup, playerProfiles } = app;
  const sync = useServerSync(state);

  const route = useRoute();
  const { section, page, canonical } = resolveRoute(route);
  const [, , param] = route;

  // Unknown or partial routes (#/analytics) settle on a real page
  const routePath = '/' + route.slice(0, 2).join('/');
  useEffect(() => {
    if (routePath !== canonical) navigate(canonical + (param && routePath === canonical ? `/${param}` : ''), { replace: true });
  }, [routePath, canonical, param]);

  const pageProps = { section, page, state, dispatch };

  return (
    <div className="flex-1 flex min-w-0">
      <Sidebar section={section} page={page} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 flex flex-col min-h-0">
          <Route key={canonical} {...pageProps} app={app} sync={sync} param={param} activeLineup={activeLineup} playerProfiles={playerProfiles} />
        </main>
        <BottomBar section={section} />
      </div>
    </div>
  );
}

function Route({ section, page, state, dispatch, app, sync, param, activeLineup, playerProfiles }) {
  const pageProps = { section, page, state, dispatch };
  const toolTab = tab => navigate(`${pathOf(section.id, page.id)}/${tab}`);

  switch (section.id) {
    case 'playbook': {
      if (page.id === 'court') {
        return <CourtPage {...pageProps} activeLineup={activeLineup} currentSlots={app.currentSlots} placements={app.placements} playerProfiles={playerProfiles} />;
      }
      const tool = TOOLS[page.id];
      const tab = tool.tabs.some(t => t.id === param) ? param : tool.tabs[0].id;
      return (
        <Page {...pageProps} scroll={false} controls={<Tabs items={tool.tabs} value={tab} onChange={toolTab} label={tool.title} />}>
          <ToolFrame tool={page.id} tab={tab} onTabChange={toolTab} />
        </Page>
      );
    }

    case 'game':
      if (page.id === 'record') return <RecordPage {...pageProps} activeMatch={app.activeMatch} />;
      return (
        <Page
          {...pageProps}
          actions={!state.activeNightPlanId && (
            <button
              className={buttonClass.primary}
              onClick={() => dispatch({ type: 'CREATE_NIGHT_PLAN', name: `Game Night ${state.nightPlans.length + 1}`, date: new Date().toISOString().slice(0, 10) })}
            >
              + New plan
            </button>
          )}
        >
          <GameDayPanel state={state} dispatch={dispatch} />
        </Page>
      );

    case 'analytics':
      switch (page.id) {
        case 'season':
          return <SeasonPage {...pageProps} matchId={param} />;
        case 'players': {
          const selectedId = state.players.some(p => p.id === param) ? param : state.players[0]?.id;
          return (
            <Page {...pageProps}>
              <PlayerStats
                players={state.players}
                statEntries={state.statEntries}
                matches={state.matches}
                playerProfiles={playerProfiles}
                selectedId={selectedId}
                onSelect={id => navigate(`/analytics/players/${id}`, { replace: true })}
              />
            </Page>
          );
        }
        case 'rotations':
          return <Page {...pageProps}><RotationAnalytics statEntries={state.statEntries} /></Page>;
        case 'lineups':
          return (
            <Page {...pageProps} desc={`${page.desc} Current lineup: ${activeLineup?.name ?? 'none'}.`}>
              <div className="grid gap-8 xl:grid-cols-2 items-start">
                <div>
                  <SectionTitle>Composition</SectionTitle>
                  <CompositionPanel players={state.players} activeLineup={activeLineup} statEntries={state.statEntries} />
                </div>
                <div>
                  <SectionTitle>Optimizer</SectionTitle>
                  <LineupOptimizer players={state.players} playerProfiles={playerProfiles} activeLineup={activeLineup} />
                </div>
              </div>
            </Page>
          );
        case 'pairings':
          return <Page {...pageProps}><div className="max-w-3xl"><SynergyView statEntries={state.statEntries} players={state.players} activeLineup={activeLineup} /></div></Page>;
        default:
          return (
            <Page {...pageProps}>
              <div className="max-w-3xl">
                <DecisionSupport
                  players={state.players}
                  playerProfiles={playerProfiles}
                  activeLineup={activeLineup}
                  statEntries={state.statEntries}
                  experimentNotes={state.experimentNotes}
                  dispatch={dispatch}
                />
              </div>
            </Page>
          );
      }

    case 'team':
      if (page.id === 'roster') return <Page {...pageProps}><RosterPanel players={state.players} dispatch={dispatch} activeLineup={activeLineup} statEntries={state.statEntries} /></Page>;
      if (page.id === 'lineups') return <Page {...pageProps}><LineupPanel lineups={state.lineups} activeLineupId={state.activeLineupId} players={state.players} dispatch={dispatch} /></Page>;
      return <Page {...pageProps}><DataSettings state={state} dispatch={dispatch} sync={sync} /></Page>;

    default:
      return <HomePage state={state} />;
  }
}
