"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CERTIFICATE_TAG } from "@/lib/certificate";
import { CERTIFICATE_FIELDS, CERTIFICATE_LIMITS, type CertificateField, type CertificateValues } from "./fields";

export type SaveState =
  | { ok: true; message: string; savedAt: number }
  | { ok: false; message: string; values: CertificateValues; errors?: Partial<Record<CertificateField, string>> }
  | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A real calendar date, not in the future (with a day of slack for time zones). */
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return date.getUTCFullYear() >= 1950 && date.getTime() <= Date.now() + 86_400_000;
}

/** Creates a certificate, or updates one when the form has an `id`. */
export async function saveCertificate(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const values = {} as CertificateValues;
  for (const field of CERTIFICATE_FIELDS) {
    values[field] = String(formData.get(field) ?? "").replace(/\s+/g, " ").trim();
  }
  if (id && !UUID.test(id)) return { ok: false, message: "Unknown certificate.", values };

  const errors: Partial<Record<CertificateField, string>> = {};
  for (const field of CERTIFICATE_FIELDS) {
    if (values[field].length > CERTIFICATE_LIMITS[field]) {
      errors[field] = `Keep it under ${CERTIFICATE_LIMITS[field]} characters.`;
    }
  }
  if (!values.title) errors.title = "Title is required.";
  if (!values.issuedOn) errors.issuedOn = "Date is required.";
  else if (!validDate(values.issuedOn)) errors.issuedOn = "Pick a real date that isn't in the future.";

  if (values.credentialUrl) {
    // Accept "example.com/cert" too; store it with https://.
    if (!/^https?:\/\//i.test(values.credentialUrl)) values.credentialUrl = `https://${values.credentialUrl}`;
    try {
      const url = new URL(values.credentialUrl);
      if (!url.hostname.includes(".")) throw new Error("no host");
    } catch {
      errors.credentialUrl = "That doesn't look like a link.";
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, message: "Fix the highlighted fields.", errors, values };
  }

  const row = {
    title: values.title,
    issuer: values.issuer,
    description: values.description,
    issued_on: values.issuedOn,
    credential_url: values.credentialUrl,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const query = id
    ? supabase.from("certificate").update(row).eq("id", id).select("id")
    : supabase.from("certificate").insert(row).select("id");
  const { data, error } = await query;

  // RLS turns a blocked update into "0 rows", not an error, so check both.
  if (error || !data?.length) {
    console.error("[certificate] save failed", error);
    return { ok: false, message: "Couldn't save. Has the certificate table been created?", values };
  }

  updateTag(CERTIFICATE_TAG);
  return { ok: true, message: id ? "Certificate updated." : "Certificate added.", savedAt: Date.now() };
}

export type DeleteResult = { ok: true } | { ok: false; message: string };

export async function deleteCertificate(id: string): Promise<DeleteResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, message: "Unknown certificate." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("certificate").delete().eq("id", id).select("id");

  if (error || !data?.length) {
    console.error("[certificate] delete failed", error);
    return { ok: false, message: "Couldn't delete that certificate." };
  }

  updateTag(CERTIFICATE_TAG);
  return { ok: true };
}
