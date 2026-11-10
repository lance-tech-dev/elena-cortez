"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Award } from "@/lib/awards";
import { deleteAward, reorderAwards, saveAward } from "./actions";
import { AWARD_LIMITS, MAX_YEAR, MIN_YEAR, type AwardField, type AwardValues } from "./fields";

const inputClass =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary";

const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted";

/** "new" = the add form is open; an id = that award is being edited. */
type Editing = "new" | string | null;

export function AwardsManager({ awards, readOnly }: { awards: Award[]; readOnly: boolean }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ordered, setOrdered] = useOptimistic(awards);
  const [reordering, startReorder] = useTransition();

  const done = (message: string) => {
    setEditing(null);
    setNotice(message);
  };

  // Year decides the order first, so arrows only swap awards from the same year.
  const move = (index: number, by: -1 | 1) => {
    const next = [...ordered];
    [next[index], next[index + by]] = [next[index + by]!, next[index]!];
    setNotice(null);
    startReorder(async () => {
      setOrdered(next);
      const result = await reorderAwards(next.map((a) => a.id));
      if (!result.ok) setNotice(result.message);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted">
          {notice ?? `${ordered.length} ${ordered.length === 1 ? "award" : "awards"}`}
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
            <Plus size={14} /> Add award
          </button>
        )}
      </div>

      {editing === "new" && <AwardForm key="new" onCancel={() => setEditing(null)} onSaved={done} />}

      {ordered.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-xs text-muted">
          No awards yet. Add your first one.
        </div>
      ) : (
        <ul className="space-y-3">
          {ordered.map((award, i) =>
            editing === award.id ? (
              <li key={award.id}>
                <AwardForm award={award} onCancel={() => setEditing(null)} onSaved={done} />
              </li>
            ) : (
              <AwardItem
                key={award.id}
                award={award}
                readOnly={readOnly}
                busy={reordering}
                canMoveUp={ordered[i - 1]?.year === award.year}
                canMoveDown={ordered[i + 1]?.year === award.year}
                onMove={(by) => move(i, by)}
                onEdit={() => {
                  setEditing(award.id);
                  setNotice(null);
                }}
                onDeleted={() => setNotice("Award deleted.")}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function AwardItem({
  award,
  readOnly,
  busy,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
  onDeleted,
}: {
  award: Award;
  readOnly: boolean;
  busy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (by: -1 | 1) => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteAward(award.id);
      if (result.ok) onDeleted();
      else {
        setError(result.message);
        setConfirming(false);
      }
    });

  return (
    <li className={`rounded-xl border border-border p-4 transition-opacity ${pending ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="w-10 shrink-0 pt-0.5 text-xs text-muted tabular-nums">{award.year}</span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold">{award.title}</p>
            {award.org && <p className="text-xs text-muted">{award.org}</p>}
            {award.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted">{award.description}</p>}
            {error && <p className="text-[11px] text-primary">{error}</p>}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={readOnly || busy || !canMoveUp}
                className={ghostBtn}
                aria-label={`Move ${award.title} up`}
                title={canMoveUp ? "Move up" : "Awards are sorted by year; this one is first in its year"}
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={readOnly || busy || !canMoveDown}
                className={ghostBtn}
                aria-label={`Move ${award.title} down`}
                title={canMoveDown ? "Move down" : "Awards are sorted by year; this one is last in its year"}
              >
                <ArrowDown size={12} />
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
                aria-label={`Delete ${award.title}`}
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

function AwardForm({
  award,
  onCancel,
  onSaved,
}: {
  award?: Award;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveAward, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Show what was submitted after a failed save; React resets the form otherwise.
  const values: AwardValues =
    state && !state.ok
      ? state.values
      : {
          title: award?.title ?? "",
          org: award?.org ?? "",
          year: award ? String(award.year) : "",
          description: award?.description ?? "",
        };
  const errors = state && !state.ok ? state.errors : undefined;

  useEffect(() => {
    if (state?.ok) onSaved(state.message);
  }, [state, onSaved]);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus();
  }, []);

  const field = (name: AwardField) => ({
    id: `${award?.id ?? "new"}-${name}`,
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
      <p className="text-xs font-bold uppercase tracking-widest text-muted">{award ? "Edit award" : "New award"}</p>
      {award && <input type="hidden" name="id" value={award.id} />}

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
        <Field label="Title" htmlFor={field("title").id} error={errors?.title} className="sm:col-span-2">
          <input {...field("title")} maxLength={AWARD_LIMITS.title} placeholder="e.g. Leadership Awardee" required />
        </Field>
        <Field label="Given by" htmlFor={field("org").id} hint="School, office or organization." error={errors?.org}>
          <input {...field("org")} maxLength={AWARD_LIMITS.org} placeholder="e.g. DLSP" />
        </Field>
        <Field label="Year" htmlFor={field("year").id} error={errors?.year}>
          <input
            {...field("year")}
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            placeholder={String(new Date().getFullYear())}
            required
          />
        </Field>
        <Field
          label="Description"
          htmlFor={field("description").id}
          hint="Optional. Shown under the title on the About page."
          error={errors?.description}
          className="sm:col-span-2"
        >
          <input {...field("description")} maxLength={AWARD_LIMITS.description} />
        </Field>
      </div>

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
            {pending ? "Saving…" : award ? "Save changes" : "Add award"}
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
