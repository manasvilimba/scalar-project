"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none rounded-[var(--radius-sm)]";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--aws-orange)] text-[#111] hover:bg-[var(--aws-orange-dark)] focus-visible:ring-[var(--aws-orange)] shadow-sm",
  secondary:
    "bg-[var(--aws-surface)] text-[var(--aws-text)] border border-[var(--aws-border)] hover:bg-[var(--aws-surface-hover)] focus-visible:ring-[var(--aws-blue)]",
  danger:
    "bg-[var(--aws-error)] text-white hover:opacity-90 focus-visible:ring-[var(--aws-error)] shadow-sm",
  ghost:
    "bg-transparent text-[var(--aws-text)] hover:bg-[var(--aws-surface-hover)] focus-visible:ring-[var(--aws-blue)]",
  link:
    "bg-transparent text-[var(--aws-text-link)] hover:underline p-0 h-auto focus-visible:ring-[var(--aws-blue)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-8 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "md", loading, icon, children, className = "", disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading ? <Spinner size={14} /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
