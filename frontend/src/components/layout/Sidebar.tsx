"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Hosted zones",
    href: "/hosted-zones",
    exact: false,
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    label: "Health checks",
    href: "/health-checks",
    exact: true,
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Traffic policies",
    href: "/traffic-policies",
    exact: true,
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="16" y1="3" x2="16" y2="21" />
        <line x1="8" y1="3" x2="8" y2="21" />
        <line x1="20" y1="9" x2="12" y2="9" />
        <line x1="12" y1="15" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    label: "Resolver",
    href: "/resolver",
    exact: true,
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Profiles",
    href: "/profiles",
    exact: true,
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href;
    }

    return (
      pathname === item.href ||
      pathname.startsWith(item.href + "/")
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 flex flex-col
          w-[var(--sidebar-width)] shrink-0
          border-r border-[var(--aws-border)]
          sidebar-transition
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
        style={{
          backgroundColor: "var(--aws-surface)",
          top: "48px",
          height: "calc(100vh - 48px)",
        }}
      >
        {/* Section label */}
        <div className="px-4 pt-4 pb-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{
              color: "var(--aws-text-muted)",
            }}
          >
            Route&nbsp;53
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto"
          aria-label="Route 53 navigation"
        >
          <ul className="py-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-2.5
                      text-sm transition-colors duration-100
                      ${
                        active
                          ? "font-semibold border-r-2 border-[var(--aws-orange)]"
                          : "font-normal hover:bg-[var(--aws-surface-hover)]"
                      }
                    `}
                    style={{
                      color: active
                        ? "var(--aws-orange)"
                        : "var(--aws-text)",
                      backgroundColor: active
                        ? "var(--aws-surface-hover)"
                        : undefined,
                    }}
                    aria-current={
                      active ? "page" : undefined
                    }
                  >
                    <span
                      className={
                        active
                          ? "text-[var(--aws-orange)]"
                          : "text-[var(--aws-text-muted)]"
                      }
                    >
                      {item.icon}
                    </span>

                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--aws-border)]">
          <p
            className="text-[10px]"
            style={{
              color: "var(--aws-text-muted)",
            }}
          >
            Route 53 Clone v1.0
          </p>
        </div>
      </aside>
    </>
  );
}