"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { logout as apiLogout } from "@/lib/api";

export default function UserMenu() {
  const { username, token, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function handleLogout() {
    setOpen(false);
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        /* ignore — client still logs out */
      }
    }
    logout();
    addToast("info", "You have been signed out.");
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors px-2 py-1.5 rounded hover:bg-white/10"
        aria-haspopup="true"
        aria-expanded={open}
        id="user-menu-button"
      >
        {/* Avatar */}
        <span className="w-6 h-6 rounded-full bg-[var(--aws-orange)] text-[#111] font-bold text-[10px] flex items-center justify-center flex-shrink-0 uppercase">
          {username?.[0] ?? "?"}
        </span>
        <span className="hidden sm:block">{username ?? "Account"}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-70">
          <path d="M5 7L0 2h10L5 7z" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Dropdown */}
          <div
            role="menu"
            aria-labelledby="user-menu-button"
            className="
              absolute right-0 top-full mt-1 w-48 z-50
              bg-[var(--aws-surface)] border border-[var(--aws-border)]
              rounded-[var(--radius-md)] shadow-xl
              animate-fadeIn overflow-hidden
            "
          >
            <div className="px-4 py-3 border-b border-[var(--aws-border)]">
              <p className="text-xs text-[var(--aws-text-muted)]">Signed in as</p>
              <p className="text-sm font-semibold text-[var(--aws-text)] truncate">{username}</p>
            </div>
            <div className="py-1">
              <button
                role="menuitem"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-[var(--aws-text)] hover:bg-[var(--aws-surface-hover)] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
