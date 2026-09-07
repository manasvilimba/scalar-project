export default function ResolverPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div style={{ color: "var(--aws-text-muted)", opacity: 0.4 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold" style={{ color: "var(--aws-text)" }}>
        Resolver
      </h1>
      <p className="text-sm" style={{ color: "var(--aws-text-muted)" }}>
        This section is coming soon.
      </p>
    </div>
  );
}
