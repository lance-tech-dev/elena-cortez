"use client";

import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const REVEAL_DURATION = 700;
const FADE_DURATION = 500;

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme } = useTheme();

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const next: Theme = root.classList.contains("dark") ? "light" : "dark";

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setTheme(next);
      return;
    }

    // Fallback: soft crossfade for browsers without View Transitions.
    if (typeof document.startViewTransition !== "function") {
      root.classList.add("theme-fade");
      setTheme(next);
      window.setTimeout(
        () => root.classList.remove("theme-fade"),
        FADE_DURATION + 50,
      );
      return;
    }

    // Circular reveal that grows out of the center of the button.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    root.classList.add("theme-switching");

    const transition = document.startViewTransition(() => {
      // Apply the class synchronously so the "new" snapshot is correct,
      // then sync next-themes state (and localStorage).
      applyThemeClass(next);
      flushSync(() => setTheme(next));
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: REVEAL_DURATION,
            easing: "cubic-bezier(0.76, 0, 0.24, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});

    transition.finished.finally(() => {
      root.classList.remove("theme-switching");
    });
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle theme"
      className={`group relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface/60 text-foreground transition-colors duration-300 hover:border-primary hover:text-primary ${className}`}
    >
      {/* Icons are swapped purely with the `dark:` variant, so the server
          and client always render the same markup (no hydration flash). */}
      <Sun
        size={18}
        aria-hidden
        className="absolute rotate-90 scale-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
      <Moon
        size={18}
        aria-hidden
        className="absolute rotate-0 scale-100 opacity-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:-rotate-90 dark:scale-0 dark:opacity-0"
      />
    </button>
  );
}
