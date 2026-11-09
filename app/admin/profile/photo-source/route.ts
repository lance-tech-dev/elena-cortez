import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getObject } from "@/lib/r2";

// Serves the stored original photo from our own domain so the cropper can
// draw it on a canvas. Loading it straight from R2 would be cross-origin,
// and the browser blocks exporting a canvas that holds a cross-origin image.
export async function GET() {
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profile")
    .select("avatar_key, avatar_original_key")
    .eq("id", 1)
    .maybeSingle();

  const key = data?.avatar_original_key ?? data?.avatar_key;
  if (!key) return new Response("No photo", { status: 404 });

  const res = await getObject(key);
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
