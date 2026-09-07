"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on backdrop click
  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  }

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onClose={onClose}
      className="
        m-auto p-0 rounded-[var(--radius-md)] shadow-2xl
        bg-[var(--aws-surface)] text-[var(--aws-text)]
        border border-[var(--aws-border)]
        backdrop:bg-black/50
        open:animate-scaleIn
        max-h-[90vh] overflow-y-auto
      "
      style={{ width: `min(${SIZE_CLASSES[size].replace("max-w-", "")}rem, 94vw)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--aws-border)] sticky top-0 bg-[var(--aws-surface)] z-10">
        <h2 className="text-base font-semibold text-[var(--aws-text)] leading-none">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded text-[var(--aws-text-muted)] hover:text-[var(--aws-text)] hover:bg-[var(--aws-surface-hover)] transition-colors"
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--aws-border)] sticky bottom-0 bg-[var(--aws-surface)]">
          {footer}
        </div>
      )}
    </dialog>
  );
}
