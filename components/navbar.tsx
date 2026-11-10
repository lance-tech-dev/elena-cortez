"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { navLinks } from "@/lib/site";

export function Navbar({
  name,
  email,
  monogram,
}: {
  name: string;
  email: string;
  monogram: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the drawer whenever the route changes.
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Header gets a stronger background once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While open: lock page scroll, close on Escape, close when resized to desktop.
  useEffect(() => {
    if (!menuOpen) return;

    // No scrollbar-width padding needed: html has scrollbar-gutter: stable
    // (globals.css), so hiding the scrollbar doesn't change the page width.
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled || menuOpen
            ? "border-border bg-background/80 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            : "border-transparent bg-background/40 backdrop-blur-md"
        }`}
      >
        <nav
          aria-label="Main"
          className="section-container flex h-20 items-center justify-between"
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label={`${name} — home`}
            className="group flex items-center"
          >
            <span className="gradient-text text-3xl font-black tracking-tighter transition-transform duration-300 group-hover:-rotate-6">
              {monogram}
            </span>
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      active ? "text-primary" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {link.name}
                    <span
                      aria-hidden
                      className={`gradient-bg absolute inset-x-4 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300 ease-[var(--ease-out-expo)] ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/contact"
              className="gradient-bg hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-transform duration-300 hover:scale-105 lg:flex"
            >
              Let&apos;s Talk
              <ArrowUpRight size={16} />
            </Link>

            <HamburgerButton
              open={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            />
          </div>
        </nav>
      </header>

      {/* Mobile drawer — rendered outside <header> because the header's
          backdrop-filter would otherwise trap `position: fixed` children. */}
      <div
        aria-hidden
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="mobile-menu"
        aria-label="Mobile navigation"
        inert={!menuOpen}
        className={`fixed inset-y-0 right-0 z-45 flex w-[min(86vw,380px)] flex-col border-l border-border bg-background/95 pt-20 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ease-[var(--ease-drawer)] lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <nav className="relative flex flex-1 flex-col overflow-y-auto px-6 py-6">
          <p
            className={`mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-all duration-500 ${
              menuOpen ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
            }`}
            style={{ transitionDelay: menuOpen ? "80ms" : "0ms" }}
          >
            Navigation
          </p>

          <ul className="flex flex-col gap-1">
            {navLinks.map((link, i) => {
              const active = isActive(link.href);
              return (
                <li
                  key={link.href}
                  className={`transition-all duration-500 ease-[var(--ease-out-expo)] ${
                    menuOpen ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
                  }`}
                  style={{ transitionDelay: menuOpen ? `${120 + i * 55}ms` : "0ms" }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold transition-colors ${
                      active
                        ? "bg-surface-secondary text-primary"
                        : "text-foreground hover:bg-surface-secondary"
                    }`}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {link.name}
                    </span>
                    <ArrowUpRight
                      size={18}
                      className={`transition-all duration-300 ${
                        active
                          ? "opacity-100"
                          : "-translate-x-1 translate-y-1 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div
            className={`mt-auto space-y-4 pt-8 transition-all duration-500 ease-[var(--ease-out-expo)] ${
              menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: menuOpen ? `${140 + navLinks.length * 55}ms` : "0ms" }}
          >
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="gradient-bg flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
            >
              Let&apos;s Talk
              <ArrowUpRight size={16} />
            </Link>
            <a
              href={`mailto:${email}`}
              className="flex items-center justify-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              <Mail size={14} />
              {email}
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
}

function HamburgerButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  const line =
    "absolute left-1/2 h-[2px] w-[18px] -translate-x-1/2 rounded-full bg-current transition-all duration-500 ease-[var(--ease-out-expo)]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="mobile-menu"
      className={`relative h-10 w-10 shrink-0 rounded-full border transition-colors duration-300 lg:hidden ${
        open
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-surface/60 text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <span
        aria-hidden
        className={`${line} ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[12px]"}`}
      />
      <span
        aria-hidden
        className={`${line} top-1/2 -translate-y-1/2 ${open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`}
      />
      <span
        aria-hidden
        className={`${line} ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[24px]"}`}
      />
    </button>
  );
}
