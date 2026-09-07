"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { parseBind } from "@/lib/bind";
import { DnsRecordCreate } from "@/types/api";

interface ImportBindModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: DnsRecordCreate[]) => Promise<void>;
  zoneName: string;
}

export default function ImportBindModal({
  isOpen,
  onClose,
  onImport,
  zoneName,
}: ImportBindModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<DnsRecordCreate[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setFile(null);
    setParsedRecords([]);
    setParseErrors([]);
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseBind(text);
      
      // Ensure all imported records belong to the zone apex or subdomain
      // if they use relative names. The parser handles basic conversion.
      setParsedRecords(result.records);
      setParseErrors(result.errors);
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (parsedRecords.length === 0) return;
    setLoading(true);
    try {
      await onImport(parsedRecords);
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import zone file"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            loading={loading}
            disabled={parsedRecords.length === 0}
          >
            Import {parsedRecords.length} records
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-[var(--aws-text)]">
          You can import a standard BIND zone file to create records in <strong>{zoneName}</strong>. 
          Supported types: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA.
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--aws-text)]">Zone file (.txt or .zone)</label>
          <input
            type="file"
            accept=".txt,.zone"
            onChange={handleFileChange}
            className="block w-full text-sm text-[var(--aws-text-muted)]
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-medium
              file:bg-[var(--aws-surface-hover)] file:text-[var(--aws-text)]
              hover:file:bg-[var(--aws-border)] cursor-pointer
              border border-[var(--aws-border)] rounded-[var(--radius-sm)] p-1
            "
            disabled={loading}
          />
        </div>

        {file && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--aws-text)]">Parse Results</h3>
            
            <div className="flex gap-4 mb-2">
               <div className="flex flex-col items-center justify-center p-4 bg-[var(--aws-success-bg)] rounded-[var(--radius-sm)] border border-green-200 dark:border-green-900/50 flex-1">
                 <span className="text-2xl font-bold text-[var(--aws-success)]">{parsedRecords.length}</span>
                 <span className="text-xs text-[var(--aws-text)] font-medium mt-1">Valid records</span>
               </div>
               <div className="flex flex-col items-center justify-center p-4 bg-[var(--aws-error-bg)] rounded-[var(--radius-sm)] border border-red-200 dark:border-red-900/50 flex-1">
                 <span className="text-2xl font-bold text-[var(--aws-error)]">{parseErrors.length}</span>
                 <span className="text-xs text-[var(--aws-text)] font-medium mt-1">Errors skipped</span>
               </div>
            </div>

            {parseErrors.length > 0 && (
              <div className="bg-[var(--aws-error-bg)] border-l-4 border-[var(--aws-error)] p-3 rounded text-sm">
                <p className="font-semibold text-[var(--aws-error)] mb-1">Warnings during parsing:</p>
                <ul className="list-disc list-inside text-xs text-[var(--aws-error)] max-h-32 overflow-y-auto space-y-1">
                  {parseErrors.map((err, i) => (
                    <li key={i} className="truncate" title={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {parsedRecords.length > 0 && (
               <div className="max-h-48 overflow-y-auto border border-[var(--aws-border)] rounded-[var(--radius-sm)]">
                  <table className="w-full text-xs text-left">
                     <thead className="bg-[var(--aws-surface-hover)] sticky top-0">
                        <tr>
                           <th className="px-3 py-2 border-b border-[var(--aws-border)]">Name</th>
                           <th className="px-3 py-2 border-b border-[var(--aws-border)]">Type</th>
                           <th className="px-3 py-2 border-b border-[var(--aws-border)]">Value</th>
                        </tr>
                     </thead>
                     <tbody>
                        {parsedRecords.map((r, i) => (
                           <tr key={i} className="border-b border-[var(--aws-border)] last:border-0 hover:bg-[var(--aws-surface-hover)]">
                              <td className="px-3 py-1.5 truncate max-w-[150px]">{r.name}</td>
                              <td className="px-3 py-1.5">{r.type}</td>
                              <td className="px-3 py-1.5 truncate max-w-[200px]">{r.value}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
