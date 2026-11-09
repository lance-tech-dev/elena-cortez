"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Minus, Move, Plus, X } from "lucide-react";

// Matches the 4:5 photo frame on the home page.
const ASPECT = 4 / 5;
const OUT_W = 800;
const OUT_H = 1000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type Point = { x: number; y: number };

const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Renders the visible crop area to a Blob (WebP, or JPEG where WebP export isn't supported). */
async function exportCrop(img: HTMLImageElement, center: Point, scale: number, vw: number, vh: number) {
  const sw = vw / scale;
  const sh = vh / scale;
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, center.x - sw / 2, center.y - sh / 2, sw, sh, 0, 0, OUT_W, OUT_H);

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Could not export the image.");
  return jpeg;
}

export function PhotoCropper({
  src,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  src: string;
  busy: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [vw, setVw] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rawCenter, setRawCenter] = useState<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const vh = vw / ASPECT;
  const baseScale = img ? Math.max(vw / img.naturalWidth, vh / img.naturalHeight) : 1;
  const scale = baseScale * zoom;

  // Keep the image covering the frame: clamp the center for the current zoom/size.
  const clamp = useCallback(
    (p: Point, s: number): Point => {
      if (!img || !vw) return p;
      const halfW = vw / (2 * s);
      const halfH = vh / (2 * s);
      return {
        x: clampNum(p.x, halfW, img.naturalWidth - halfW),
        y: clampNum(p.y, halfH, img.naturalHeight - halfH),
      };
    },
    [img, vw, vh],
  );
  const center = clamp(rawCenter, scale);

  // Load the image.
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setRawCenter({ x: image.naturalWidth / 2, y: image.naturalHeight / 2 });
    };
    image.onerror = () => setLoadError(true);
    image.src = src;
  }, [src]);

  // Track the frame's width so the crop works at any screen size.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setVw(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape closes; the page behind doesn't scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onCancel]);

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampNum(z * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const pan = (dx: number, dy: number) =>
    setRawCenter((c) => clamp({ x: c.x - dx / scale, y: c.y - dy / scale }, scale));

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(clampNum((pinchStart.current.zoom * dist) / pinchStart.current.dist, MIN_ZOOM, MAX_ZOOM));
    } else if (pointers.current.size === 1) {
      pan(next.x - prev.x, next.y - prev.y);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      pan(...moves[e.key]);
    } else if (e.key === "+" || e.key === "=") {
      setZoom((z) => clampNum(z + 0.1, MIN_ZOOM, MAX_ZOOM));
    } else if (e.key === "-") {
      setZoom((z) => clampNum(z - 0.1, MIN_ZOOM, MAX_ZOOM));
    }
  };

  const confirm = async () => {
    if (!img || !vw) return;
    onConfirm(await exportCrop(img, center, scale, vw, vh));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div className="animate-fade-up flex max-h-dvh w-full flex-col overflow-y-auto rounded-t-2xl border border-border bg-background p-5 font-mono sm:max-w-md sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="cropper-title" className="text-sm font-bold">
            Adjust photo
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Crop frame */}
        <div className="mx-auto w-full max-w-[300px]">
          <div
            ref={viewportRef}
            tabIndex={0}
            aria-label="Photo crop area. Drag or use arrow keys to move, plus and minus to zoom."
            className="relative aspect-[4/5] w-full cursor-grab touch-none overflow-hidden rounded-md border border-border bg-surface-secondary select-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            {img && vw > 0 && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL on a canvas-driven editor
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: img.naturalWidth * scale,
                  height: img.naturalHeight * scale,
                  left: vw / 2 - center.x * scale,
                  top: vh / 2 - center.y * scale,
                }}
              />
            )}
            {!img && !loadError && (
              <div className="absolute inset-0 grid place-items-center">
                <Loader2 size={18} className="animate-spin text-muted" />
              </div>
            )}
            {loadError && (
              <p className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-primary">
                Couldn&apos;t load this image.
              </p>
            )}
            {/* Rule-of-thirds guides */}
            <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/20" />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Move size={11} /> Drag to reposition · pinch or scroll to zoom
        </p>

        {/* Zoom */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => clampNum(z - 0.2, MIN_ZOOM, MAX_ZOOM))}
            aria-label="Zoom out"
            className="rounded-lg border border-border p-2 text-muted transition-colors hover:text-foreground"
          >
            <Minus size={14} />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1 flex-1 cursor-pointer accent-[var(--primary)]"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => clampNum(z + 0.2, MIN_ZOOM, MAX_ZOOM))}
            aria-label="Zoom in"
            className="rounded-lg border border-border p-2 text-muted transition-colors hover:text-foreground"
          >
            <Plus size={14} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-xs text-primary">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-border px-5 py-3 text-xs font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !img}
            className="gradient-bg flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {busy ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
