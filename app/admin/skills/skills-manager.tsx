"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { SkillGroup } from "@/lib/skills";
import { deleteSkillGroup, reorderSkillGroups, saveSkillGroup, type SaveResult } from "./actions";
import { SKILL_LIMITS } from "./fields";
import { ChipInput, mergeChips, splitChips } from "../chip-input";

const inputClass =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary";

const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted";

/** "new" = the add form is open; an id = that group is being edited. */
type Editing = "new" | string | null;

export function SkillsManager({ groups, readOnly }: { groups: SkillGroup[]; readOnly: boolean }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ordered, setOrdered] = useOptimistic(groups);
  const [reordering, startReorder] = useTransition();

  const done = (message: string) => {
    setEditing(null);
    setNotice(message);
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...ordered];
    const [group] = next.splice(index, 1);
    next.splice(index + by, 0, group!);
    setNotice(null);
    startReorder(async () => {
      setOrdered(next);
      const result = await reorderSkillGroups(next.map((g) => g.id));
      if (!result.ok) setNotice(result.message);
    });
  };

  const skillCount = ordered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted">
          {notice ??
            `${ordered.length} ${ordered.length === 1 ? "group" : "groups"} · ${skillCount} ${skillCount === 1 ? "skill" : "skills"}`}
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
            <Plus size={14} /> Add group
          </button>
        )}
      </div>

      {editing === "new" && <GroupForm key="new" onCancel={() => setEditing(null)} onSaved={done} />}

      {ordered.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-xs text-muted">
          No skills yet. Add your first group, e.g. “IT &amp; Networking”.
        </div>
      ) : (
        <ul className="space-y-3">
          {ordered.map((group, i) =>
            editing === group.id ? (
              <li key={group.id}>
                <GroupForm group={group} onCancel={() => setEditing(null)} onSaved={done} />
              </li>
            ) : (
              <GroupItem
                key={group.id}
                group={group}
                readOnly={readOnly}
                busy={reordering}
                canMoveUp={i > 0}
                canMoveDown={i < ordered.length - 1}
                onMove={(by) => move(i, by)}
                onEdit={() => {
                  setEditing(group.id);
                  setNotice(null);
                }}
                onDeleted={() => setNotice("Group deleted.")}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function GroupItem({
  group,
  readOnly,
  busy,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
  onDeleted,
}: {
  group: SkillGroup;
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
      const result = await deleteSkillGroup(group.id);
      if (result.ok) onDeleted();
      else {
        setError(result.message);
        setConfirming(false);
      }
    });

  return (
    <li className={`rounded-xl border border-border p-4 transition-opacity ${pending ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-bold">{group.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((skill) => (
              <span key={skill} className="rounded-md border border-border px-2.5 py-1 text-xs">
                {skill}
              </span>
            ))}
          </div>
          {error && <p className="text-[11px] text-primary">{error}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-muted">Delete group?</span>
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
                aria-label={`Move ${group.title} up`}
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={readOnly || busy || !canMoveDown}
                className={ghostBtn}
                aria-label={`Move ${group.title} down`}
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
                aria-label={`Delete ${group.title}`}
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

function GroupForm({
  group,
  onCancel,
  onSaved,
}: {
  group?: SkillGroup;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [title, setTitle] = useState(group?.title ?? "");
  const [skills, setSkills] = useState<string[]>(group?.items ?? []);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const errors = result && !result.ok ? result.errors : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include whatever is still typed in the skill box.
    const all = mergeChips(skills, splitChips(draft));
    setSkills(all);
    setDraft("");

    startTransition(async () => {
      const res = await saveSkillGroup({ id: group?.id, title, skills: all });
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
      <p className="text-xs font-bold uppercase tracking-widest text-muted">{group ? "Edit group" : "New group"}</p>

      <div className="space-y-1.5">
        <label htmlFor={`${group?.id ?? "new"}-title`} className="text-xs font-semibold">
          Group name
        </label>
        <input
          ref={titleRef}
          id={`${group?.id ?? "new"}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={SKILL_LIMITS.title}
          placeholder="e.g. IT & Networking"
          aria-invalid={errors?.title ? true : undefined}
          className={`${inputClass} ${errors?.title ? "border-primary" : "border-border"}`}
        />
        {errors?.title && <p className="text-[11px] text-primary">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${group?.id ?? "new"}-skill`} className="text-xs font-semibold">
          Skills
        </label>
        <ChipInput
          id={`${group?.id ?? "new"}-skill`}
          value={skills}
          onChange={setSkills}
          draft={draft}
          onDraftChange={setDraft}
          maxLength={SKILL_LIMITS.skill}
          invalid={Boolean(errors?.skills)}
          placeholder="Type a skill and press Enter"
        />
        {errors?.skills ? (
          <p className="text-[11px] text-primary">{errors.skills}</p>
        ) : (
          <p className="text-[11px] text-muted">
            Press Enter or type a comma to add. Paste a list to add many at once. Drag to reorder.
          </p>
        )}
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
            disabled={pending}
            className="gradient-bg flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {pending ? "Saving…" : group ? "Save changes" : "Add group"}
          </button>
        </div>
      </div>
    </form>
  );
}
