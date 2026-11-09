import type { Metadata } from "next";
import { ExperienceRows, PageIntro } from "@/components/sections";
import { experience } from "@/lib/site";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return (
    <div className="space-y-16">
      <PageIntro
        title="Experience"
        description="Teaching, public service, internships and freelance work, plus the degree that started it."
      />
      <ExperienceRows items={experience} detailed />
    </div>
  );
}
