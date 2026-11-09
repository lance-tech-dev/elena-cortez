import { Suspense } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getProfile, initials } from "@/lib/profile";
import { AdminHeader } from "../admin-ui";
import { PhotoEditor } from "./photo-editor";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <AdminHeader title="Profile" description="Your photo, name and description on the public site.">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 self-start text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary sm:self-auto"
        >
          See it live <ExternalLink size={11} />
        </a>
      </AdminHeader>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileEditor />
      </Suspense>
    </div>
  );
}

async function ProfileEditor() {
  await requireAdmin();
  const profile = await getProfile();

  return (
    <>
      {profile.source === "fallback" && (
        <div role="alert" className="flex gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-primary" />
          <p className="leading-relaxed">
            The profile table isn&apos;t set up yet, so changes can&apos;t be saved. Run{" "}
            <code className="rounded bg-surface-secondary px-1">supabase/migrations/20261109_profile.sql</code> in the
            Supabase SQL Editor, then reload.
          </p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Photo</h2>
          <PhotoEditor initialUrl={profile.avatarUrl} initials={initials(profile.name)} />
        </aside>

        <ProfileForm
          initial={{
            name: profile.name,
            role: profile.role,
            tagline: profile.tagline,
            bio: profile.bio,
            status: profile.status,
            location: profile.location,
            email: profile.email,
          }}
        />
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid animate-pulse gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <div className="mx-auto aspect-[4/5] w-[180px] rounded-md bg-surface-secondary sm:w-[200px] lg:w-full" />
      <div className="space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded bg-surface-secondary" />
            <div className={`${i === 2 ? "h-40" : "h-11"} rounded-xl bg-surface-secondary`} />
          </div>
        ))}
      </div>
    </div>
  );
}
