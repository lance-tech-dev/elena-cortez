"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/lib/session";
import { expireSession, keepAlive } from "./actions";

// Shared across admin tabs, so activity in one tab keeps the others signed in.
const STORAGE_KEY = "admin:lastActivity";
// Tell the server about activity at most this often.
const PING_EVERY_MS = 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

function readShared(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeShared(time: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(time));
  } catch {
    // Private mode etc.: this tab still keeps its own clock.
  }
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Signs the admin out after 30 minutes without activity, with a warning and
 * a "Stay signed in" button 2 minutes before. proxy.ts enforces the same
 * limit on the server, so closing the tab doesn't keep a session alive.
 */
export function SessionTimeout() {
  const pathname = usePathname();
  const lastActivity = useRef(0);
  const lastPing = useRef(0);
  const expiring = useRef(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const expire = useCallback(async () => {
    if (expiring.current) return;
    expiring.current = true;
    try {
      await expireSession();
    } finally {
      const params = new URLSearchParams({ reason: "expired", next: pathname });
      // Full page load, so nothing from the admin stays in the client cache.
      window.location.assign(`/login?${params}`);
    }
  }, [pathname]);

  const markActive = useCallback(() => {
    if (expiring.current) return;
    const now = Date.now();
    // Activity after the deadline (e.g. waking a sleeping laptop) doesn't count.
    if (now - Math.max(lastActivity.current, readShared()) >= IDLE_TIMEOUT_MS) {
      void expire();
      return;
    }
    lastActivity.current = now;
    writeShared(now);
    if (now - lastPing.current >= PING_EVERY_MS) {
      lastPing.current = now;
      keepAlive().catch(() => {});
    }
  }, [expire]);

  useEffect(() => {
    const now = Date.now();
    lastActivity.current = now;
    lastPing.current = now; // loading this page was a request
    writeShared(now);

    const check = () => {
      if (expiring.current) return;
      const idle = Date.now() - Math.max(lastActivity.current, readShared());
      if (idle >= IDLE_TIMEOUT_MS) void expire();
      else if (idle >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) setRemaining(IDLE_TIMEOUT_MS - idle);
      else setRemaining(null);
    };

    const onActivity = () => {
      // While the warning is up, only the button keeps the session.
      if (document.querySelector("[data-session-warning]")) return;
      markActive();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(timer);
    };
  }, [expire, markActive]);

  if (remaining === null) return null;

  return (
    <div
      data-session-warning
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-text"
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-surface p-6 font-mono shadow-xl">
        <div className="space-y-2">
          <p id="session-warning-title" className="flex items-center gap-2 text-sm font-bold">
            <Clock size={14} className="text-primary" /> Still there?
          </p>
          <p id="session-warning-text" className="text-xs leading-relaxed text-muted">
            You&apos;ll be signed out in{" "}
            <span className="font-semibold text-foreground tabular-nums">{formatRemaining(remaining)}</span> because
            of inactivity. Unsaved changes will be lost.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void expire()}
            className="rounded-xl border border-border px-4 py-2.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
          >
            Sign out
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => {
              lastPing.current = 0; // tell the server right away
              markActive();
              setRemaining(null);
            }}
            className="gradient-bg rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
