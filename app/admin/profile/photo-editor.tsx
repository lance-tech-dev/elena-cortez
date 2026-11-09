"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Crop, ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { PhotoCropper } from "./photo-cropper";
import { removePhoto, savePhoto } from "./actions";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT = 20 * 1024 * 1024;
const ORIGINAL_MAX_SIDE = 2048;

type Editing = {
  src: string; // object URL shown in the cropper
  original: Blob | null; // set for a new upload; null when re-cropping the stored photo
};

/** Shrinks big camera photos before upload; the stored original is only used for re-cropping. */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, ORIGINAL_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (ratio === 1 && file.size < 3 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.9),
  );
}

export function PhotoEditor({ initialUrl, initials }: { initialUrl: string | null; initials: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loadingSource, setLoadingSource] = useState(false);
  const [pending, startTransition] = useTransition();

  const closeEditor = () => {
    if (editing) URL.revokeObjectURL(editing.src);
    setEditing(null);
    setError(null);
  };

  const openFile = async (file: File | undefined) => {
    setNotice(null);
    setError(null);
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setNotice("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_INPUT) {
      setNotice("That image is over 20 MB. Try a smaller one.");
      return;
    }
    try {
      const original = await downscale(file);
      setEditing({ src: URL.createObjectURL(original), original });
    } catch {
      setNotice("Couldn't read that image.");
    }
  };

  const adjustCurrent = async () => {
    setNotice(null);
    setLoadingSource(true);
    try {
      const res = await fetch("/admin/profile/photo-source", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setEditing({ src: URL.createObjectURL(await res.blob()), original: null });
    } catch {
      setNotice("Couldn't load the current photo. Try uploading it again.");
    } finally {
      setLoadingSource(false);
    }
  };

  const save = (cropped: Blob) => {
    setError(null);
    const fd = new FormData();
    fd.set("photo", cropped, "photo");
    if (editing?.original) fd.set("original", editing.original, "original");
    startTransition(async () => {
      const result = await savePhoto(fd);
      if (result.ok) {
        setUrl(result.avatarUrl);
        closeEditor();
        setNotice("Photo saved.");
      } else {
        setError(result.message);
      }
    });
  };

  const remove = () => {
    setNotice(null);
    startTransition(async () => {
      const result = await removePhoto();
      setConfirmRemove(false);
      if (result.ok) {
        setUrl(null);
        setNotice("Photo removed.");
      } else {
        setNotice(result.message);
      }
    });
  };

  const btn =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

  return (
    <div className="space-y-4">
      {/* Photo — also a drop target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void openFile(e.dataTransfer.files[0]);
        }}
        className={`relative mx-auto aspect-[4/5] w-[180px] overflow-hidden rounded-md border bg-surface-secondary transition-colors sm:w-[200px] lg:w-full ${
          dragOver ? "border-primary" : "border-border"
        }`}
      >
        {url ? (
          <Image src={url} alt="Profile photo" fill sizes="(min-width: 1024px) 260px, 200px" className="object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group absolute inset-0 grid place-items-center"
          >
            <div aria-hidden className="gradient-bg absolute inset-0 opacity-15" />
            <div className="relative flex flex-col items-center gap-2">
              <span className="gradient-text text-5xl font-black tracking-tighter">{initials}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted transition-colors group-hover:text-primary">
                <ImageUp size={12} /> Upload or drop
              </span>
            </div>
          </button>
        )}
        {pending && !editing && (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => {
          void openFile(e.target.files?.[0]);
          e.target.value = ""; // allow picking the same file again
        }}
      />

      {/* Actions */}
      {confirmRemove ? (
        <div className="space-y-2 rounded-lg border border-border p-3 text-center">
          <p className="text-xs">Remove the photo from your profile?</p>
          <div className="flex justify-center gap-2">
            <button type="button" className={btn} onClick={() => setConfirmRemove(false)} disabled={pending}>
              Keep
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending && <Loader2 size={12} className="animate-spin" />}
              Remove
            </button>
          </div>
        </div>
      ) : url ? (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className={btn} onClick={() => fileRef.current?.click()} disabled={pending}>
            <RefreshCw size={12} /> Replace
          </button>
          <button type="button" className={btn} onClick={adjustCurrent} disabled={pending || loadingSource}>
            {loadingSource ? <Loader2 size={12} className="animate-spin" /> : <Crop size={12} />} Adjust
          </button>
          <button type="button" className={btn} onClick={() => setConfirmRemove(true)} disabled={pending}>
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ) : (
        <button type="button" className={`${btn} w-full`} onClick={() => fileRef.current?.click()} disabled={pending}>
          <ImageUp size={12} /> Upload photo
        </button>
      )}

      <p className="text-center text-[11px] text-muted" aria-live="polite">
        {notice ?? "JPG, PNG or WebP · cropped to 4:5"}
      </p>

      {editing && (
        <PhotoCropper src={editing.src} busy={pending} error={error} onCancel={closeEditor} onConfirm={save} />
      )}
    </div>
  );
}
