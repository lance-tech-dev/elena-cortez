"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateProfile } from "./actions";
import { PROFILE_LIMITS, type ProfileField, type ProfileValues } from "./fields";

const inputClass =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary aria-[invalid=true]:border-primary";

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [dirty, setDirty] = useState(false);
  const [bioLength, setBioLength] = useState(initial.bio.length);
  const [seen, setSeen] = useState(state);

  // After a successful save the form matches what's stored again.
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setDirty(false);
  }

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // React resets the form after an action; show what was submitted, not the old values.
  const values = state?.values ?? initial;
  const errors = state && !state.ok ? state.errors : undefined;

  const field = (name: ProfileField) => ({
    id: name,
    name,
    defaultValue: values[name],
    maxLength: PROFILE_LIMITS[name],
    "aria-invalid": errors?.[name] ? true : undefined,
    "aria-describedby": errors?.[name] ? `${name}-error` : undefined,
    className: `${inputClass} ${errors?.[name] ? "border-primary" : "border-border"}`,
  });

  return (
    <form
      action={action}
      onChange={() => setDirty(true)}
      className="space-y-10"
      noValidate
    >
      <Section title="Identity" description="Your name and headline at the top of the home page.">
        <Field label="Name" name="name" error={errors?.name}>
          <input {...field("name")} autoComplete="name" required />
        </Field>
        <Field label="Headline" name="role" hint="Shown under your name, e.g. “IT Professional”." error={errors?.role}>
          <input {...field("role")} />
        </Field>
      </Section>

      <Section title="About" description="The description on the home and About pages.">
        <Field
          label="Description"
          name="bio"
          hint="Leave a blank line between paragraphs."
          counter={`${bioLength}/${PROFILE_LIMITS.bio}`}
          error={errors?.bio}
        >
          <textarea
            {...field("bio")}
            rows={8}
            onChange={(e) => setBioLength(e.target.value.length)}
            className={`${field("bio").className} min-h-40 resize-y leading-relaxed`}
          />
        </Field>
        <Field label="Tagline" name="tagline" hint="One line shown after the description." error={errors?.tagline}>
          <input {...field("tagline")} />
        </Field>
      </Section>

      <Section title="Contact & status" description="Shown on the home and Contact pages.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" name="email" error={errors?.email} className="sm:col-span-2">
            <input {...field("email")} type="email" autoComplete="email" />
          </Field>
          <Field label="Location" name="location" error={errors?.location}>
            <input {...field("location")} />
          </Field>
          <Field label="Status" name="status" hint="e.g. “Open to opportunities”." error={errors?.status}>
            <input {...field("status")} />
          </Field>
        </div>
      </Section>

      {/* Save bar: sticks to the bottom of the screen while there are changes. */}
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/90 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:px-0">
        <p
          aria-live="polite"
          className={`flex items-center gap-1.5 text-xs ${state && !state.ok ? "text-primary" : "text-muted"}`}
        >
          {state?.ok && !dirty && <Check size={12} />}
          {dirty ? "Unsaved changes" : (state?.message ?? "All changes saved")}
        </p>
        <button
          type="submit"
          disabled={pending || !dirty}
          className="gradient-bg flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-5 space-y-1">
        <span className="block text-xs font-bold uppercase tracking-widest text-muted">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  hint,
  counter,
  error,
  className = "",
  children,
}: {
  label: string;
  name: ProfileField;
  hint?: string;
  counter?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={name} className="text-xs font-semibold">
          {label}
        </label>
        {counter && <span className="text-[10px] text-muted tabular-nums">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-[11px] text-primary">
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}
