import type { Metadata } from "next";
import { PageIntro, SectionHeading, SkillChips } from "@/components/sections";
import { getSkillGroups } from "@/lib/skills";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const { groups } = await getSkillGroups();
  return (
    <div className="space-y-16">
      <PageIntro
        title="Skills"
        description="The technologies and tools I work with day to day."
      />

      {groups.map((group, i) => (
        <section key={group.id} className="space-y-6">
          <SectionHeading index={i + 1} title={group.title} />
          <SkillChips items={group.items} />
        </section>
      ))}
    </div>
  );
}
