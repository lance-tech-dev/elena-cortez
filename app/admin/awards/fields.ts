// Shared by the form (maxLength) and the server actions (validation).
export const AWARD_LIMITS = {
  title: 160,
  org: 120,
  description: 400,
} as const;

export const MIN_YEAR = 1950;
export const MAX_YEAR = new Date().getFullYear() + 1;

/** Raw form values, so a failed save can show what was typed. */
export type AwardValues = { title: string; org: string; year: string; description: string };
export type AwardField = keyof AwardValues;
