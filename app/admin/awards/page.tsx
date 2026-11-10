import { Suspense } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAwards } from "@/lib/awards";
import { AdminHeader } from "../admin-ui";
import { AwardsManager } from "./awards-manager";

export const metadata = { title: "Awards" };

export default function Page() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <AdminHeader title="Awards" description="The Recognition list on the About page, newest year first.">
        <a
          href="/about"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 self-start text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary sm:self-auto"
        >
          See it live <ExternalLink size={11} />
        </a>
      </AdminHeader>

      <Suspense fallback={<AwardsSkeleton />}>
        <AwardsEditor />
      </Suspense>
    </div>
  );
}

async function AwardsEditor() {
  await requireAdmin();
  const { awards, source } = await getAwards();

  return (
    <>
      {source === "fallback" && (
        <div role="alert" className="flex gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-primary" />
          <p className="leading-relaxed">
            The award table isn&apos;t set up yet, so changes can&apos;t be saved. Run{" "}
            <code className="rounded bg-surface-secondary px-1">supabase db push</code> (or the SQL in{" "}
            <code className="rounded bg-surface-secondary px-1">supabase/migrations/20261110160000_award.sql</code>),
            then reload.
          </p>
        </div>
      )}
      <AwardsManager awards={awards} readOnly={source === "fallback"} />
    </>
  );
}

function AwardsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-11 w-40 rounded-xl bg-surface-secondary" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-surface-secondary" />
      ))}
    </div>
  );
}
