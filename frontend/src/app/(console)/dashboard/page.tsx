"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  listHostedZones,
  listDnsRecords,
} from "@/lib/api";

import Breadcrumb from "@/components/ui/Breadcrumb";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { HostedZoneResponse } from "@/types/api";

export default function DashboardPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [zones, setZones] = useState<HostedZoneResponse[]>([]);
  const [zoneCount, setZoneCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const zoneResponse = await listHostedZones(token, {
        page: 1,
        page_size: 100,
      });

      setZones(zoneResponse.items);
      setZoneCount(zoneResponse.total);

      let totalRecords = 0;

      for (const zone of zoneResponse.items) {
        try {
          const recordResponse = await listDnsRecords(
            token,
            zone.zone_id,
            {
              page: 1,
              page_size: 1,
            }
          );

          totalRecords += recordResponse.total;
        } catch {
          // Ignore a single zone if its records cannot be loaded.
        }
      }

      setRecordCount(totalRecords);
    } catch {
      addToast("error", "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--aws-bg)]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-[var(--aws-bg)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--aws-border)] bg-[var(--aws-surface)] px-6 py-4">
        <Breadcrumb
          items={[
            { label: "Route 53" },
            { label: "Dashboard" },
          ]}
        />

        <div className="mt-3">
          <h1 className="text-2xl font-bold text-[var(--aws-text)]">
            Route 53 Dashboard
          </h1>

          <p className="mt-1 text-sm text-[var(--aws-text-muted)]">
            Manage your hosted zones and DNS records.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Hosted Zones */}
          <Link
            href="/hosted-zones"
            className="group rounded-[var(--radius-lg)] border border-[var(--aws-border)] bg-[var(--aws-surface)] p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--aws-text-muted)]">
                  Hosted zones
                </p>

                <p className="mt-2 text-3xl font-semibold text-[var(--aws-text)]">
                  {zoneCount}
                </p>
              </div>

              <div className="rounded-full bg-[var(--aws-surface-hover)] p-3 text-[var(--aws-orange)]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--aws-text-muted)] group-hover:text-[var(--aws-orange)]">
              View hosted zones →
            </p>
          </Link>

          {/* DNS Records */}
          <Link
            href="/hosted-zones"
            className="group rounded-[var(--radius-lg)] border border-[var(--aws-border)] bg-[var(--aws-surface)] p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--aws-text-muted)]">
                  DNS records
                </p>

                <p className="mt-2 text-3xl font-semibold text-[var(--aws-text)]">
                  {recordCount}
                </p>
              </div>

              <div className="rounded-full bg-[var(--aws-surface-hover)] p-3 text-[var(--aws-orange)]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                  <circle cx="8" cy="6" r="1" />
                  <circle cx="14" cy="12" r="1" />
                  <circle cx="10" cy="18" r="1" />
                </svg>
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--aws-text-muted)] group-hover:text-[var(--aws-orange)]">
              Manage DNS records →
            </p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--aws-border)] bg-[var(--aws-surface)] shadow-sm">
          <div className="border-b border-[var(--aws-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--aws-text)]">
              Quick actions
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 p-5">
            <Link href="/hosted-zones">
              <Button variant="primary">
                View hosted zones
              </Button>
            </Link>

            <Link href="/hosted-zones">
              <Button variant="secondary">
                Manage DNS records
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Hosted Zones */}
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--aws-border)] bg-[var(--aws-surface)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--aws-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--aws-text)]">
                Hosted zones
              </h2>

              <p className="mt-1 text-xs text-[var(--aws-text-muted)]">
                Your recently available hosted zones.
              </p>
            </div>

            <Link
              href="/hosted-zones"
              className="text-sm font-medium text-[var(--aws-orange)] hover:underline"
            >
              View all
            </Link>
          </div>

          {zones.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--aws-surface-hover)] text-[var(--aws-text-muted)]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>

              <p className="text-sm font-medium text-[var(--aws-text)]">
                No hosted zones
              </p>

              <p className="mt-1 text-xs text-[var(--aws-text-muted)]">
                Create a hosted zone to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--aws-border)] bg-[var(--aws-surface-hover)]">
                    <th className="px-5 py-3 font-semibold text-[var(--aws-text)]">
                      Name
                    </th>

                    <th className="px-5 py-3 font-semibold text-[var(--aws-text)]">
                      Type
                    </th>

                    <th className="px-5 py-3 font-semibold text-[var(--aws-text)]">
                      Records
                    </th>

                    <th className="px-5 py-3 font-semibold text-[var(--aws-text)]">
                      Zone ID
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {zones.slice(0, 5).map((zone) => (
                    <tr
                      key={zone.id}
                      className="border-b border-[var(--aws-border)] last:border-b-0 hover:bg-[var(--aws-surface-hover)]"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/hosted-zones/${zone.zone_id}`}
                          className="font-medium text-[var(--aws-orange)] hover:underline"
                        >
                          {zone.name}
                        </Link>
                      </td>

                      <td className="px-5 py-3 text-[var(--aws-text)]">
                        {zone.type}
                      </td>

                      <td className="px-5 py-3 text-[var(--aws-text)]">
                        {zone.record_count}
                      </td>

                      <td className="px-5 py-3 font-mono text-xs text-[var(--aws-text-muted)]">
                        {zone.zone_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboard}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}