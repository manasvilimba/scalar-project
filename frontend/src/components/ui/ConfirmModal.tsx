"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** If set, user must type this exact string to enable the confirm button */
  confirmText?: string;
  variant?: "danger" | "primary";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  confirmText,
  variant = "danger",
}: ConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = !confirmText || typed === confirmText;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setTyped("");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTyped("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={loading}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--aws-text)]">{description}</p>

        {confirmText && (
          <Input
            label={`Type "${confirmText}" to confirm`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmText}
            required
          />
        )}
      </div>
    </Modal>
  );
}
