import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { awards as fallbackAwards } from "@/lib/site";

export type Award = {
  id: string;
  title: string;
  org: string;
  year: number;
  description: string;
};

export const AWARDS_TAG = "awards";

export type AwardList = {
  awards: Award[];
  /** "fallback" when the award table is missing or unreachable. */
  source: "database" | "fallback";
};

/**
 * Awards, newest year first, then in the order set in the admin. Cached;
 * the admin actions call updateTag(AWARDS_TAG) so changes show up right away.
 */
export async function getAwards(): Promise<AwardList> {
  "use cache";
  cacheTag(AWARDS_TAG);

  // Public, anonymous read. RLS allows select for anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("award")
    .select("id, title, org, year, description")
    .order("year", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.warn(`[awards] using fallback: ${error.message}`);
    cacheLife("minutes");
    return { awards: fallbackAwards, source: "fallback" };
  }

  cacheLife("days");
  return { awards: data, source: "database" };
}

/** Shape used by <ExperienceRows>. */
export function awardRow(a: Award) {
  return { year: String(a.year), title: a.title, org: a.org, description: a.description || undefined };
}
