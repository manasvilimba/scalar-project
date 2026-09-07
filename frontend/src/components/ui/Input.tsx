"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`
            h-8 px-3 text-sm rounded-[var(--radius-sm)]
            bg-[var(--aws-surface)] text-[var(--aws-text)]
            border transition-colors duration-100
            ${error
              ? "border-[var(--aws-error)] focus:outline-none focus:ring-2 focus:ring-[var(--aws-error)]"
              : "border-[var(--aws-border)] focus:outline-none focus:ring-2 focus:ring-[var(--aws-border-focus)]"
            }
            disabled:opacity-50 disabled:bg-[var(--aws-surface-hover)]
            placeholder:text-[var(--aws-text-muted)]
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-xs text-[var(--aws-error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-[var(--aws-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
