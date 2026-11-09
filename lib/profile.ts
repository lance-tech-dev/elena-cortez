import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { site } from "@/lib/site";

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  bio: string; // paragraphs separated by a blank line
  status: string;
  location: string;
  email: string;
  avatarUrl: string | null;
  avatarKey: string | null;
  avatarOriginalKey: string | null;
  /** "fallback" when the profile table is missing or unreachable. */
  source: "database" | "fallback";
};

export const PROFILE_TAG = "profile";

/** Used until the profile table exists, or if Supabase can't be reached. */
const fallback: Profile = {
  name: site.name,
  role: site.role,
  tagline: site.tagline,
  bio: site.bio.join("\n\n"),
  status: site.status,
  location: site.location,
  email: site.email,
  avatarUrl: null,
  avatarKey: null,
  avatarOriginalKey: null,
  source: "fallback",
};

/**
 * The public profile. Cached and part of the static pages; saving in the
 * admin calls updateTag(PROFILE_TAG) so changes show up right away.
 */
export async function getProfile(): Promise<Profile> {
  "use cache";
  cacheTag(PROFILE_TAG);

  // No cookies: this is the public, anonymous read. RLS allows select for anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn(`[profile] using fallback: ${error.message}`);
    cacheLife("minutes"); // retry soon rather than caching the fallback for days
    return fallback;
  }

  cacheLife("days");
  return {
    name: data.name,
    role: data.role,
    tagline: data.tagline,
    bio: data.bio,
    status: data.status,
    location: data.location,
    email: data.email,
    avatarUrl: data.avatar_url,
    avatarKey: data.avatar_key,
    avatarOriginalKey: data.avatar_original_key,
    source: "database",
  };
}

/** Splits the bio into paragraphs on blank lines. */
export function bioParagraphs(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** "Elena Cortez" → "EC". Used when there's no photo. */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}
