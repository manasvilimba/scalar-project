"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GlobalHeader from "@/components/layout/GlobalHeader";
import Sidebar from "@/components/layout/Sidebar";
import Spinner from "@/components/ui/Spinner";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--aws-bg)]">
        <Spinner size={32} />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--aws-bg)" }}>
      {/* Sticky global header */}
      <GlobalHeader onMenuToggle={() => setMobileNavOpen((o) => !o)} />

      {/* Body: sidebar + main content */}
      <div className="console-layout">
        <Sidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
