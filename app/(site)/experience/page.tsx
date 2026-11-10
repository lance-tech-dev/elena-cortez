import type { Metadata } from "next";
import { ExperienceRows, PageIntro } from "@/components/sections";
import { getExperience } from "@/lib/experience";
import { toRow } from "@/lib/experience-format";

export const metadata: Metadata = { title: "Experience" };

export default async function ExperiencePage() {
  const { items } = await getExperience();

  return (
    <div className="space-y-16">
      <PageIntro
        title="Experience"
        description="Teaching, public service, internships and freelance work, plus the degree that started it."
      />
      <ExperienceRows items={items.map(toRow)} detailed />
    </div>
  );
}
