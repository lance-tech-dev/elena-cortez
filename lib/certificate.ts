import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { certificates as fallbackItems } from "@/lib/site";
import type { Certificate } from "@/lib/certificate-format";

export const CERTIFICATE_TAG = "certificate";

export type CertificateList = {
  items: Certificate[];
  /** "fallback" when the certificate table is missing or unreachable. */
  source: "database" | "fallback";
};

/**
 * Certificates, newest first. Cached; the admin actions call
 * updateTag(CERTIFICATE_TAG) so changes show up right away.
 */
export async function getCertificates(): Promise<CertificateList> {
  "use cache";
  cacheTag(CERTIFICATE_TAG);

  // Public, anonymous read. RLS allows select for anon.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("certificate")
    .select("*")
    .order("issued_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.warn(`[certificate] using fallback: ${error.message}`);
    cacheLife("minutes");
    return { items: fallbackItems, source: "fallback" };
  }

  cacheLife("days");
  return {
    items: data.map((row) => ({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      description: row.description,
      issuedOn: row.issued_on,
      credentialUrl: row.credential_url,
    })),
    source: "database",
  };
}
