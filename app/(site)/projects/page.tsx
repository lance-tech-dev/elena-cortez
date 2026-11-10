import type { Metadata } from "next";
import { PageIntro, ProjectGrid } from "@/components/sections";
import { getPublishedProjects } from "@/lib/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
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
