import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth-role";

export type Admin = { id: string; email: string };

/**
 * Data access layer for the admin area. proxy.ts already redirects signed-out
 * visitors, but every admin page and Server Action should still call this:
 * the proxy is only a first, optimistic check.
 */
export async function requireAdmin(): Promise<Admin> {
  // Supabase checks token expiry with Date.now(), and a session check has to
  // run on a real request anyway, so never prerender past this point.
  await connection();

  const supabase = await createClient();
  // getClaims() verifies the JWT signature. Never trust getSession() on the server.
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || !isAdmin(claims)) {
    redirect("/login");
  }

  return { id: claims.sub, email: claims.email ?? "" };
}
