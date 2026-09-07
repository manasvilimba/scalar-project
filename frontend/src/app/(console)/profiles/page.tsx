export default function ProfilesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div style={{ color: "var(--aws-text-muted)", opacity: 0.4 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold" style={{ color: "var(--aws-text)" }}>
        Profiles
      </h1>
      <p className="text-sm" style={{ color: "var(--aws-text-muted)" }}>
        This section is coming soon.
      </p>
    </div>
  );
}
