"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth-role";
import { LAST_ACTIVE_COOKIE, lastActiveCookieOptions, safeAdminPath } from "@/lib/session";

export type LoginState = { error?: string; email?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // One message for every failure, so the form doesn't reveal which
  // emails exist or that a non-admin account was found.
  if (error || !isAdmin(data.user)) {
    if (!error) await supabase.auth.signOut();
    return { error: "Invalid email or password.", email };
  }

  // Start the 30-minute idle clock (see lib/session.ts).
  (await cookies()).set(LAST_ACTIVE_COOKIE, String(Date.now()), lastActiveCookieOptions);

  // Back to where the admin was when the session expired, if anywhere.
  redirect(safeAdminPath(String(formData.get("next") ?? "")));
}
