import { POSITIONS } from '../../data/positions';
import { isFrontRow } from '../../utils/rotations';

export default function PlayerToken({ placement, onPointerDown, isDragging, isSelected }) {
  const { player, rotationalPosition, x, y, isLiberoIn } = placement;
  if (!player) return null;

  const posInfo = POSITIONS[player.position] || POSITIONS.ds;
  const fillColor = isLiberoIn ? POSITIONS.libero.color : posInfo.color;
  const radius = 5;
  const frontRow = isFrontRow(rotationalPosition);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'grab' }}
      onPointerDown={onPointerDown}
    >
      {/* Selection glow ring */}
      {isSelected && (
        <circle
          r={radius + 1.5}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          opacity="0.8"
        >
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Shadow */}
      <circle r={radius + 0.3} fill="rgba(0,0,0,0.3)" cx="0.3" cy="0.3" />

      {/* Main circle */}
      <circle
        r={radius}
        fill={fillColor}
        stroke={frontRow ? '#fff' : '#666'}
        strokeWidth={frontRow ? 0.6 : 0.4}
        opacity={isDragging ? 0.7 : 1}
      />

      {/* Jersey number */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize="4"
        fontWeight="700"
        style={{ pointerEvents: 'none', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}
      >
        {player.number}
      </text>

      {/* Player name */}
      <text
        y={radius + 2.5}
        textAnchor="middle"
        fill="#fff"
        fontSize="2.2"
        fontWeight="500"
        style={{ pointerEvents: 'none' }}
      >
        {player.name.length > 8 ? player.name.slice(0, 7) + '…' : player.name}
      </text>

      {/* Position badge */}
      <g transform={`translate(${radius - 1}, ${-radius + 1})`}>
        <rect x="-2" y="-1.8" width="4" height="3" rx="0.5" fill="#000" opacity="0.6" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="1.8"
          fontWeight="600"
          style={{ pointerEvents: 'none' }}
        >
          {isLiberoIn ? 'L' : posInfo.abbr}
        </text>
      </g>

      {/* Rotation position indicator */}
      <g transform={`translate(${-radius + 1}, ${-radius + 1})`}>
        <circle r="1.8" fill="#000" opacity="0.5" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="1.8"
          fontWeight="600"
          style={{ pointerEvents: 'none' }}
        >
          {rotationalPosition}
        </text>
      </g>
    </g>
  );
}
