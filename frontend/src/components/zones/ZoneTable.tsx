"use client";

import Link from "next/link";
import { HostedZoneResponse } from "@/types/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

interface ZoneTableProps {
  zones: HostedZoneResponse[];
  loading: boolean;
  onDelete: (zone: HostedZoneResponse) => void;
  onEditComment?: (zone: HostedZoneResponse) => void;
}

export default function ZoneTable({ zones, loading, onDelete }: ZoneTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12 border-t border-[var(--aws-border)] bg-[var(--aws-surface)]">
        <Spinner size={24} />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="border-t border-[var(--aws-border)] bg-[var(--aws-surface)]">
        <EmptyState
          title="No hosted zones found"
          description="You don't have any hosted zones that match your filter, or you haven't created any yet."
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-[var(--aws-border)] bg-[var(--aws-surface)]">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--aws-border)] bg-[var(--aws-surface-hover)]">
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Domain name</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Type</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Record count</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Comment</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--aws-border)]">
          {zones.map((zone) => (
            <tr key={zone.id} className="hover:bg-[var(--aws-surface-hover)] transition-colors group">
              <td className="px-4 py-2.5">
                <Link
                  href={`/hosted-zones/${zone.zone_id}`}
                  className="font-medium text-[var(--aws-text-link)] hover:underline flex items-center gap-1.5"
                >
                  {zone.name}
                  <span className="text-[var(--aws-text-muted)] text-[10px] bg-[var(--aws-bg)] px-1 rounded border border-[var(--aws-border)]">
                    {zone.zone_id}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <Badge variant={zone.type === "Public" ? "blue" : "gray"}>
                  {zone.type}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-[var(--aws-text-muted)]">
                {zone.record_count}
              </td>
              <td className="px-4 py-2.5 text-[var(--aws-text-muted)] truncate max-w-[200px]">
                {zone.comment || <span className="opacity-50 italic">None</span>}
              </td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDelete(zone)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
