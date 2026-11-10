"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Briefcase, FolderKanban, ScrollText, Sparkles, Trophy, UserRound } from "lucide-react";

export const adminTabs = [
  { name: "Profile", href: "/admin/profile", icon: UserRound },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Experience", href: "/admin/experience", icon: Briefcase },
  { name: "Certificates", href: "/admin/certificates", icon: ScrollText },
  { name: "Awards", href: "/admin/awards", icon: Trophy },
  { name: "Skills", href: "/admin/skills", icon: Sparkles },
] as const;

export function AdminTabs() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // On narrow screens the tab row scrolls sideways; center the active tab.
  // Scrolls only the tab row: scrollIntoView() would also move the page,
  // fighting the scroll-to-top that happens on navigation.
  useEffect(() => {
    const list = listRef.current;
    const tab = activeRef.current;
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "instant" });
  }, [pathname]);

  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <div className="content-container">
        <ul ref={listRef} className="relative -mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
