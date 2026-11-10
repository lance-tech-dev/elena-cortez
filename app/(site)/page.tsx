import Image from "next/image";
import { MapPin } from "lucide-react";
import {
  ExperienceRows,
  ProjectGrid,
  SectionHeading,
  SkillChips,
  TextLink,
} from "@/components/sections";
import { getPublishedProjects } from "@/lib/projects";
import { getSkillGroups } from "@/lib/skills";
import { getExperience } from "@/lib/experience";
import { toRow } from "@/lib/experience-format";
import { bioParagraphs, getProfile, initials } from "@/lib/profile";

export default async function Page() {
  const [site, { items: experience }, { groups: skillGroups }, projects] = await Promise.all([
    getProfile(),
    getExperience(),
    getSkillGroups(),
    getPublishedProjects(),
  ]);
  const topSkills = skillGroups.flatMap((g) => g.items).slice(0, 12);

  return (
    <div className="space-y-16">
      {/* Intro */}
      <section className="animate-fade-up space-y-10 border-b border-border pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span>{site.status}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span>{site.location}</span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
          {/* Photo — managed in Admin → Profile. Initials until one is uploaded. */}
          <div className="mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[180px] lg:w-[220px]">
            <div className="relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-md border border-border bg-surface-secondary">
              {site.avatarUrl ? (
                <Image
                  src={site.avatarUrl}
                  alt={site.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 180px, 160px"
                  className="object-cover"
                />
              ) : (
                <>
                  <div aria-hidden className="gradient-bg absolute inset-0 opacity-15" />
                  <span className="gradient-text relative text-5xl font-black tracking-tighter">
                    {initials(site.name)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{site.name}</h1>
              <p className="text-sm text-muted">{site.role}</p>
            </div>

            <div className="max-w-xl space-y-4 text-sm leading-relaxed text-muted">
              {bioParagraphs(site.bio).map((p) => (
                <p key={p}>{p}</p>
              ))}
              {site.tagline && <p className="font-medium text-foreground">{site.tagline}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <TextLink href={`mailto:${site.email}`}>email</TextLink>
              <TextLink href="/about">about</TextLink>
              <TextLink href="/contact">contact</TextLink>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading index={1} title="Projects" href="/projects" linkLabel="All projects" />
        <ProjectGrid projects={projects.slice(0, 3)} />
      </section>

      <section className="space-y-6">
        <SectionHeading index={2} title="Experience" href="/experience" linkLabel="Full history" />
        <ExperienceRows items={experience.slice(0, 4).map(toRow)} />
      </section>

      <section className="space-y-6">
        <SectionHeading index={3} title="Skills" href="/skills" />
        <SkillChips items={topSkills} moreHref="/skills" />
      </section>
    </div>
  );
}
