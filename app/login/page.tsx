import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile } from "@/lib/profile";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// Not linked from anywhere on the site. Reached by typing /login or /admin.
export default async function LoginPage() {
  const { name } = await getProfile();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 font-mono">
      <div className="animate-fade-up w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {name}
          </p>
          <h1 className="text-2xl font-bold">Admin sign in</h1>
        </div>
        {/* The form reads ?reason=expired and ?next= from the URL. */}
        <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-surface-secondary" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
