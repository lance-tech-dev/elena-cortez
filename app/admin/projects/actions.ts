"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PROJECTS_TAG } from "@/lib/projects";
import { IMAGE_TYPES, sniffImage } from "@/lib/image";
import { deleteObject, publicUrl, putObject } from "@/lib/r2";
import { IMAGE_MAX_BYTES, PROJECT_LIMITS } from "./fields";

export type SaveResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      errors?: Partial<Record<"title" | "description" | "liveUrl" | "tags" | "image", string>>;
    };

export type ActionResult = { ok: true } | { ok: false; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const oneLine = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

function parseTags(raw: FormDataEntryValue | null): string[] {
  let list: unknown;
  try {
    list = JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list
    .map(oneLine)
    .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
}

/**
 * Creates a project, or updates one when the form has an `id`.
 * Form fields: title, description, liveUrl, tags (JSON array), published ("on"),
 * image (File, optional), removeImage ("1" to drop the current image).
 */
export async function saveProject(formData: FormData): Promise<SaveResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (id && !UUID.test(id)) return { ok: false, message: "Unknown project." };

  const title = oneLine(formData.get("title"));
  const description = String(formData.get("description") ?? "").replace(/\r\n/g, "\n").trim();
  let liveUrl = oneLine(formData.get("liveUrl"));
  const tags = parseTags(formData.get("tags"));
  const published = formData.get("published") === "on";
  const removeImage = formData.get("removeImage") === "1";
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;

  const errors: NonNullable<Extract<SaveResult, { ok: false }>["errors"]> = {};
  if (!title) errors.title = "Title is required.";
  else if (title.length > PROJECT_LIMITS.title) errors.title = `Keep it under ${PROJECT_LIMITS.title} characters.`;
  if (description.length > PROJECT_LIMITS.description) {
    errors.description = `Keep it under ${PROJECT_LIMITS.description} characters.`;
  }
  if (tags.length > PROJECT_LIMITS.tags) errors.tags = `Up to ${PROJECT_LIMITS.tags} tags.`;
  else if (tags.some((t) => t.length > PROJECT_LIMITS.tag)) {
    errors.tags = `Each tag must be under ${PROJECT_LIMITS.tag} characters.`;
  }

  if (liveUrl) {
    // Accept "example.com" too; store it with https://.
    if (!/^https?:\/\//i.test(liveUrl)) liveUrl = `https://${liveUrl}`;
    try {
      if (!new URL(liveUrl).hostname.includes(".")) throw new Error("no host");
      if (liveUrl.length > PROJECT_LIMITS.liveUrl) errors.liveUrl = "That link is too long.";
    } catch {
      errors.liveUrl = "That doesn't look like a link.";
    }
  }

  let imageType: keyof typeof IMAGE_TYPES | null = null;
  if (hasImage) {
    if (image.size > IMAGE_MAX_BYTES) errors.image = "Image is too large.";
    else {
      imageType = await sniffImage(image);
      if (!imageType) errors.image = "Use a JPG, PNG or WebP image.";
    }
  }

  if (Object.keys(errors).length) return { ok: false, message: "Fix the highlighted fields.", errors };

  const supabase = await createClient();

  // The current image, so it can be removed once it's been replaced.
  let oldKey: string | null = null;
  if (id && (hasImage || removeImage)) {
    const { data } = await supabase.from("project").select("image_key").eq("id", id).maybeSingle();
    oldKey = data?.image_key ?? null;
  }

  let newKey: string | null = null;
  if (hasImage && imageType) {
    newKey = `projects/${crypto.randomUUID()}.${IMAGE_TYPES[imageType]}`;
    try {
      await putObject(newKey, image as File, imageType);
    } catch (err) {
      console.error("[projects] image upload failed", err);
      return { ok: false, message: "Image upload failed. Check the R2 settings in .env.local." };
    }
  }

  const row: Record<string, unknown> = {
    title,
    description,
    tags,
    live_url: liveUrl,
    published,
    updated_at: new Date().toISOString(),
  };
  if (newKey) {
    row.image_url = publicUrl(newKey);
    row.image_key = newKey;
  } else if (removeImage) {
    row.image_url = null;
    row.image_key = null;
  }

  let result;
  if (id) {
    result = await supabase.from("project").update(row).eq("id", id).select("id");
  } else {
    // New projects go to the end.
    const { data: last } = await supabase
      .from("project")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    result = await supabase
      .from("project")
      .insert({ ...row, position: (last?.position ?? 0) + 1 })
      .select("id");
  }

  // RLS turns a blocked update into "0 rows", not an error, so check both.
  if (result.error || !result.data?.length) {
    console.error("[projects] save failed", result.error);
    after(() => deleteObject(newKey));
    return { ok: false, message: "Couldn't save. Has the project table been created?" };
  }

  // The row now points at the new image (or none), so the old file can go.
  if (newKey || removeImage) after(() => deleteObject(oldKey));

  updateTag(PROJECTS_TAG);
  return { ok: true, message: id ? "Project updated." : "Project added." };
}

export async function setProjectPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Unknown project." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project")
    .update({ published: Boolean(published), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    console.error("[projects] publish toggle failed", error);
    return { ok: false, message: "Couldn't change visibility." };
  }

  updateTag(PROJECTS_TAG);
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Unknown project." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("project").delete().eq("id", id).select("id, image_key");

  if (error || !data?.length) {
    console.error("[projects] delete failed", error);
    return { ok: false, message: "Couldn't delete that project." };
  }

  after(() => deleteObject(data[0]?.image_key));
  updateTag(PROJECTS_TAG);
  return { ok: true };
}

/** Saves the project order: `ids` is every project, top to bottom. */
export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 200 || !ids.every((id) => UUID.test(id))) {
    return { ok: false, message: "Unknown project." };
  }

  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("project").update({ position: i + 1 }).eq("id", id).select("id")),
  );

  updateTag(PROJECTS_TAG);
  if (results.some((r) => r.error || !r.data?.length)) {
    console.error("[projects] reorder failed", results.find((r) => r.error)?.error);
    return { ok: false, message: "Couldn't save the new order." };
  }
  return { ok: true };
}
