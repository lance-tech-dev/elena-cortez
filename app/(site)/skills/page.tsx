import type { Metadata } from "next";
import { PageIntro, SectionHeading, SkillChips } from "@/components/sections";
import { skillGroups } from "@/lib/site";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsPage() {
  return (
    <div className="space-y-16">
      <PageIntro
        title="Skills"
        description="The technologies and tools I work with day to day."
      />

      {skillGroups.map((group, i) => (
        <section key={group.title} className="space-y-6">
          <SectionHeading index={i + 1} title={group.title} />
          <SkillChips items={group.items} />
        </section>
      ))}
    </div>
  );
}
