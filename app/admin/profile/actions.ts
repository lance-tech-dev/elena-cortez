"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_TAG } from "@/lib/profile";
import { deleteObject, publicUrl, putObject } from "@/lib/r2";
import { PROFILE_FIELDS, PROFILE_LIMITS, type ProfileField, type ProfileValues } from "./fields";

/* ---------------------------------- Details --------------------------------- */

export type DetailsState =
  | { ok: true; message: string; savedAt: number; values: ProfileValues }
  | { ok: false; message: string; values: ProfileValues; errors?: Partial<Record<ProfileField, string>> }
  | undefined;

export async function updateProfile(_prev: DetailsState, formData: FormData): Promise<DetailsState> {
  await requireAdmin();

  const values = {} as ProfileValues;
  const errors: Partial<Record<ProfileField, string>> = {};

  for (const field of PROFILE_FIELDS) {
    const raw = String(formData.get(field) ?? "");
    // Keep line breaks in the bio; collapse everything else to one line.
    const value = field === "bio" ? raw.replace(/\r\n/g, "\n").trim() : raw.replace(/\s+/g, " ").trim();
    values[field] = value;
    if (value.length > PROFILE_LIMITS[field]) errors[field] = `Keep it under ${PROFILE_LIMITS[field]} characters.`;
  }

  if (!values.name) errors.name = "Name is required.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "That doesn't look like an email address.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, message: "Fix the highlighted fields.", errors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id");

  // RLS turns a blocked update into "0 rows", not an error, so check both.
  if (error || !data?.length) {
    console.error("[profile] update failed", error);
    return { ok: false, message: "Couldn't save. Has the profile table been created?", values };
  }

  updateTag(PROFILE_TAG);
  return { ok: true, message: "Profile saved.", savedAt: Date.now(), values };
}

/* ---------------------------------- Photo ----------------------------------- */

export type PhotoResult = { ok: true; avatarUrl: string | null } | { ok: false; message: string };

const MAX_PHOTO = 2 * 1024 * 1024; // cropped photo, made in the browser
const MAX_ORIGINAL = 5 * 1024 * 1024; // downscaled original, kept for re-cropping

const IMAGE_TYPES = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

type ImageType = keyof typeof IMAGE_TYPES;

/** Checks the file's first bytes, not just the type the browser claims. */
async function sniffImage(file: File): Promise<ImageType | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = String.fromCharCode(...b);
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

async function currentPhotoKeys() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile")
    .select("avatar_key, avatar_original_key")
    .eq("id", 1)
    .maybeSingle();
  return { supabase, avatarKey: data?.avatar_key ?? null, originalKey: data?.avatar_original_key ?? null };
}

/**
 * Saves a new cropped photo. `original` is sent only for a fresh upload;
 * when re-cropping the current photo, the stored original is kept.
 */
export async function savePhoto(formData: FormData): Promise<PhotoResult> {
  await requireAdmin();

  const photo = formData.get("photo");
  const original = formData.get("original");

  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, message: "No photo received." };
  }
  if (photo.size > MAX_PHOTO) return { ok: false, message: "Cropped photo is too large." };
  const photoType = await sniffImage(photo);
  if (!photoType) return { ok: false, message: "Unsupported image format." };

  let originalType: ImageType | null = null;
  if (original instanceof File && original.size > 0) {
    if (original.size > MAX_ORIGINAL) return { ok: false, message: "Original image is too large." };
    originalType = await sniffImage(original);
    if (!originalType) return { ok: false, message: "Unsupported image format." };
  }

  const id = crypto.randomUUID();
  const newKey = `avatars/${id}.${IMAGE_TYPES[photoType]}`;
  const newOriginalKey = originalType ? `avatars/originals/${id}.${IMAGE_TYPES[originalType]}` : null;

  // Look up the current files and upload the new ones at the same time.
  const [current, upload] = await Promise.all([
    currentPhotoKeys(),
    Promise.all([
      putObject(newKey, photo, photoType),
      newOriginalKey && originalType ? putObject(newOriginalKey, original as File, originalType) : null,
    ]).then(
      () => null,
      (err: unknown) => err,
    ),
  ]);
  const { supabase, avatarKey: oldKey, originalKey: oldOriginalKey } = current;

  if (upload) {
    console.error("[profile] photo upload failed", upload);
    after(() => Promise.all([deleteObject(newKey), deleteObject(newOriginalKey)]));
    return { ok: false, message: "Upload to storage failed. Check the R2 settings in .env.local." };
  }

  const avatarUrl = publicUrl(newKey);
  const { data, error } = await supabase
    .from("profile")
    .update({
      avatar_url: avatarUrl,
      avatar_key: newKey,
      ...(newOriginalKey ? { avatar_original_key: newOriginalKey } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("id");

  if (error || !data?.length) {
    console.error("[profile] photo save failed", error);
    after(() => Promise.all([deleteObject(newKey), deleteObject(newOriginalKey)]));
    return { ok: false, message: "Couldn't save. Has the profile table been created?" };
  }

  // Only now that the database points at the new files, remove the old ones,
  // after the response is sent so the admin doesn't wait on it.
  after(() => Promise.all([deleteObject(oldKey), newOriginalKey ? deleteObject(oldOriginalKey) : null]));

  updateTag(PROFILE_TAG);
  return { ok: true, avatarUrl };
}

export async function removePhoto(): Promise<PhotoResult> {
  await requireAdmin();

  const { supabase, avatarKey, originalKey } = await currentPhotoKeys();
  const { data, error } = await supabase
    .from("profile")
    .update({ avatar_url: null, avatar_key: null, avatar_original_key: null, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id");

  if (error || !data?.length) {
    return { ok: false, message: "Couldn't remove the photo." };
  }

  after(() => Promise.all([deleteObject(avatarKey), deleteObject(originalKey)]));
  updateTag(PROFILE_TAG);
  return { ok: true, avatarUrl: null };
}
