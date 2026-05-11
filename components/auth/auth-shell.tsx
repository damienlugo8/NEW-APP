export function AuthHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="t-caption text-[var(--accent)] mb-3">{eyebrow}</p>}
      <h2 className="t-h2">{title}</h2>
      {subtitle && (
        <p className="t-body text-[var(--text-muted)] mt-3 max-w-[44ch]">{subtitle}</p>
      )}
    </div>
  );
}
