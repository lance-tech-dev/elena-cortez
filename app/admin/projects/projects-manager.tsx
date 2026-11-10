"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImageUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Project } from "@/lib/site";
import { deleteProject, reorderProjects, saveProject, setProjectPublished, type SaveResult } from "./actions";
import { IMAGE_MAX_BYTES, IMAGE_MAX_SIDE, PROJECT_LIMITS } from "./fields";
import { ChipInput, mergeChips, splitChips } from "../chip-input";

const inputClass =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary";

const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT = 20 * 1024 * 1024;

/** "new" = the add form is open; an id = that project is being edited. */
type Editing = "new" | string | null;

export function ProjectsManager({ projects, readOnly }: { projects: Project[]; readOnly: boolean }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ordered, setOrdered] = useOptimistic(projects);
  const [reordering, startReorder] = useTransition();

  const done = (message: string) => {
    setEditing(null);
    setNotice(message);
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...ordered];
    const [project] = next.splice(index, 1);
    next.splice(index + by, 0, project!);
    setNotice(null);
    startReorder(async () => {
      setOrdered(next);
      const result = await reorderProjects(next.map((p) => p.id));
      if (!result.ok) setNotice(result.message);
    });
  };

  const hidden = ordered.filter((p) => !p.published).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted">
          {notice ??
            `${ordered.length} ${ordered.length === 1 ? "project" : "projects"}${hidden ? ` · ${hidden} hidden` : ""}`}
        </p>
        {editing !== "new" && (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => {
              setEditing("new");
              setNotice(null);
            }}
            className="gradient-bg flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} /> Add project
          </button>
        )}
      </div>

      {editing === "new" && <ProjectForm key="new" onCancel={() => setEditing(null)} onSaved={done} />}

      {ordered.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-xs text-muted">
          No projects yet. Add your first one.
        </div>
      ) : (
        <ul className="space-y-3">
          {ordered.map((project, i) =>
            editing === project.id ? (
              <li key={project.id}>
                <ProjectForm project={project} onCancel={() => setEditing(null)} onSaved={done} />
              </li>
            ) : (
              <ProjectItem
                key={project.id}
                project={project}
                readOnly={readOnly}
                busy={reordering}
                canMoveUp={i > 0}
                canMoveDown={i < ordered.length - 1}
                onMove={(by) => move(i, by)}
                onEdit={() => {
                  setEditing(project.id);
                  setNotice(null);
                }}
                onNotice={setNotice}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function Thumbnail({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="relative grid aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-secondary">
      {src ? (
        // Plain <img>: also shows local previews (blob: URLs) before upload.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div aria-hidden className="gradient-bg absolute inset-0 opacity-10" />
          <span className="relative text-[10px] text-muted">[ preview ]</span>
        </>
      )}
    </div>
  );
}

function ProjectItem({
  project,
  readOnly,
  busy,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
  onNotice,
}: {
  project: Project;
  readOnly: boolean;
  busy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (by: -1 | 1) => void;
  onEdit: () => void;
  onNotice: (message: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [published, setPublished] = useOptimistic(project.published);

  const remove = () =>
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.ok) onNotice("Project deleted.");
      else {
        setError(result.message);
        setConfirming(false);
      }
    });

  const toggleVisibility = () =>
    startTransition(async () => {
      setPublished(!published);
      setError(null);
      const result = await setProjectPublished(project.id, !published);
      if (result.ok) onNotice(published ? `“${project.title}” is hidden.` : `“${project.title}” is visible.`);
      else setError(result.message);
    });

  return (
    <li className={`rounded-xl border border-border p-4 transition-opacity ${pending && confirming ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className={`w-full sm:w-36 ${published ? "" : "opacity-50"}`}>
          <Thumbnail src={project.image} alt={project.title} />
        </div>

        <div className={`min-w-0 flex-1 space-y-2 ${published ? "" : "opacity-60"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{project.title}</p>
            {!published && (
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                Hidden
              </span>
            )}
          </div>
          {project.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">{project.description}</p>
          )}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1 truncate text-xs text-muted underline decoration-border underline-offset-4 hover:text-primary"
            >
              {project.href.replace(/^https?:\/\//, "")} <ExternalLink size={11} className="shrink-0" />
            </a>
          )}
          {error && <p className="text-[11px] text-primary">{error}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-muted">Delete project?</span>
              <button type="button" onClick={remove} disabled={pending} className={`${ghostBtn} border-primary text-primary`}>
                {pending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Yes, delete
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={ghostBtn}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={readOnly || busy || !canMoveUp}
                className={ghostBtn}
                aria-label={`Move ${project.title} up`}
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={readOnly || busy || !canMoveDown}
                className={ghostBtn}
                aria-label={`Move ${project.title} down`}
              >
                <ArrowDown size={12} />
              </button>
              <button
                type="button"
                onClick={toggleVisibility}
                disabled={readOnly || pending}
                className={ghostBtn}
                aria-label={published ? `Hide ${project.title}` : `Show ${project.title}`}
                title={published ? "Hide from the site" : "Show on the site"}
              >
                {published ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button type="button" onClick={onEdit} disabled={readOnly} className={ghostBtn}>
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(true);
                  setError(null);
                }}
                disabled={readOnly}
                className={ghostBtn}
                aria-label={`Delete ${project.title}`}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/** Shrinks the image to IMAGE_MAX_SIDE and re-encodes it (WebP, or JPEG where WebP isn't supported). */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (ratio === 1 && file.size <= 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("resize failed");
  return jpeg;
}

function ProjectForm({
  project,
  onCancel,
  onSaved,
}: {
  project?: Project;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [liveUrl, setLiveUrl] = useState(project?.href ?? "");
  const [tags, setTags] = useState<string[]>(project?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [published, setPublished] = useState(project?.published ?? true);

  // Image: a new file to upload, or a request to remove the current one.
  const [newImage, setNewImage] = useState<{ blob: Blob; preview: string } | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const idPrefix = project?.id ?? "new";

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Free the preview's object URL when it's replaced or the form closes.
  useEffect(() => () => {
    if (newImage) URL.revokeObjectURL(newImage.preview);
  }, [newImage]);

  const errors = result && !result.ok ? result.errors : undefined;
  const shownImage = newImage?.preview ?? (removeImage ? null : project?.image);

  const pickImage = async (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setImageError("Use a JPG, PNG or WebP image.");
    if (file.size > MAX_INPUT) return setImageError("That file is over 20 MB.");
    setPreparing(true);
    try {
      const blob = await prepareImage(file);
      if (blob.size > IMAGE_MAX_BYTES) return setImageError("That image is still too large after resizing.");
      setNewImage({ blob, preview: URL.createObjectURL(blob) });
      setRemoveImage(false);
    } catch {
      setImageError("Couldn't read that image.");
    } finally {
      setPreparing(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include a half-typed tag.
    const allTags = mergeChips(tags, splitChips(tagDraft));
    setTags(allTags);
    setTagDraft("");

    const fd = new FormData();
    if (project) fd.set("id", project.id);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("liveUrl", liveUrl);
    fd.set("tags", JSON.stringify(allTags));
    if (published) fd.set("published", "on");
    if (newImage) {
      const ext = newImage.blob.type === "image/webp" ? "webp" : newImage.blob.type === "image/png" ? "png" : "jpg";
      fd.set("image", newImage.blob, `cover.${ext}`);
    } else if (removeImage) fd.set("removeImage", "1");

    startTransition(async () => {
      const res = await saveProject(fd);
      setResult(res);
      if (res.ok) onSaved(res.message);
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="space-y-5 rounded-xl border border-primary/40 bg-surface p-4 sm:p-5"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-muted">{project ? "Edit project" : "New project"}</p>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Cover image */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">Cover image</p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void pickImage(e.dataTransfer.files[0]);
            }}
            className="relative"
          >
            <Thumbnail src={shownImage} alt={title || "Project cover"} />
            {preparing && (
              <div className="absolute inset-0 grid place-items-center rounded-lg bg-background/70">
                <Loader2 size={16} className="animate-spin text-muted" />
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT.join(",")}
            className="hidden"
            onChange={(e) => {
              void pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={preparing} className={ghostBtn}>
              <ImageUp size={12} /> {shownImage ? "Replace" : "Upload"}
            </button>
            {shownImage && (
              <button
                type="button"
                onClick={() => {
                  setNewImage(null);
                  setRemoveImage(Boolean(project?.image));
                }}
                className={ghostBtn}
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
          {imageError || errors?.image ? (
            <p className="text-[11px] text-primary">{imageError ?? errors?.image}</p>
          ) : (
            <p className="text-[11px] text-muted">JPG, PNG or WebP. Shown at 16:10, so landscape works best.</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <Field label="Title" htmlFor={`${idPrefix}-title`} error={errors?.title}>
            <input
              ref={titleRef}
              id={`${idPrefix}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={PROJECT_LIMITS.title}
              placeholder="e.g. Home Lab Network"
              aria-invalid={errors?.title ? true : undefined}
              className={`${inputClass} ${errors?.title ? "border-primary" : "border-border"}`}
            />
          </Field>

          <Field
            label="Description"
            htmlFor={`${idPrefix}-description`}
            counter={`${description.length}/${PROJECT_LIMITS.description}`}
            error={errors?.description}
          >
            <textarea
              id={`${idPrefix}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={PROJECT_LIMITS.description}
              rows={3}
              placeholder="What it is and what you did."
              aria-invalid={errors?.description ? true : undefined}
              className={`${inputClass} min-h-24 resize-y leading-relaxed ${errors?.description ? "border-primary" : "border-border"}`}
            />
          </Field>

          <Field
            label="Tags"
            htmlFor={`${idPrefix}-tags`}
            hint="Press Enter or type a comma to add. Drag to reorder."
            error={errors?.tags}
          >
            <ChipInput
              id={`${idPrefix}-tags`}
              value={tags}
              onChange={setTags}
              draft={tagDraft}
              onDraftChange={setTagDraft}
              maxLength={PROJECT_LIMITS.tag}
              invalid={Boolean(errors?.tags)}
              placeholder="e.g. Networking"
            />
          </Field>

          <Field
            label="Live link"
            htmlFor={`${idPrefix}-liveUrl`}
            hint="Optional. Adds a “Live Preview” button to the card."
            error={errors?.liveUrl}
          >
            <input
              id={`${idPrefix}-liveUrl`}
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              maxLength={PROJECT_LIMITS.liveUrl}
              type="url"
              inputMode="url"
              placeholder="https://…"
              aria-invalid={errors?.liveUrl ? true : undefined}
              className={`${inputClass} ${errors?.liveUrl ? "border-primary" : "border-border"}`}
            />
          </Field>

          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="accent-primary"
            />
            Show on the site (untick to keep it hidden)
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-xs text-primary">
          {result && !result.ok ? result.message : ""}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className={`${ghostBtn} px-4 py-2.5`}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || preparing}
            className="gradient-bg flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {pending ? "Saving…" : project ? "Save changes" : "Add project"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  counter,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  counter?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-semibold">
          {label}
        </label>
        {counter && <span className="text-[10px] text-muted tabular-nums">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] text-primary">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
