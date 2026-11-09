import type { Metadata } from "next";
import { ExperienceRows, PageIntro } from "@/components/sections";
import { experience } from "@/lib/site";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return (
    <div className="space-y-16">
      <PageIntro
        title="Experience"
        description="Roles, education, and certifications along the way."
      />
      <ExperienceRows items={experience} detailed />
    </div>
  );
}
