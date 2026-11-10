"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { formatIssued, type Certificate } from "@/lib/certificate-format";
import { deleteCertificate, saveCertificate } from "./actions";
import { CERTIFICATE_LIMITS, type CertificateField, type CertificateValues } from "./fields";

const inputClass =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary";

const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

/** "new" = the add form is open; an id = that certificate is being edited. */
type Editing = "new" | string | null;

export function CertificateManager({ items, readOnly }: { items: Certificate[]; readOnly: boolean }) {
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
          {notice ?? `${items.length} ${items.length === 1 ? "certificate" : "certificates"}`}
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
            <Plus size={14} /> Add certificate
          </button>
        )}
      </div>

      {editing === "new" && <CertificateForm key="new" onCancel={() => setEditing(null)} onSaved={done} />}

      {items.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-xs text-muted">
          No certificates yet. Add your first one.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) =>
            editing === item.id ? (
              <li key={item.id}>
                <CertificateForm entry={item} onCancel={() => setEditing(null)} onSaved={done} />
              </li>
            ) : (
              <CertificateItem
                key={item.id}
                item={item}
                readOnly={readOnly}
                onEdit={() => {
                  setEditing(item.id);
                  setNotice(null);
                }}
                onDeleted={() => setNotice("Certificate deleted.")}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function CertificateItem({
  item,
  readOnly,
  onEdit,
  onDeleted,
}: {
  item: Certificate;
  readOnly: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteCertificate(item.id);
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
          <p className="text-xs text-muted">{[item.issuer, formatIssued(item.issuedOn)].filter(Boolean).join(" · ")}</p>
          {item.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>}
          {item.credentialUrl && (
            <a
              href={item.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted underline decoration-border underline-offset-4 hover:text-primary"
            >
              View credential <ExternalLink size={11} />
            </a>
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

function toValues(entry?: Certificate): CertificateValues {
  return {
    title: entry?.title ?? "",
    issuer: entry?.issuer ?? "",
    description: entry?.description ?? "",
    issuedOn: entry?.issuedOn ?? "",
    credentialUrl: entry?.credentialUrl ?? "",
  };
}

function CertificateForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry?: Certificate;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(saveCertificate, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Show what was submitted after a failed save; React resets the form otherwise.
  const values = state && !state.ok ? state.values : toValues(entry);
  const errors = state && !state.ok ? state.errors : undefined;

  useEffect(() => {
    if (state?.ok) onSaved(state.message);
  }, [state, onSaved]);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus();
  }, []);

  const field = (name: CertificateField) => ({
    id: `${entry?.id ?? "new"}-${name}`,
    name,
    defaultValue: values[name],
    maxLength: CERTIFICATE_LIMITS[name],
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
        {entry ? "Edit certificate" : "New certificate"}
      </p>
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor={field("title").id} error={errors?.title} className="sm:col-span-2">
          <input {...field("title")} placeholder="e.g. Ethical Hacking and Data Security Seminar" required />
        </Field>
        <Field label="Issued by" htmlFor={field("issuer").id} hint="Short name shown in the list, e.g. “DLSP”." error={errors?.issuer}>
          <input {...field("issuer")} />
        </Field>
        <Field label="Date" htmlFor={field("issuedOn").id} error={errors?.issuedOn}>
          <input {...field("issuedOn")} type="date" required />
        </Field>
        <Field
          label="Details"
          htmlFor={field("description").id}
          hint="Organizer or department. Optional."
          error={errors?.description}
          className="sm:col-span-2"
        >
          <input {...field("description")} placeholder="e.g. College of Computer Studies and Technology" />
        </Field>
        <Field
          label="Credential link"
          htmlFor={field("credentialUrl").id}
          hint="Optional. Makes the title a link on the site."
          error={errors?.credentialUrl}
          className="sm:col-span-2"
        >
          <input {...field("credentialUrl")} type="url" inputMode="url" placeholder="https://…" />
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
            {pending ? "Saving…" : entry ? "Save changes" : "Add certificate"}
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
