"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EXPERIENCE_TAG } from "@/lib/experience";
import { EXPERIENCE_LIMITS, MAX_YEAR, MIN_YEAR, type ExperienceField, type ExperienceValues } from "./fields";

export type SaveState =
  | { ok: true; message: string; savedAt: number }
  | { ok: false; message: string; values: ExperienceValues; errors?: Partial<Record<ExperienceField, string>> }
  | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const oneLine = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\s+/g, " ").trim();

function parseYear(raw: string): number | null | undefined {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= MIN_YEAR && n <= MAX_YEAR ? n : undefined;
}

function parseMonth(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/** Creates an entry, or updates one when the form has an `id`. */
export async function saveExperience(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (id && !UUID.test(id)) return { ok: false, message: "Unknown entry.", values: emptyValues() };

  const current = formData.get("current") === "on";
  const values: ExperienceValues = {
    title: oneLine(formData.get("title")),
    org: oneLine(formData.get("org")),
    location: oneLine(formData.get("location")),
    // Keep line breaks in the description.
    description: String(formData.get("description") ?? "").replace(/\r\n/g, "\n").trim(),
    startMonth: oneLine(formData.get("startMonth")),
    startYear: oneLine(formData.get("startYear")),
    endMonth: current ? "" : oneLine(formData.get("endMonth")),
    endYear: current ? "" : oneLine(formData.get("endYear")),
    current,
  };

  const errors: Partial<Record<ExperienceField, string>> = {};
  for (const field of Object.keys(EXPERIENCE_LIMITS) as (keyof typeof EXPERIENCE_LIMITS)[]) {
    if (values[field].length > EXPERIENCE_LIMITS[field]) {
      errors[field] = `Keep it under ${EXPERIENCE_LIMITS[field]} characters.`;
    }
  }
  if (!values.title) errors.title = "Job title is required.";

  const startYear = parseYear(values.startYear);
  const endYear = parseYear(values.endYear);
  const startMonth = startYear ? parseMonth(values.startMonth) : null;
  const endMonth = endYear ? parseMonth(values.endMonth) : null;

  if (startYear === null) errors.startYear = "Start year is required.";
  else if (startYear === undefined) errors.startYear = `Enter a year from ${MIN_YEAR} to ${MAX_YEAR}.`;

  if (!current) {
    if (endYear === null) errors.endYear = "Add an end year, or tick “I still work here”.";
    else if (endYear === undefined) errors.endYear = `Enter a year from ${MIN_YEAR} to ${MAX_YEAR}.`;
    else if (startYear && (endYear < startYear || (endYear === startYear && startMonth && endMonth && endMonth < startMonth))) {
      errors.endYear = "End date is before the start date.";
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, message: "Fix the highlighted fields.", errors, values };
  }

  const row = {
    title: values.title,
    org: values.org,
    location: values.location,
    description: values.description,
    start_year: startYear,
    start_month: startMonth,
    end_year: current ? null : endYear,
    end_month: current ? null : endMonth,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const query = id
    ? supabase.from("experience").update(row).eq("id", id).select("id")
    : supabase.from("experience").insert(row).select("id");
  const { data, error } = await query;

  // RLS turns a blocked update into "0 rows", not an error, so check both.
  if (error || !data?.length) {
    console.error("[experience] save failed", error);
    return { ok: false, message: "Couldn't save. Has the experience table been created?", values };
  }

  updateTag(EXPERIENCE_TAG);
  return { ok: true, message: id ? "Entry updated." : "Entry added.", savedAt: Date.now() };
}

export type DeleteResult = { ok: true } | { ok: false; message: string };

export async function deleteExperience(id: string): Promise<DeleteResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Unknown entry." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("experience").delete().eq("id", id).select("id");

  if (error || !data?.length) {
    console.error("[experience] delete failed", error);
    return { ok: false, message: "Couldn't delete that entry." };
  }

  updateTag(EXPERIENCE_TAG);
  return { ok: true };
}

function emptyValues(): ExperienceValues {
  return {
    title: "",
    org: "",
    location: "",
    description: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    current: false,
  };
}
