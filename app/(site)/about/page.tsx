import type { Metadata } from "next";
import { ExperienceRows, PageIntro, SectionHeading, TextLink } from "@/components/sections";
import { awards, trainings } from "@/lib/site";
import { bioParagraphs, getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "About" };

// Drawn from the strengths in Elena's CV.
const values = [
  { title: "Detail-oriented", text: "Accurate records, clean documentation, and work that holds up when someone else picks it up." },
  { title: "Always learning", text: "A fast learner who looks for new challenges, from security seminars to ISO 9001 to the classroom." },
  { title: "Work ethic", text: "Reliable and on schedule, whether it's a procurement file, a class, or a client's event." },
];

export default async function AboutPage() {
  const site = await getProfile();
  return (
    <div className="space-y-16">
      <PageIntro title="About" description={site.role} />

      <section className="max-w-xl space-y-4 text-sm leading-relaxed text-muted">
        {bioParagraphs(site.bio).map((p) => (
          <p key={p}>{p}</p>
        ))}
        {site.tagline && <p className="font-medium text-foreground">{site.tagline}</p>}
      </section>

      <section className="space-y-6">
        <SectionHeading index={1} title="What I value" />
        <div>
          {values.map((v) => (
            <div
              key={v.title}
              className="flex flex-col gap-1 border-b border-border py-3.5 text-sm last:border-b-0 sm:flex-row sm:gap-6"
            >
              <span className="w-32 shrink-0 font-bold">{v.title}</span>
              <span className="text-xs leading-relaxed text-muted sm:text-sm">{v.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading index={2} title="Recognition" />
        <ExperienceRows items={awards} />
      </section>

      <section className="space-y-6">
        <SectionHeading index={3} title="Trainings & seminars" />
        <ExperienceRows items={trainings} detailed />
      </section>

      <div className="flex flex-wrap gap-4 text-xs">
        <TextLink href="/projects">see projects</TextLink>
        <TextLink href="/contact">get in touch</TextLink>
      </div>
    </div>
  );
}
