import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/site";

/** "01 — PROJECTS" style heading with an optional "VIEW ALL →" link. */
export function SectionHeading({
  index,
  title,
  href,
  linkLabel = "View all",
}: {
  index?: number;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pb-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        {index !== undefined && `${String(index).padStart(2, "0")} — `}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[10px] font-semibold uppercase tracking-wider text-muted transition-colors hover:text-primary"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/** Intro block used at the top of inner pages. */
export function PageIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="animate-fade-up space-y-3 border-b border-border pb-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && (
        <p className="max-w-xl text-sm leading-relaxed text-muted">{description}</p>
      )}
    </section>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-4 transition-colors duration-300 hover:border-primary/50">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-secondary">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div aria-hidden className="gradient-bg absolute inset-0 opacity-10" />
            <span className="relative text-xs text-muted">[ preview ]</span>
          </div>
        )}
      </div>

      <div className="my-3 space-y-1.5">
        <h3 className="truncate text-sm font-bold tracking-wide">{project.title}</h3>
        <p className="text-xs leading-relaxed text-muted">{project.description}</p>
      </div>

      <div className="mt-auto space-y-3">
        <ul className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
        {project.href && (
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-bg flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Live Preview
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
    </article>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.title} project={p} />
      ))}
    </div>
  );
}

export function ExperienceRows({
  items,
  detailed = false,
}: {
  items: { year: string; title: string; org: string; description?: string }[];
  detailed?: boolean;
}) {
  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          className="border-b border-border py-3.5 text-sm last:border-b-0"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="w-12 shrink-0 text-xs text-muted">{item.year}</span>
            <span className="min-w-0 flex-1 truncate font-bold">{item.title}</span>
            <span className="shrink-0 text-right text-xs text-muted">{item.org}</span>
          </div>
          {detailed && item.description && (
            <p className="mt-2 pl-16 text-xs leading-relaxed text-muted">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function SkillChips({ items, moreHref }: { items: string[]; moreHref?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md border border-border px-3.5 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
        >
          {item}
        </span>
      ))}
      {moreHref && (
        <Link
          href={moreHref}
          className="rounded-md border border-dashed border-border px-3.5 py-2 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
        >
          + more
        </Link>
      )}
    </div>
  );
}

/** Underlined mono text link, like "github ↗". */
export function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "group inline-flex items-center gap-1 underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary";
  const icon = (
    <ArrowUpRight
      size={12}
      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
    />
  );

  if (external || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span>{children}</span>
        {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <span>{children}</span>
      {icon}
    </Link>
  );
}
