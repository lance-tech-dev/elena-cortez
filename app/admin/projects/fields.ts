// Shared by the form and the server actions (validation).
export const PROJECT_LIMITS = {
  title: 80,
  description: 600,
  liveUrl: 500,
  tag: 40, // one tag
  tags: 12, // tags per project
} as const;

/** Cover images are resized in the browser to this longest side before upload. */
export const IMAGE_MAX_SIDE = 1600;
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
