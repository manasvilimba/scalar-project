export default function TrafficPoliciesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div style={{ color: "var(--aws-text-muted)", opacity: 0.4 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="16" y1="3" x2="16" y2="21" />
          <line x1="8" y1="3" x2="8" y2="21" />
          <line x1="20" y1="9" x2="12" y2="9" />
          <line x1="12" y1="15" x2="4" y2="15" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold" style={{ color: "var(--aws-text)" }}>
        Traffic Policies
      </h1>
      <p className="text-sm" style={{ color: "var(--aws-text-muted)" }}>
        This section is coming soon.
      </p>
    </div>
  );
}
