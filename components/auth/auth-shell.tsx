export function AuthHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  /** Accepts a node so numerals inside titles can be set in Geist Mono. */
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="t-caption text-[var(--accent)] mb-3">{eyebrow}</p>}
      <h2 className="t-h2 t-num">{title}</h2>
      {subtitle && (
        <p className="t-body text-[var(--text-muted)] mt-3 max-w-[44ch]">{subtitle}</p>
      )}
    </div>
  );
}
