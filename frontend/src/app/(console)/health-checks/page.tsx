export default function HealthChecksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div style={{ color: "var(--aws-text-muted)", opacity: 0.4 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold" style={{ color: "var(--aws-text)" }}>
        Health Checks
      </h1>
      <p className="text-sm" style={{ color: "var(--aws-text-muted)" }}>
        This section is coming soon.
      </p>
    </div>
  );
}
