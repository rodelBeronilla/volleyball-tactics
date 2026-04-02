# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (flat config, JS/JSX only)
```

No test framework is configured. No CI pipeline exists yet.

## Architecture

Single-page React 19 app (plain JavaScript, no TypeScript) for volleyball coaching — visualize rotations, formations, and player strategy on an interactive court diagram.

**Stack:** Vite 8, React 19, Tailwind CSS v4 (via `@tailwindcss/vite` plugin), ESLint 9 flat config. Deployed to GitHub Pages at `/volleyball-tactics/` base path.

### State Management

All app state lives in a single `useReducer` in `src/hooks/useAppState.js`. The reducer handles player CRUD, lineup CRUD, rotation navigation, formation/responsibility selection, player drag overrides, and tab navigation. State is persisted to `localStorage` via `src/utils/storage.js` (each key saved independently via `useEffect`).

The hook also derives computed data: `activeLineup`, `currentSlots` (who occupies each rotational position after rotation math), `placements` (court x/y coordinates per player combining formation defaults + per-lineup overrides + libero auto-substitution).

### Domain Model

- **Players** have a position (setter, outside, middle, opposite, libero, ds) and a jersey number
- **Lineups** assign players to slots 1-6 with an optional libero. Lineups store per-rotation position overrides (`overrides.r{N}.{slot}`)
- **Rotations** 1-6 are standard volleyball rotations derived in `src/utils/rotations.js` via `deriveRotation()`
- **Formations** (`src/data/formations.js`) define x/y placements for each slot in each rotation (e.g., serve-receive 5-1)
- **Responsibilities** (`src/data/responsibilities.js`) define per-rotation duties by role
- **Strategy data** (`src/data/strategyData.js`) and **route data** (`src/data/routeData.js`) power the strategy cards and movement arrows

### Component Layout

- `src/App.jsx` — tab-based layout (court, roster, lineups, analysis) controlled by `state.activeTab`
- `src/components/court/` — SVG court rendering: `Court.jsx` (main SVG), `PlayerToken.jsx`, `CourtMarkings.jsx`, `MovementArrows.jsx`, `ArrowDefs.jsx`, `OverlapIndicator.jsx`, `PlayerStrategyCard.jsx`, `RotationSummary.jsx`
- `src/components/controls/` — UI controls: rotation nav, formation picker, responsibility selector, bottom tab nav
- `src/components/roster/` — player CRUD (RosterPanel, PlayerForm)
- `src/components/lineup/` — lineup management and composition analysis

### Court Rendering

The court is an SVG with a 100x100 viewBox. Player positions use SVG `transform` attributes (not CSS transforms). Position coordinates are percentages within this viewBox. The `OverlapIndicator` validates legal positioning per volleyball rules (`src/utils/overlap.js`).

### Styling

Tailwind v4 with custom theme tokens defined in `src/index.css` `@theme` block (court colors, position colors, surface colors). Dark theme throughout.

### ESLint

`no-unused-vars` ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`). React Hooks and React Refresh plugins are active.
