"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("hannes-theme") as "dark" | "light" | null;
    const initial = stored ?? "dark";
    setTheme(initial);

    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hannes-theme", next);

    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className={cn("w-8 h-8 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50", className)} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "p-1.5 rounded-lg border transition-colors duration-150",
        "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700",
        "dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300",
        className
      )}
      aria-label={theme === "dark" ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      title={theme === "dark" ? "Heller Modus" : "Dunkler Modus"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-zinc-300" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700" aria-hidden="true" />
      )}
    </button>
  );
}
