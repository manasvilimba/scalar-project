"use client";

import { forwardRef, TextareaHTMLAttributes, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className = "", id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-[var(--aws-text)] leading-none"
          >
            {label}
            {required && (
              <span className="text-[var(--aws-error)] ml-0.5" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          rows={4}
          className={`
            px-3 py-2 text-sm rounded-[var(--radius-sm)] resize-y min-h-[72px]
            bg-[var(--aws-surface)] text-[var(--aws-text)]
            border transition-colors duration-100
            ${error
              ? "border-[var(--aws-error)] focus:outline-none focus:ring-2 focus:ring-[var(--aws-error)]"
              : "border-[var(--aws-border)] focus:outline-none focus:ring-2 focus:ring-[var(--aws-border-focus)]"
            }
            disabled:opacity-50
            placeholder:text-[var(--aws-text-muted)]
            mono
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-[var(--aws-error)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--aws-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
