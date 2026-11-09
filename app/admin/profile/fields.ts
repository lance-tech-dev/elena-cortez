// Shared by the form (maxLength, counters) and the server action (validation).
export const PROFILE_LIMITS = {
  name: 80,
  role: 120,
  tagline: 200,
  bio: 4000,
  status: 80,
  location: 80,
  email: 254,
} as const;

export type ProfileField = keyof typeof PROFILE_LIMITS;
export type ProfileValues = Record<ProfileField, string>;
export const PROFILE_FIELDS = Object.keys(PROFILE_LIMITS) as ProfileField[];
