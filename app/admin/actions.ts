"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LAST_ACTIVE_COOKIE } from "@/lib/session";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(LAST_ACTIVE_COOKIE);
  redirect("/login");
}

/**
 * Called by the idle timer while the admin is active but not otherwise
 * making requests (e.g. typing in a long form). proxy.ts refreshes the
 * last-active cookie on every /admin request, this one included.
 */
export async function keepAlive(): Promise<{ ok: boolean }> {
  await requireAdmin();
  return { ok: true };
}

/** Called by the idle timer when the 30 minutes are up. */
export async function expireSession(): Promise<void> {
  const supabase = await createClient();
  // "local": only this browser. Other devices keep their own idle clocks.
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete(LAST_ACTIVE_COOKIE);
}
