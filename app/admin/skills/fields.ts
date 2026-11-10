// Shared by the form and the server actions (validation).
export const SKILL_LIMITS = {
  title: 80,
  skill: 60, // one skill name
  skills: 40, // skills per group
} as const;
