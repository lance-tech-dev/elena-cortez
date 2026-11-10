import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { skillGroups as fallbackGroups } from "@/lib/site";

export type SkillGroup = {
  id: string;
  title: string;
  items: string[]; // skills, in display order
};

export const SKILLS_TAG = "skills";

export type SkillGroupList = {
  groups: SkillGroup[];
  /** "fallback" when the skill_group table is missing or unreachable. */
  source: "database" | "fallback";
};

/**
 * Skill groups in display order. Cached; the admin actions call
 * updateTag(SKILLS_TAG) so changes show up right away.
 */
export async function getSkillGroups(): Promise<SkillGroupList> {
  "use cache";
  cacheTag(SKILLS_TAG);

  // Public, anonymous read. RLS allows select for anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("skill_group")
    .select("id, title, skills")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.warn(`[skills] using fallback: ${error.message}`);
    cacheLife("minutes");
    return { groups: fallbackGroups, source: "fallback" };
  }

  cacheLife("days");
  return {
    groups: data.map((row) => ({ id: row.id, title: row.title, items: row.skills ?? [] })),
    source: "database",
  };
}
