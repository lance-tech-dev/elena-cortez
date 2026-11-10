import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { experience as fallbackItems } from "@/lib/site";
import type { Experience } from "@/lib/experience-format";

export const EXPERIENCE_TAG = "experience";

export type ExperienceList = {
  items: Experience[];
  /** "fallback" when the experience table is missing or unreachable. */
  source: "database" | "fallback";
};

/**
 * Experience entries, newest first. Cached; the admin actions call
 * updateTag(EXPERIENCE_TAG) so changes show up right away.
 */
export async function getExperience(): Promise<ExperienceList> {
  "use cache";
  cacheTag(EXPERIENCE_TAG);

  // Public, anonymous read. RLS allows select for anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("experience")
    .select("*")
    .order("start_year", { ascending: false })
    .order("start_month", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.warn(`[experience] using fallback: ${error.message}`);
    cacheLife("minutes");
    return { items: fallbackItems, source: "fallback" };
  }

  cacheLife("days");
  return {
    items: data.map((row) => ({
      id: row.id,
      title: row.title,
      org: row.org,
      location: row.location,
      startYear: row.start_year,
      startMonth: row.start_month,
      endYear: row.end_year,
      endMonth: row.end_month,
      description: row.description,
    })),
    source: "database",
  };
}
