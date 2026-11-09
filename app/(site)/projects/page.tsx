import type { Metadata } from "next";
import { PageIntro, ProjectGrid } from "@/components/sections";
import { projects } from "@/lib/site";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="space-y-16">
      <PageIntro
        title="Projects"
        description="A few projects that show how I approach problems."
      />
      <ProjectGrid projects={projects} />
    </div>
  );
}
