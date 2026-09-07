"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  listHostedZones,
  createHostedZone,
  deleteHostedZone,
} from "@/lib/api";
import { HostedZoneResponse, HostedZoneCreate, ApiError } from "@/types/api";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ZoneTable from "@/components/zones/ZoneTable";
import CreateZoneModal from "@/components/zones/CreateZoneModal";
import DeleteZoneConfirm from "@/components/zones/DeleteZoneConfirm";

export default function HostedZonesPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [zones, setZones] = useState<HostedZoneResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<HostedZoneResponse | null>(null);

  const fetchZones = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listHostedZones(token, { search, page, page_size: pageSize });
      setZones(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      addToast("error", "Failed to load hosted zones.");
    } finally {
      setLoading(false);
    }
  }, [token, search, page, pageSize, addToast]);

  useEffect(() => {
    setTimeout(() => fetchZones(), 0);
  }, [fetchZones]);

  // Reset page when search changes
  useEffect(() => {
    setTimeout(() => setPage(1), 0);
  }, [search]);

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      description: "Create new hosted zone",
      action: () => setIsCreateOpen(true),
    },
    {
      key: "/",
      description: "Search hosted zones",
      action: () => {
        const el = document.querySelector('input[type="search"]') as HTMLInputElement;
        el?.focus();
      },
    },
  ]);

  // Handlers
  async function handleCreate(data: HostedZoneCreate) {
    if (!token) return;
    try {
      await createHostedZone(token, data);
      addToast("success", `Hosted zone ${data.name} created successfully.`);
      setIsCreateOpen(false);
      fetchZones();
    } catch (err) {
      if (err instanceof ApiError) {
        addToast("error", err.detail);
      } else {
        addToast("error", "Failed to create hosted zone.");
      }
      throw err; // Let modal stay open
    }
  }

  async function handleDelete() {
    if (!token || !zoneToDelete) return;
    try {
      await deleteHostedZone(token, zoneToDelete.zone_id);
      addToast("success", `Hosted zone ${zoneToDelete.name} deleted.`);
      setZoneToDelete(null);
      fetchZones();
    } catch (err) {
      if (err instanceof ApiError) {
        addToast("error", err.detail);
      } else {
        addToast("error", "Failed to delete hosted zone.");
      }
      throw err;
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--aws-bg)]">
      {/* Header Area */}
      <div className="px-6 py-4 bg-[var(--aws-surface)] border-b border-[var(--aws-border)] shrink-0">
        <Breadcrumb items={[{ label: "Route 53" }, { label: "Hosted zones" }]} />
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--aws-text)]">Hosted zones</h1>
            <p className="text-sm text-[var(--aws-text-muted)] mt-1">
              A hosted zone is a container for records, and records contain information about how you want to route traffic for a specific domain.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              Create hosted zone
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 overflow-auto">
        <div className="bg-[var(--aws-surface)] border border-[var(--aws-border)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-[var(--aws-border)] flex flex-wrap gap-3 items-center justify-between bg-[var(--aws-surface-hover)]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Find hosted zones by name or ID"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
               <Button
                variant="secondary"
                size="sm"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
                  </svg>
                }
                onClick={fetchZones}
                title="Refresh"
                aria-label="Refresh list"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-[300px]">
            <ZoneTable
              zones={zones}
              loading={loading}
              onDelete={setZoneToDelete}
            />
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateZoneModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <DeleteZoneConfirm
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        onConfirm={handleDelete}
        zone={zoneToDelete}
      />
    </div>
  );
}
