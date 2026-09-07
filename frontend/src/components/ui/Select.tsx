"use client";

import { forwardRef, SelectHTMLAttributes, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, required, options, placeholder, className = "", id: externalId, ...props },
    ref
  ) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={!!error}
            className={`
              w-full h-8 pl-3 pr-8 text-sm rounded-[var(--radius-sm)] appearance-none cursor-pointer
              bg-[var(--aws-surface)] text-[var(--aws-text)]
              border transition-colors duration-100
              ${error
                ? "border-[var(--aws-error)] focus:outline-none focus:ring-2 focus:ring-[var(--aws-error)]"
                : "border-[var(--aws-border)] focus:outline-none focus:ring-2 focus:ring-[var(--aws-border-focus)]"
              }
              disabled:opacity-50
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-[var(--aws-text-muted)]">
              <path d="M6 8L1 3h10L6 8z" />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-[var(--aws-error)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--aws-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
