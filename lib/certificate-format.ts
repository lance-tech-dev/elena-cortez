// Shared by the public pages and the admin (client and server), so no "server-only".
import { MONTHS } from "@/lib/experience-format";

export type Certificate = {
  id: string;
  title: string;
  issuer: string;
  description: string;
  issuedOn: string; // "YYYY-MM-DD"
  credentialUrl: string; // "" when there's no link
};

/** "2025-11-26" → "Nov 26, 2025". Parsed by hand so the time zone can't shift the day. */
export function formatIssued(issuedOn: string): string {
  const [y, m, d] = issuedOn.split("-").map(Number);
  if (!y || !m || !d) return issuedOn;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Shape used by <ExperienceRows>. */
export function toRow(c: Certificate) {
  return {
    year: c.issuedOn.slice(0, 4),
    title: c.title,
    org: c.issuer,
    href: c.credentialUrl || undefined,
    description: [c.description, formatIssued(c.issuedOn)].filter(Boolean).join(" · "),
  };
}
