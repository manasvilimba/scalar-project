"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  getHostedZone,
  listDnsRecords,
  createDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
  bulkDeleteDnsRecords,
  importBindFile,
} from "@/lib/api";
import {
  HostedZoneResponse,
  DnsRecordResponse,
  DnsRecordCreate,
  DnsRecordUpdate,
  DNS_RECORD_TYPES,
  ApiError,
} from "@/types/api";
import { serialiseBind, downloadText } from "@/lib/bind";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Select from "@/components/ui/Select";
import ConfirmModal from "@/components/ui/ConfirmModal";
import RecordTable from "@/components/records/RecordTable";
import CreateEditRecordModal from "@/components/records/CreateEditRecordModal";
import ImportBindModal from "@/components/records/ImportBindModal";

export default function DnsRecordsPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [zone, setZone] = useState<HostedZoneResponse | null>(null);
  const [records, setRecords] = useState<DnsRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filter
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DnsRecordResponse | undefined>();
  const [recordToDelete, setRecordToDelete] = useState<DnsRecordResponse | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load Zone
  const fetchZone = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getHostedZone(token, resolvedParams.zoneId);
      setZone(res);
    } catch (err) {
      addToast("error", "Hosted zone not found.");
      router.push("/hosted-zones");
    }
  }, [token, resolvedParams.zoneId, router, addToast]);

  useEffect(() => {
    setTimeout(() => fetchZone(), 0);
  }, [fetchZone]);

  // Load Records
  const fetchRecords = useCallback(async () => {
    if (!token || !zone) return;
    setLoading(true);
    try {
      const res = await listDnsRecords(token, zone.zone_id, {
        search,
        record_type: recordType,
        page,
        page_size: pageSize,
      });
      setRecords(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      addToast("error", "Failed to load DNS records.");
    } finally {
      setLoading(false);
    }
  }, [token, zone, search, recordType, page, pageSize, addToast]);

  useEffect(() => {
    setTimeout(() => { if (zone) fetchRecords(); }, 0);
  }, [fetchRecords, zone]);

  // Reset page when filters change
  useEffect(() => {
    setTimeout(() => {
      setPage(1);
      setSelectedIds(new Set()); // Clear selection on filter change
    }, 0);
  }, [search, recordType]);

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      description: "Create new DNS record",
      action: () => {
        setRecordToEdit(undefined);
        setIsCreateOpen(true);
      },
    },
    {
      key: "/",
      description: "Search records",
      action: () => {
        const el = document.querySelector('input[type="search"]') as HTMLInputElement;
        el?.focus();
      },
    },
  ]);

  // Handlers
  async function handleCreateOrUpdate(data: DnsRecordCreate | DnsRecordUpdate) {
    if (!token || !zone) return;
    try {
      if (recordToEdit) {
        await updateDnsRecord(token, zone.zone_id, recordToEdit.id, data as DnsRecordUpdate);
        addToast("success", "DNS record updated.");
      } else {
        await createDnsRecord(token, zone.zone_id, data as DnsRecordCreate);
        addToast("success", "DNS record created.");
      }
      setIsCreateOpen(false);
      fetchZone();
      fetchRecords();
    } catch (err) {
      if (err instanceof ApiError) {
        addToast("error", err.detail);
      } else {
        addToast("error", "An error occurred saving the record.");
      }
      throw err;
    }
  }

  async function handleDelete() {
    if (!token || !zone || !recordToDelete) return;
    try {
      await deleteDnsRecord(token, zone.zone_id, recordToDelete.id);
      addToast("success", `Record ${recordToDelete.name} deleted.`);
      setRecordToDelete(null);
      // Remove from selection if present
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(recordToDelete.id);
        return next;
      });
      fetchZone();
      fetchRecords();
    } catch (err) {
      if (err instanceof ApiError) addToast("error", err.detail);
      throw err;
    }
  }

  async function handleBulkDelete() {
    if (!token || !zone || selectedIds.size === 0) return;
    try {
      await bulkDeleteDnsRecords(token, zone.zone_id, { ids: Array.from(selectedIds) });
      addToast("success", `${selectedIds.size} records deleted successfully.`);
      setSelectedIds(new Set());
      setBulkDeleteConfirmOpen(false);
      fetchZone();
      fetchRecords();
    } catch (err) {
      if (err instanceof ApiError) addToast("error", err.detail);
    }
  }

  async function handleImport(importRecords: DnsRecordCreate[]) {
    if (!token || !zone) return;
    try {
      const res = await importBindFile(token, zone.zone_id, importRecords);
      if (res.imported > 0) {
        addToast("success", `Successfully imported ${res.imported} records.`);
      }
      if (res.errors.length > 0) {
        addToast("error", `${res.errors.length} records failed to import.`);
      }
      fetchZone();
      fetchRecords();
    } catch (err) {
      addToast("error", "Failed to import zone file.");
      throw err;
    }
  }

  async function handleExport() {
    if (!token || !zone) return;
    setExporting(true);
    try {
      // Fetch all records for export, regardless of pagination/filters
      // A production system might limit this or run a background job.
      let allRecords: DnsRecordResponse[] = [];
      let current = 1;
      let totalPagesExport = 1;
      
      do {
         const res = await listDnsRecords(token, zone.zone_id, { page: current, page_size: 100 });
         allRecords = [...allRecords, ...res.items];
         totalPagesExport = res.total_pages;
         current++;
      } while (current <= totalPagesExport);

      const bindData = serialiseBind(zone.name, allRecords);
      downloadText(`${zone.name}.zone`, bindData);
      addToast("success", "Zone file downloaded.");
    } catch (err) {
      addToast("error", "Failed to export zone file.");
    } finally {
      setExporting(false);
    }
  }

  function handleToggleSelect(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleToggleSelectAll() {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  }

  if (!zone) return null; // Wait for zone to load

  return (
    <div className="flex flex-col h-full bg-[var(--aws-bg)]">
      {/* Header Area */}
      <div className="px-6 py-4 bg-[var(--aws-surface)] border-b border-[var(--aws-border)] shrink-0 space-y-4">
        <Breadcrumb
          items={[
            { label: "Route 53" },
            { label: "Hosted zones", href: "/hosted-zones" },
            { label: zone.name },
          ]}
        />
        
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--aws-text)]">{zone.name}</h1>
            <p className="text-sm text-[var(--aws-text-muted)] mt-1">
              Hosted zone ID: <span className="font-mono text-xs font-semibold">{zone.zone_id}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
             <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
               Import zone file
             </Button>
             <Button variant="secondary" onClick={handleExport} loading={exporting}>
               Export zone file
             </Button>
            <Button
              variant="primary"
              onClick={() => {
                setRecordToEdit(undefined);
                setIsCreateOpen(true);
              }}
            >
              Create record
            </Button>
          </div>
        </div>

        {/* Zone details strip */}
        <div className="flex gap-8 text-sm pt-2">
           <div>
              <span className="text-[var(--aws-text-muted)]">Type: </span>
              <span className="font-semibold text-[var(--aws-text)]">{zone.type}</span>
           </div>
           <div>
              <span className="text-[var(--aws-text-muted)]">Record count: </span>
              <span className="font-semibold text-[var(--aws-text)]">{zone.record_count}</span>
           </div>
           {zone.comment && (
              <div className="truncate max-w-md">
                 <span className="text-[var(--aws-text-muted)]">Comment: </span>
                 <span className="text-[var(--aws-text)]">{zone.comment}</span>
              </div>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 overflow-auto">
         <div className="flex items-center gap-2 mb-3">
             <h2 className="text-lg font-semibold text-[var(--aws-text)]">Records</h2>
         </div>

        <div className="bg-[var(--aws-surface)] border border-[var(--aws-border)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-[var(--aws-border)] flex flex-wrap gap-3 items-center justify-between bg-[var(--aws-surface-hover)]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xl">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Find records by name or value"
                className="w-full md:w-64"
              />
              <Select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                options={[
                  { value: "", label: "Any type" },
                  ...DNS_RECORD_TYPES.map((t) => ({ value: t, label: t })),
                ]}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
               {selectedIds.size > 0 && (
                  <Button variant="danger" size="sm" onClick={() => setBulkDeleteConfirmOpen(true)}>
                     Delete {selectedIds.size} selected
                  </Button>
               )}
               <Button
                variant="secondary"
                size="sm"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
                  </svg>
                }
                onClick={() => {
                  fetchZone();
                  fetchRecords();
                }}
                title="Refresh"
                aria-label="Refresh list"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-[300px]">
            <RecordTable
              records={records}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onEdit={(r) => {
                setRecordToEdit(r);
                setIsCreateOpen(true);
              }}
              onDelete={(r) => setRecordToDelete(r)}
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
      <CreateEditRecordModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={recordToEdit}
        zoneName={zone.name}
      />

      <ImportBindModal
         isOpen={isImportOpen}
         onClose={() => setIsImportOpen(false)}
         onImport={handleImport}
         zoneName={zone.name}
      />

      <ConfirmModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDelete}
        title="Delete record"
        description={`Are you sure you want to delete the ${recordToDelete?.type} record for ${recordToDelete?.name}?`}
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmModal
         isOpen={bulkDeleteConfirmOpen}
         onClose={() => setBulkDeleteConfirmOpen(false)}
         onConfirm={handleBulkDelete}
         title="Delete multiple records"
         description={`Are you sure you want to permanently delete ${selectedIds.size} records? This action cannot be undone.`}
         confirmLabel="Delete records"
         confirmText="delete"
         variant="danger"
      />
    </div>
  );
}
