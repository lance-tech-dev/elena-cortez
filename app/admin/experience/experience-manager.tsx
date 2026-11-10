"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { formatPeriod, MONTHS, type Experience } from "@/lib/experience-format";
import { deleteExperience, saveExperience } from "./actions";
import { EXPERIENCE_LIMITS, MAX_YEAR, MIN_YEAR, type ExperienceField, type ExperienceValues } from "./fields";

const inputClass =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary disabled:opacity-50";

const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

/** "new" = the add form is open; an id = that entry is being edited. */
type Editing = "new" | string | null;

export function ExperienceManager({ items, readOnly }: { items: Experience[]; readOnly: boolean }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const done = (message: string) => {
    setEditing(null);
    setNotice(message);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted">
          {notice ?? `${items.length} ${items.length === 1 ? "entry" : "entries"}`}
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
            <Plus size={14} /> Add experience
          </button>
        )}
      </div>

      {editing === "new" && (
        <ExperienceForm key="new" onCancel={() => setEditing(null)} onSaved={done} />
      )}

      {items.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-xs text-muted">
          No experience yet. Add your first entry.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) =>
            editing === item.id ? (
              <li key={item.id}>
                <ExperienceForm entry={item} onCancel={() => setEditing(null)} onSaved={done} />
              </li>
            ) : (
              <ExperienceItem
                key={item.id}
                item={item}
                readOnly={readOnly}
                onEdit={() => {
                  setEditing(item.id);
                  setNotice(null);
                }}
                onDeleted={() => setNotice("Entry deleted.")}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function ExperienceItem({
  item,
  readOnly,
  onEdit,
  onDeleted,
}: {
  item: Experience;
  readOnly: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteExperience(item.id);
      if (result.ok) onDeleted();
      else {
        setError(result.message);
        setConfirming(false);
      }
    });

  return (
    <li className={`rounded-xl border border-border p-4 transition-opacity ${pending ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold">{item.title}</p>
          <p className="text-xs text-muted">
            {[item.org, formatPeriod(item)].filter(Boolean).join(" · ")}
          </p>
          {item.location && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={11} /> {item.location}
            </p>
          )}
          {item.description && (
            <p className="line-clamp-2 pt-1 text-xs leading-relaxed text-muted">{item.description}</p>
          )}
          {error && <p className="text-[11px] text-primary">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-muted">Delete?</span>
              <button type="button" onClick={remove} disabled={pending} className={`${ghostBtn} border-primary text-primary`}>
                {pending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Yes, delete
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={ghostBtn}>
                Cancel
              </button>
            </>
          ) : (
            <>
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
                aria-label={`Delete ${item.title}`}
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

function toValues(entry?: Experience): ExperienceValues {
  return {
    title: entry?.title ?? "",
    org: entry?.org ?? "",
    location: entry?.location ?? "",
    description: entry?.description ?? "",
    startMonth: entry?.startMonth ? String(entry.startMonth) : "",
    startYear: entry ? String(entry.startYear) : "",
    endMonth: entry?.endMonth ? String(entry.endMonth) : "",
    endYear: entry?.endYear ? String(entry.endYear) : "",
    current: entry ? entry.endYear === null : false,
  };
}

function ExperienceForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry?: Experience;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveExperience, undefined);
  const [seen, setSeen] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  // Show what was submitted after a failed save; React resets the form otherwise.
  const values = state && !state.ok ? state.values : toValues(entry);
  const errors = state && !state.ok ? state.errors : undefined;
  const [current, setCurrent] = useState(values.current);

  if (state !== seen) {
    setSeen(state);
    if (state && !state.ok) setCurrent(state.values.current);
  }

  useEffect(() => {
    if (state?.ok) onSaved(state.message);
  }, [state, onSaved]);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus();
  }, []);

  const field = (name: Exclude<ExperienceField, "current">) => ({
    id: `${entry?.id ?? "new"}-${name}`,
    name,
    defaultValue: values[name],
    "aria-invalid": errors?.[name] ? true : undefined,
    className: `${inputClass} ${errors?.[name] ? "border-primary" : "border-border"}`,
  });

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="space-y-5 rounded-xl border border-primary/40 bg-surface p-4 sm:p-5"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-muted">
        {entry ? "Edit experience" : "New experience"}
      </p>
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Job title" htmlFor={field("title").id} error={errors?.title} className="sm:col-span-2">
          <input {...field("title")} maxLength={EXPERIENCE_LIMITS.title} placeholder="e.g. College Lecturer" required />
        </Field>
        <Field label="Company / school" htmlFor={field("org").id} error={errors?.org}>
          <input {...field("org")} maxLength={EXPERIENCE_LIMITS.org} placeholder="e.g. DLSP" />
        </Field>
        <Field label="Location" htmlFor={field("location").id} error={errors?.location}>
          <input {...field("location")} maxLength={EXPERIENCE_LIMITS.location} placeholder="e.g. San Pablo City, Laguna" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <DateField label="Start" prefix="start" field={field} error={errors?.startYear} />
        <div className="space-y-2">
          <DateField label="End" prefix="end" field={field} error={errors?.endYear} disabled={current} />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              name="current"
              checked={current}
              onChange={(e) => setCurrent(e.target.checked)}
              className="accent-primary"
            />
            I still work here (shows “Present”)
          </label>
        </div>
      </div>

      <Field
        label="Description"
        htmlFor={field("description").id}
        hint="What you did there. Optional."
        error={errors?.description}
      >
        <textarea
          {...field("description")}
          rows={4}
          maxLength={EXPERIENCE_LIMITS.description}
          className={`${field("description").className} min-h-28 resize-y leading-relaxed`}
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-xs text-primary">
          {state && !state.ok ? state.message : ""}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className={`${ghostBtn} px-4 py-2.5`}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="gradient-bg flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {pending ? "Saving…" : entry ? "Save changes" : "Add entry"}
          </button>
        </div>
      </div>
    </form>
  );
}

function DateField({
  label,
  prefix,
  field,
  error,
  disabled,
}: {
  label: string;
  prefix: "start" | "end";
  field: (name: "startMonth" | "startYear" | "endMonth" | "endYear") => {
    id: string;
    name: string;
    defaultValue: string;
    className: string;
    "aria-invalid"?: boolean;
  };
  error?: string;
  disabled?: boolean;
}) {
  const month = field(`${prefix}Month`);
  const year = field(`${prefix}Year`);
  return (
    <fieldset className="space-y-1.5" disabled={disabled}>
      <legend className="mb-1.5 text-xs font-semibold">{label}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <select {...month} aria-label={`${label} month`}>
          <option value="">Month (optional)</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          {...year}
          type="number"
          inputMode="numeric"
          min={MIN_YEAR}
          max={MAX_YEAR}
          placeholder="Year"
          aria-label={`${label} year`}
        />
      </div>
      {error && <p className="text-[11px] text-primary">{error}</p>}
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-primary">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
