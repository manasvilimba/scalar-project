"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { HostedZoneResponse } from "@/types/api";

interface DeleteZoneConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  zone: HostedZoneResponse | null;
}

export default function DeleteZoneConfirm({
  isOpen,
  onClose,
  onConfirm,
  zone,
}: DeleteZoneConfirmProps) {
  if (!zone) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete hosted zone"
      description={`This will permanently delete the hosted zone "${zone.name}" and all of its associated DNS records. This action cannot be undone.`}
      confirmLabel="Delete"
      confirmText="delete"
      variant="danger"
    />
  );
}
