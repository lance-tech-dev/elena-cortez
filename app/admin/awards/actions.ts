"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AWARDS_TAG } from "@/lib/awards";
import { AWARD_LIMITS, MAX_YEAR, MIN_YEAR, type AwardField, type AwardValues } from "./fields";

export type SaveState =
  | { ok: true; message: string; savedAt: number }
  | { ok: false; message: string; values: AwardValues; errors?: Partial<Record<AwardField, string>> }
  | undefined;

export type ActionResult = { ok: true } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const oneLine = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Creates an award, or updates one when the form has an `id`. */
export async function saveAward(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const values: AwardValues = {
    title: oneLine(formData.get("title")),
    org: oneLine(formData.get("org")),
    year: oneLine(formData.get("year")),
    description: oneLine(formData.get("description")),
  };
  if (id && !UUID.test(id)) return { ok: false, message: "Unknown award.", values };

  const errors: Partial<Record<AwardField, string>> = {};
  for (const field of Object.keys(AWARD_LIMITS) as (keyof typeof AWARD_LIMITS)[]) {
    if (values[field].length > AWARD_LIMITS[field]) errors[field] = `Keep it under ${AWARD_LIMITS[field]} characters.`;
  }
  if (!values.title) errors.title = "Title is required.";

  const year = Number(values.year);
  if (!values.year) errors.year = "Year is required.";
  else if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    errors.year = `Enter a year from ${MIN_YEAR} to ${MAX_YEAR}.`;
  }

  if (Object.keys(errors).length) return { ok: false, message: "Fix the highlighted fields.", errors, values };

  const row = { ...values, year, updated_at: new Date().toISOString() };
  const supabase = await createClient();

  let result;
  if (id) {
    result = await supabase.from("award").update(row).eq("id", id).select("id");
  } else {
    // New awards go last within their year.
    const { data: last } = await supabase
      .from("award")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    result = await supabase
      .from("award")
      .insert({ ...row, position: (last?.position ?? 0) + 1 })
      .select("id");
  }

  // RLS turns a blocked update into "0 rows", not an error, so check both.
  if (result.error || !result.data?.length) {
    console.error("[awards] save failed", result.error);
    return { ok: false, message: "Couldn't save. Has the award table been created?", values };
  }

  updateTag(AWARDS_TAG);
  return { ok: true, message: id ? "Award updated." : "Award added.", savedAt: Date.now() };
}

export async function deleteAward(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Unknown award." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("award").delete().eq("id", id).select("id");

  if (error || !data?.length) {
    console.error("[awards] delete failed", error);
    return { ok: false, message: "Couldn't delete that award." };
  }

  updateTag(AWARDS_TAG);
  return { ok: true };
}

/** Saves the order: `ids` is every award, top to bottom. Years still sort first. */
export async function reorderAwards(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 200 || !ids.every((id) => UUID.test(id))) {
    return { ok: false, message: "Unknown award." };
  }

  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("award").update({ position: i + 1 }).eq("id", id).select("id")),
  );

  updateTag(AWARDS_TAG);
  if (results.some((r) => r.error || !r.data?.length)) {
    console.error("[awards] reorder failed", results.find((r) => r.error)?.error);
    return { ok: false, message: "Couldn't save the new order." };
  }
  return { ok: true };
}
