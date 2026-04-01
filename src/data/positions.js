export const POSITIONS = {
  setter: { label: 'Setter', abbr: 'S', color: '#fbbf24' },
  outside: { label: 'Outside', abbr: 'OH', color: '#3b82f6' },
  middle: { label: 'Middle', abbr: 'MB', color: '#ef4444' },
  opposite: { label: 'Opposite', abbr: 'OPP', color: '#22c55e' },
  libero: { label: 'Libero', abbr: 'L', color: '#f97316' },
  ds: { label: 'DS', abbr: 'DS', color: '#8b5cf6' },
};

// Court zone centers (viewBox 0 0 90 90, net at top)
export const ZONE_CENTERS = {
  4: { x: 15, y: 15, label: '4 LF' },
  3: { x: 45, y: 15, label: '3 CF' },
  2: { x: 75, y: 15, label: '2 RF' },
  5: { x: 15, y: 60, label: '5 LB' },
  6: { x: 45, y: 60, label: '6 CB' },
  1: { x: 75, y: 60, label: '1 RB' },
};

export const FRONT_ROW = [2, 3, 4];
export const BACK_ROW = [1, 5, 6];
