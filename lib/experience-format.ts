// Shared by the public pages and the admin (client and server), so no "server-only".

export type Experience = {
  id: string;
  title: string;
  org: string;
  location: string;
  startYear: number;
  startMonth: number | null; // 1–12
  endYear: number | null; // null = Present
  endMonth: number | null;
  description: string;
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function formatDate(year: number, month: number | null) {
  return month ? `${MONTHS[month - 1]} ${year}` : String(year);
}

/** "Aug 2026 – Present", "Feb – May 2026", "2022 – 2026". */
export function formatPeriod(e: Pick<Experience, "startYear" | "startMonth" | "endYear" | "endMonth">): string {
  const start = formatDate(e.startYear, e.startMonth);
  if (e.endYear === null) return `${start} – Present`;
  const end = formatDate(e.endYear, e.endMonth);
  if (start === end) return start;
  // Same year with months on both ends: "Feb – May 2026".
  if (e.startYear === e.endYear && e.startMonth && e.endMonth) {
    return `${MONTHS[e.startMonth - 1]} – ${end}`;
  }
  return `${start} – ${end}`;
}

/** Shape used by <ExperienceRows>. */
export function toRow(e: Experience) {
  return {
    year: String(e.startYear),
    title: e.title,
    org: e.org,
    description: [formatPeriod(e), e.location, e.description].filter(Boolean).join(" · "),
  };
}
