/**
 * Sparkline — pure inline SVG. No chart lib, no client JS, no axes, no labels.
 *
 * Designed for hero stat cards: a calm reference line + a curve that fills
 * gently underneath. Renders an honest empty state when the data is all
 * zeros (a thin horizontal baseline) so a brand-new account never sees an
 * "error" gap.
 *
 * Defaults match the dashboard "Earned" card: 240×56 logical units, accent
 * stroke, accent-soft fill at 25% opacity. Tweak via props for re-use.
 */

type Props = {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Stroke + fill base color. Defaults to var(--accent). */
  color?: string;
  /** Show the dot on the most recent point. */
  showLast?: boolean;
};

export function Sparkline({
  data,
  width = 240,
  height = 56,
  className,
  color = "var(--accent)",
  showLast = true,
}: Props) {
  const padX = 1.5;
  const padY = 4;
  const n = data.length;

  // Empty / all-zero → calm baseline rather than a missing-data look.
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const allZero = max === 0 && min === 0;

  const stepX = n > 1 ? (width - padX * 2) / (n - 1) : 0;
  const points = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = padY + (height - padY * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  // Smooth path via cardinal-ish Catmull-Rom approximation (tension 0.5).
  // Keeps it premium without a charting dep.
  const path = (() => {
    if (n === 0) return "";
    if (n === 1) {
      const [x, y] = points[0]!;
      return `M ${x} ${y}`;
    }
    let d = `M ${points[0]![0]} ${points[0]![1]}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i - 1] ?? points[i]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const p3 = points[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  })();

  const fillPath = path
    ? `${path} L ${points[n - 1]![0]} ${height} L ${points[0]![0]} ${height} Z`
    : "";

  const last = points[n - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {/* Baseline whisper */}
      <line
        x1={0}
        x2={width}
        y1={height - 1}
        y2={height - 1}
        stroke="var(--border)"
        strokeWidth={0.5}
      />

      {allZero || n === 0 ? (
        <line
          x1={padX}
          x2={width - padX}
          y1={height / 2}
          y2={height / 2}
          stroke="var(--border-strong)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ) : (
        <>
          <path d={fillPath} fill={color} opacity={0.14} />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showLast && last && (
            <>
              <circle cx={last[0]} cy={last[1]} r={3.5} fill="var(--bg)" />
              <circle cx={last[0]} cy={last[1]} r={2.25} fill={color} />
            </>
          )}
        </>
      )}
    </svg>
  );
}
