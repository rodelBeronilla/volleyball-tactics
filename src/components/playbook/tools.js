/**
 * The Setter Signals and Serve Receive tools are self-contained pages (public/tools/).
 * They run in a same-origin iframe so their scripts and styles stay isolated from the
 * app. With the `embedded` class they hide their own navigation; the app drives their
 * tabs through the API they expose on window and they report tab changes back with
 * postMessage.
 */
export const TOOLS = {
  'setter-signals': {
    api: 'SetterSignals',
    title: 'Setter Signals & Set Map',
    tabs: [
      { id: 'plan', label: 'Plan' },
      { id: '3d', label: '3D Court' },
      { id: 'diagrams', label: 'Diagrams' },
      { id: 'signals', label: 'Signals' },
      { id: 'quiz', label: 'Quiz' },
      { id: 'checks', label: 'Checks' },
    ],
    // Setter Signals keeps its two diagram views as separate internal tabs
    currentTab: s => (s.tab === 'net' || s.tab === 'court' ? 'diagrams' : s.tab),
  },
  'serve-receive': {
    api: 'ServeReceive',
    title: 'Serve Receive Rotations',
    tabs: [
      { id: 'rot', label: 'Rotations' },
      { id: 'rules', label: 'Overlap' },
      { id: 'roles', label: 'Roles' },
      { id: 'checks', label: 'Checks' },
    ],
    currentTab: s => s.tab,
  },
};
