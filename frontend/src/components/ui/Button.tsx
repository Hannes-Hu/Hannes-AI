import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-sm shadow-brand-900/30",
    ghost:
      "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-slate-700",
    danger:
      "bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-800/50",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 h-7",
    md: "text-sm px-4 py-2 h-9",
    lg: "text-base px-5 py-2.5 h-11",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled ?? isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" />
          <span>Laden…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ── Spinner (auch standalone exportiert) ─────────────────────────────────────

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" };
  return (
    <svg
      className={cn("animate-spin text-current", sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
