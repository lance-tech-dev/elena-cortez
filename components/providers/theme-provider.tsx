"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

// Transitions are NOT disabled here on purpose: <ThemeToggle /> drives the
// theme animation itself (View Transitions reveal, or a crossfade fallback).
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
