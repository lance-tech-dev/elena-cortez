import "server-only";
import { AwsClient } from "aws4fetch";

// Cloudflare R2 through its S3-compatible API. aws4fetch is tiny and only
// needs fetch, so this keeps working if the site moves to Cloudflare Workers.

let client: AwsClient | undefined;

function r2() {
  client ??= new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
  return client;
}

function objectUrl(key: string) {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${path}`;
}

/** Public URL a browser can load the object from. */
export function publicUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
}

export async function putObject(key: string, body: Blob, contentType: string) {
  const res = await r2().fetch(objectUrl(key), {
    method: "PUT",
    body: await body.arrayBuffer(),
    headers: {
      "Content-Type": contentType,
      // Keys are unique per upload, so the file at a key never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed (${res.status}): ${await res.text()}`);
  }
}

export async function getObject(key: string) {
  const res = await r2().fetch(objectUrl(key));
  if (!res.ok) throw new Error(`R2 download failed (${res.status})`);
  return res;
}

/** Best effort: a leftover file in the bucket is harmless, so never throw. */
export async function deleteObject(key: string | null | undefined) {
  if (!key) return;
  try {
    await r2().fetch(objectUrl(key), { method: "DELETE" });
  } catch (err) {
    console.warn(`[r2] could not delete ${key}`, err);
  }
}
