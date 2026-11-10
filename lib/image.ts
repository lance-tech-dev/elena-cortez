import "server-only";

export const IMAGE_TYPES = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

/** Checks the file's first bytes, not just the type the browser claims. */
export async function sniffImage(file: Blob): Promise<ImageType | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = String.fromCharCode(...b);
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}
