export default function CourtMarkings() {
  return (
    <g>
      {/* Court background */}
      <rect x="0" y="0" width="90" height="90" fill="#2d6b30" rx="1" />

      {/* Court boundary */}
      <rect x="0" y="0" width="90" height="90" fill="none" stroke="#fff" strokeWidth="0.5" rx="1" />

      {/* Net (top edge) */}
      <line x1="0" y1="0" x2="90" y2="0" stroke="#333" strokeWidth="1.5" />
      <line x1="0" y1="0.5" x2="90" y2="0.5" stroke="#fff" strokeWidth="0.3" strokeDasharray="2 1" />

      {/* Attack line (3m from net) */}
      <line x1="0" y1="30" x2="90" y2="30" stroke="#fff" strokeWidth="0.4" strokeDasharray="2 1" />

      {/* Center reference line (vertical) */}
      <line x1="45" y1="0" x2="45" y2="90" stroke="#fff" strokeWidth="0.15" strokeDasharray="1 2" opacity="0.3" />

      {/* Zone labels */}
      <text x="15" y="6" textAnchor="middle" fill="#fff" opacity="0.2" fontSize="3" fontWeight="600">4</text>
      <text x="45" y="6" textAnchor="middle" fill="#fff" opacity="0.2" fontSize="3" fontWeight="600">3</text>
      <text x="75" y="6" textAnchor="middle" fill="#fff" opacity="0.2" fontSize="3" fontWeight="600">2</text>
      <text x="15" y="52" textAnchor="middle" fill="#fff" opacity="0.2" fontSize="3" fontWeight="600">5</text>
      <text x="45" y="52" textAnchor="middle" fill="#fff" opacity="0.2" fontSize="3" fontWeight="600">6</text>
      <text x="75" y="52" textAnchor="middle" fill="#fff" opacity="0.2" fontSize="3" fontWeight="600">1</text>

      {/* Row labels */}
      <text x="45" y="26" textAnchor="middle" fill="#fff" opacity="0.15" fontSize="2">FRONT ROW</text>
      <text x="45" y="86" textAnchor="middle" fill="#fff" opacity="0.15" fontSize="2">BACK ROW</text>

      {/* Net label */}
      <text x="45" y="-1.5" textAnchor="middle" fill="#aaa" fontSize="2.5" fontWeight="500">NET</text>
    </g>
  );
}
