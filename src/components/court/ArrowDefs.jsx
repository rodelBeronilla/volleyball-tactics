/**
 * SVG <defs> for arrowhead markers used by MovementArrows.
 * Each route style gets its own marker color.
 */
export default function ArrowDefs() {
  const colors = [
    { id: 'arrow-gold',   fill: '#fbbf24' },
    { id: 'arrow-blue',   fill: '#3b82f6' },
    { id: 'arrow-lblue',  fill: '#60a5fa' },
    { id: 'arrow-red',    fill: '#ef4444' },
    { id: 'arrow-lred',   fill: '#f87171' },
    { id: 'arrow-green',  fill: '#22c55e' },
  ];

  return (
    <defs>
      {colors.map(({ id, fill }) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill={fill} />
        </marker>
      ))}
    </defs>
  );
}
