"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SKILLS_TAG } from "@/lib/skills";
import { SKILL_LIMITS } from "./fields";

export type SaveInput = { id?: string; title: string; skills: string[] };

export type SaveResult =
  | { ok: true; message: string }
  | { ok: false; message: string; errors?: { title?: string; skills?: string } };

export type ActionResult = { ok: true } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const oneLine = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Creates a group, or updates one when `id` is set. */
export async function saveSkillGroup(input: SaveInput): Promise<SaveResult> {
  await requireAdmin();

  const id = input.id ?? "";
  if (id && !UUID.test(id)) return { ok: false, message: "Unknown group." };

  const title = oneLine(input.title);
  // Trim, drop blanks and case-insensitive duplicates, keep the order given.
  const seen = new Set<string>();
  const skills = (Array.isArray(input.skills) ? input.skills : [])
    .map(oneLine)
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));

  const errors: { title?: string; skills?: string } = {};
  if (!title) errors.title = "Group name is required.";
  else if (title.length > SKILL_LIMITS.title) errors.title = `Keep it under ${SKILL_LIMITS.title} characters.`;
  if (skills.length === 0) errors.skills = "Add at least one skill.";
  else if (skills.length > SKILL_LIMITS.skills) errors.skills = `Up to ${SKILL_LIMITS.skills} skills per group.`;
  else if (skills.some((s) => s.length > SKILL_LIMITS.skill)) {
    errors.skills = `Each skill must be under ${SKILL_LIMITS.skill} characters.`;
  }
  if (Object.keys(errors).length) return { ok: false, message: "Fix the highlighted fields.", errors };

  const supabase = await createClient();
  const now = new Date().toISOString();

  let result;
  if (id) {
    result = await supabase.from("skill_group").update({ title, skills, updated_at: now }).eq("id", id).select("id");
  } else {
    // New groups go to the end.
    const { data: last } = await supabase
      .from("skill_group")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    result = await supabase
      .from("skill_group")
      .insert({ title, skills, position: (last?.position ?? 0) + 1, updated_at: now })
      .select("id");
  }

  // RLS turns a blocked update into "0 rows", not an error, so check both.
  if (result.error || !result.data?.length) {
    console.error("[skills] save failed", result.error);
    return { ok: false, message: "Couldn't save. Has the skill_group table been created?" };
  }

  updateTag(SKILLS_TAG);
  return { ok: true, message: id ? "Group updated." : "Group added." };
}

export async function deleteSkillGroup(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Unknown group." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("skill_group").delete().eq("id", id).select("id");

  if (error || !data?.length) {
    console.error("[skills] delete failed", error);
    return { ok: false, message: "Couldn't delete that group." };
  }

  updateTag(SKILLS_TAG);
  return { ok: true };
}

/** Saves the group order: `ids` is every group, top to bottom. */
export async function reorderSkillGroups(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 100 || !ids.every((id) => UUID.test(id))) {
    return { ok: false, message: "Unknown group." };
  }

  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("skill_group").update({ position: i + 1 }).eq("id", id).select("id")),
  );

  if (results.some((r) => r.error || !r.data?.length)) {
    console.error("[skills] reorder failed", results.find((r) => r.error)?.error);
    updateTag(SKILLS_TAG);
    return { ok: false, message: "Couldn't save the new order." };
  }

  updateTag(SKILLS_TAG);
  return { ok: true };
}
