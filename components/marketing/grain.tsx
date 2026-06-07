/**
 * Film-grain overlay — the same fractal-noise texture used across the app,
 * but self-contained so it renders on the forced-dark marketing sections
 * regardless of the active theme (the global `.grain` only paints under
 * `.dark`). Sits absolutely inside a `relative` parent; keep content above
 * it with `relative z-10`.
 */
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

export function Grain({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        opacity,
        backgroundImage: NOISE,
        mixBlendMode: "overlay",
      }}
    />
  );
}
