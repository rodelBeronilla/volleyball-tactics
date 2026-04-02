/**
 * CSS-only bar chart for trends. No charting library.
 */
export default function SparkChart({ values, height = 40, colorFn, labels }) {
  if (!values || values.length === 0) return null;

  const max = Math.max(...values.filter(v => v !== null && v !== undefined), 0.001);
  const min = Math.min(...values.filter(v => v !== null && v !== undefined), 0);
  const range = max - min || 1;

  const defaultColor = (v) => {
    const pct = (v - min) / range;
    if (pct >= 0.7) return '#22c55e';
    if (pct >= 0.4) return '#eab308';
    return '#ef4444';
  };

  const getColor = colorFn || defaultColor;

  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {values.map((v, i) => {
        if (v === null || v === undefined) {
          return <div key={i} className="flex-1 bg-white/5 rounded-sm" style={{ height: 2 }} />;
        }
        const pct = Math.max(5, ((v - min) / range) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
            <div
              className="w-full rounded-sm transition-all"
              style={{ height: `${pct}%`, background: getColor(v), minHeight: 2 }}
              title={labels?.[i] ? `${labels[i]}: ${typeof v === 'number' ? v.toFixed(3) : v}` : String(v)}
            />
          </div>
        );
      })}
    </div>
  );
}
