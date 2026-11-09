import type { Metadata } from "next";
import { PageIntro } from "@/components/sections";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const site = await getProfile();
  return (
    <div className="space-y-16">
      <PageIntro
        title="Contact"
        description="Whether it's a role, a project, or just a question — my inbox is open."
      />

      <div>
        <div className="flex flex-col gap-1 border-b border-border py-3.5 text-sm sm:flex-row sm:items-center sm:gap-6">
          <span className="w-24 shrink-0 text-xs text-muted">Email</span>
          <a
            href={`mailto:${site.email}`}
            className="break-all font-bold underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            {site.email}
          </a>
        </div>
        <div className="flex flex-col gap-1 border-b border-border py-3.5 text-sm sm:flex-row sm:items-center sm:gap-6">
          <span className="w-24 shrink-0 text-xs text-muted">Location</span>
          <span className="font-bold">{site.location}</span>
        </div>
        <div className="flex flex-col gap-1 py-3.5 text-sm sm:flex-row sm:items-center sm:gap-6">
          <span className="w-24 shrink-0 text-xs text-muted">Status</span>
          <span className="flex items-center gap-2 font-bold">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {site.status}
          </span>
        </div>
      </div>

      <a
        href={`mailto:${site.email}`}
        className="gradient-bg inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        Send an email →
      </a>
    </div>
  );
}
