export default function CourtMarkings() {
  return (
    <g>
      {/* Court background with gradient */}
      <defs>
        <linearGradient id="courtGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d7d30" />
          <stop offset="100%" stopColor="#235a25" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="90" height="90" fill="url(#courtGrad)" rx="2" />

      {/* Court boundary */}
      <rect x="0" y="0" width="90" height="90" fill="none" stroke="#fff" strokeWidth="0.6" rx="2" />

      {/* Net */}
      <line x1="-2" y1="0" x2="92" y2="0" stroke="#555" strokeWidth="2" />
      <line x1="0" y1="0.5" x2="90" y2="0.5" stroke="#ddd" strokeWidth="0.4" />

      {/* Attack line (3m) */}
      <line x1="0" y1="30" x2="90" y2="30" stroke="#fff" strokeWidth="0.4" opacity="0.6" />

      {/* Center line (vertical, subtle) */}
      <line x1="45" y1="0" x2="45" y2="90" stroke="#fff" strokeWidth="0.15" strokeDasharray="1 2" opacity="0.15" />

      {/* Zone numbers — larger and more visible */}
      <text x="15" y="8" textAnchor="middle" fill="#fff" opacity="0.25" fontSize="5" fontWeight="700">4</text>
      <text x="45" y="8" textAnchor="middle" fill="#fff" opacity="0.25" fontSize="5" fontWeight="700">3</text>
      <text x="75" y="8" textAnchor="middle" fill="#fff" opacity="0.25" fontSize="5" fontWeight="700">2</text>
      <text x="15" y="55" textAnchor="middle" fill="#fff" opacity="0.25" fontSize="5" fontWeight="700">5</text>
      <text x="45" y="55" textAnchor="middle" fill="#fff" opacity="0.25" fontSize="5" fontWeight="700">6</text>
      <text x="75" y="55" textAnchor="middle" fill="#fff" opacity="0.25" fontSize="5" fontWeight="700">1</text>

      {/* Net label */}
      <text x="45" y="-2" textAnchor="middle" fill="#999" fontSize="3" fontWeight="600">NET</text>
    </g>
  );
}
