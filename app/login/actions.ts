"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth-role";

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

  redirect("/admin");
}
