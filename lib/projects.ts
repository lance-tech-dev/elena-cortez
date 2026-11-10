import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { projects as fallbackProjects, type Project } from "@/lib/site";

export const PROJECTS_TAG = "projects";

export type ProjectList = {
  /** Every project, hidden ones included; public pages filter on `published`. */
  projects: Project[];
  /** "fallback" when the project table is missing or unreachable. */
  source: "database" | "fallback";
};

/**
 * Projects in display order. Cached; the admin actions call
 * updateTag(PROJECTS_TAG) so changes show up right away.
 */
export async function getProjects(): Promise<ProjectList> {
  "use cache";
  cacheTag(PROJECTS_TAG);

  // Public, anonymous read. RLS allows select for anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("project")
    .select("id, title, description, tags, live_url, image_url, published")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.warn(`[projects] using fallback: ${error.message}`);
    cacheLife("minutes");
    return { projects: fallbackProjects, source: "fallback" };
  }

  cacheLife("days");
  return {
    projects: data.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      tags: row.tags ?? [],
      href: row.live_url || undefined,
      image: row.image_url || undefined,
      published: row.published,
    })),
    source: "database",
  };
}

/** Only the projects visitors should see. */
export async function getPublishedProjects(): Promise<Project[]> {
  const { projects } = await getProjects();
  return projects.filter((p) => p.published);
}
