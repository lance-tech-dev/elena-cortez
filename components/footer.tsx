import { cacheLife } from "next/cache";
import { site } from "@/lib/site";

// With Cache Components on, `new Date()` must be cached explicitly.
// The year is captured into the static page and refreshed daily.
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer() {
  return (
    <footer className="content-container">
      <div className="border-t border-border pt-6 pb-12 font-mono text-xs text-muted">
        © <CurrentYear /> {site.name}
      </div>
    </footer>
  );
}
