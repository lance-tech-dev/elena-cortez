import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminTabs } from "./admin-tabs";
import { logout } from "./actions";
import { SessionTimeout } from "./session-timeout";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

const iconBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col font-mono">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur">
        <div className="content-container flex h-14 items-center justify-between gap-3">
          <Link href="/admin/profile" className="gradient-text text-xs font-bold uppercase tracking-widest">
            Admin
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className={iconBtn} aria-label="Sign out">
                <LogOut size={12} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
        <AdminTabs />
      </header>
      <main className="content-container flex-1 py-8 sm:py-10">{children}</main>
      <SessionTimeout />
    </div>
  );
}

