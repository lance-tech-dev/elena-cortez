// Shared by proxy.ts, the login action and the data access layer.
// No "server-only" import here: proxy.ts can't import that package.
//
// The role lives in app_metadata, which only the service role key can set
// (see scripts/seed-admin.mjs). A user who signs up through the public
// API can't give themselves this role, so a Supabase account alone does
// not get anyone into /admin.

type WithAppMetadata = { app_metadata?: Record<string, unknown> | null } | null | undefined;

export function isAdmin(subject: WithAppMetadata): boolean {
  return subject?.app_metadata?.role === "admin";
}
