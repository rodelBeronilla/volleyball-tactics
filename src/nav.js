/**
 * Site map. The sidebar (desktop), bottom bar and section tabs (mobile), page
 * headers and the home page all read from this one list.
 */
export const SECTIONS = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    pages: [],
  },
  {
    id: 'playbook',
    label: 'Playbook',
    icon: 'court',
    blurb: 'Where everyone stands and what they do, rotation by rotation.',
    pages: [
      { id: 'court', label: 'Court', title: 'Rotation playbook', desc: 'Your lineup on court in all six rotations: offense, serve receive and defense. Tap a player for their job.' },
      { id: 'serve-receive', label: 'Serve Receive', title: 'Serve receive', desc: 'Where the six stand at the service hit, who passes, and where everyone goes once the ball is passed.' },
      { id: 'setter-signals', label: 'Setter Signals', title: 'Setter signals & set map', desc: 'What to set to whom in this rotation, off this pass: hand signals, tempos and a card for every set.' },
    ],
  },
  {
    id: 'game',
    label: 'Game',
    icon: 'whistle',
    blurb: 'Plan the night and record every rally as it happens.',
    pages: [
      { id: 'plan', label: 'Game Plan', title: 'Game plan', desc: 'Lineup, serving order and substitution system for each set of the night, with live scoring.' },
      { id: 'record', label: 'Record Stats', title: 'Record stats', desc: 'Capture a match live courtside, rally by rally, or from video.' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'chart',
    blurb: 'What the event log says about the season, the players and the lineup.',
    pages: [
      { id: 'season', label: 'Season', title: 'Season', desc: 'Results and box scores for every match.' },
      { id: 'players', label: 'Players', title: 'Player profiles', desc: 'Ratings adjusted by game data, archetype, strengths and how each player performs by rotation.' },
      { id: 'rotations', label: 'Rotations', title: 'Rotation analytics', desc: 'Side-out and break-point rates, kills, blocks and errors in each rotation.' },
      { id: 'lineups', label: 'Lineups', title: 'Lineup analysis', desc: 'How the current lineup is built, and the best slot arrangement of the roster.' },
      { id: 'pairings', label: 'Pairings', title: 'Pairings', desc: 'Which setter–hitter pairs and front- and back-row combinations produce.' },
      { id: 'recommendations', label: 'Recommendations', title: 'Recommendations', desc: 'Lineup changes and development priorities suggested by the data.' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'people',
    blurb: 'The roster, the lineups and the data behind them.',
    pages: [
      { id: 'roster', label: 'Roster', title: 'Roster', desc: 'Players, positions and jersey numbers.' },
      { id: 'lineups', label: 'Lineups', title: 'Lineups', desc: 'Who starts in which slot, and the libero.' },
      { id: 'data', label: 'Data', title: 'Data & settings', desc: 'Export, import, compact or reset the data stored in this browser.' },
    ],
  },
];

export const REPO_URL = 'https://github.com/rodelBeronilla/volleyball-tactics';

export const pathOf = (sectionId, pageId) => (sectionId === 'home' ? '/' : `/${sectionId}/${pageId}`);

/** Resolve route segments to a section and page; unknown routes fall back to a valid one. */
export function resolveRoute([sectionId, pageId]) {
  const section = SECTIONS.find(s => s.id === sectionId) || SECTIONS[0];
  const page = section.pages.find(p => p.id === pageId) || section.pages[0] || null;
  const canonical = page ? pathOf(section.id, page.id) : '/';
  return { section, page, canonical };
}
