import type { Metadata } from "next";
import { PageIntro, SectionHeading, TextLink } from "@/components/sections";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

// PLACEHOLDER values
const values = [
  { title: "Reliability", text: "Systems should just work. I build and document things so they keep working." },
  { title: "Clarity", text: "I explain technical issues in plain language so everyone stays on the same page." },
  { title: "Curiosity", text: "Always learning — new tools, certifications, and better ways to solve problems." },
];

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <PageIntro title="About" description={site.role} />

      <section className="max-w-xl space-y-4 text-sm leading-relaxed text-muted">
        {site.bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="font-medium text-foreground">{site.tagline}</p>
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

      <div className="flex flex-wrap gap-4 text-xs">
        <TextLink href="/projects">see projects</TextLink>
        <TextLink href="/contact">get in touch</TextLink>
      </div>
    </div>
  );
}
