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
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 active:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 shadow-sm",
    ghost:
      "bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:border-zinc-800",
    danger:
      "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 dark:border-red-900",
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

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = {
    sm: "h-3.5 w-3.5 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      role="status"
      aria-label="Wird geladen"
      className={cn(
        "rounded-full border-current border-t-transparent animate-spin",
        sizes[size],
        className
      )}
    />
  );
}
