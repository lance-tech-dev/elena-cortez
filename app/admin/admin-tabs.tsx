"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Briefcase, FolderKanban, Settings, Sparkles, UserRound } from "lucide-react";

export const adminTabs = [
  { name: "Profile", href: "/admin/profile", icon: UserRound },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Experience", href: "/admin/experience", icon: Briefcase },
  { name: "Skills", href: "/admin/skills", icon: Sparkles },
  { name: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminTabs() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On narrow screens the tab row scrolls; keep the active tab in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <div className="content-container">
        <ul className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {adminTabs.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href} className="shrink-0">
                <Link
                  ref={active ? activeRef : undefined}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2 px-3 py-3 text-xs transition-colors ${
                    active ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {name}
                  {active && <span aria-hidden className="gradient-bg absolute inset-x-2 bottom-0 h-0.5 rounded-full" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
