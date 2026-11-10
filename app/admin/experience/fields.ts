// Shared by the form (maxLength) and the server actions (validation).
export const EXPERIENCE_LIMITS = {
  title: 120,
  org: 120,
  location: 120,
  description: 2000,
} as const;

export const MIN_YEAR = 1950;
export const MAX_YEAR = new Date().getFullYear() + 5;

/** Raw form values, as strings, so a failed save can show what was typed. */
export type ExperienceValues = {
  title: string;
  org: string;
  location: string;
  description: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
};

export type ExperienceField = keyof ExperienceValues;
