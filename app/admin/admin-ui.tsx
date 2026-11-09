import { Construction } from "lucide-react";

/** Title row at the top of every admin tab. */
export function AdminHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Placeholder for tabs that aren't built yet. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-8">
      <AdminHeader title={title} description={description} />
      <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <Construction size={20} className="text-muted" />
        <p className="text-sm font-semibold">Coming next</p>
        <p className="max-w-xs text-xs text-muted">This editor isn&apos;t built yet.</p>
      </div>
    </div>
  );
}
