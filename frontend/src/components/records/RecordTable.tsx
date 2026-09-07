"use client";

import { DnsRecordResponse } from "@/types/api";
import Badge, { RECORD_TYPE_COLORS } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

interface RecordTableProps {
  records: DnsRecordResponse[];
  loading: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (record: DnsRecordResponse) => void;
  onDelete: (record: DnsRecordResponse) => void;
}

export default function RecordTable({
  records,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: RecordTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12 border-t border-[var(--aws-border)] bg-[var(--aws-surface)]">
        <Spinner size={24} />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="border-t border-[var(--aws-border)] bg-[var(--aws-surface)]">
        <EmptyState
          title="No DNS records found"
          description="You don't have any DNS records that match your filter, or you haven't created any yet."
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          }
        />
      </div>
    );
  }

  const allSelected = records.length > 0 && selectedIds.size === records.length;

  return (
    <div className="overflow-x-auto border-t border-[var(--aws-border)] bg-[var(--aws-surface)]">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--aws-border)] bg-[var(--aws-surface-hover)]">
            <th className="px-4 py-2 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-[var(--aws-border)] text-[var(--aws-orange)] focus:ring-[var(--aws-orange)]"
                aria-label="Select all records"
              />
            </th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Record name</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Type</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Routing policy</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">Value/Route traffic to</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap">TTL (seconds)</th>
            <th className="px-4 py-2 font-semibold text-[var(--aws-text)] whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--aws-border)]">
          {records.map((record) => {
            const isSelected = selectedIds.has(record.id);
            return (
              <tr
                key={record.id}
                className={`transition-colors group ${
                  isSelected ? "bg-[var(--aws-info-bg)]" : "hover:bg-[var(--aws-surface-hover)]"
                }`}
              >
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(record.id)}
                    className="w-4 h-4 rounded border-[var(--aws-border)] text-[var(--aws-orange)] focus:ring-[var(--aws-orange)]"
                    aria-label={`Select record ${record.name}`}
                  />
                </td>
                <td className="px-4 py-2.5 font-medium text-[var(--aws-text)] break-all">
                  {record.name}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={RECORD_TYPE_COLORS[record.type] || "gray"}>
                    {record.type}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-[var(--aws-text-muted)]">
                  {record.routing_policy}
                </td>
                <td className="px-4 py-2.5 text-[var(--aws-text)] truncate max-w-[250px]" title={record.value}>
                  {record.value}
                </td>
                <td className="px-4 py-2.5 text-[var(--aws-text-muted)]">
                  {record.ttl}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" onClick={() => onEdit(record)}>
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onDelete(record)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
