"use client";

import { useRef, useState } from "react";
import { GripVertical, X } from "lucide-react";

/** Splits pasted or typed text on commas and new lines. */
export function splitChips(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Appends `names` to `current`, skipping ones already there (any case). */
export function mergeChips(current: string[], names: string[]): string[] {
  const have = new Set(current.map((s) => s.toLowerCase()));
  const fresh = names.filter((n) => {
    const key = n.toLowerCase();
    if (have.has(key)) return false;
    have.add(key);
    return true;
  });
  return [...current, ...fresh];
}

/**
 * Editable list of short labels (skills, tags). Enter or a comma adds,
 * pasting a list adds many, × or Backspace removes, drag reorders.
 * `draft` is lifted so the form can include half-typed text on submit.
 */
export function ChipInput({
  id,
  value,
  onChange,
  draft,
  onDraftChange,
  maxLength,
  invalid,
  placeholder = "Type and press Enter",
  morePlaceholder = "Add another…",
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  draft: string;
  onDraftChange: (next: string) => void;
  maxLength: number;
  invalid?: boolean;
  placeholder?: string;
  morePlaceholder?: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (names: string[]) => names.length && onChange(mergeChips(value, names));

  const commitDraft = () => {
    add(splitChips(draft));
    onDraftChange("");
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [chip] = next.splice(from, 1);
    next.splice(to, 0, chip!);
    onChange(next);
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border bg-surface p-2 transition-colors focus-within:border-primary ${
        invalid ? "border-primary" : "border-border"
      }`}
    >
      {value.map((chip, i) => (
        <span
          key={chip}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null) move(dragIndex, i);
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
          className={`inline-flex cursor-grab items-center gap-1 rounded-md border border-border bg-background py-1 pl-1 pr-1.5 text-xs active:cursor-grabbing ${
            dragIndex === i ? "opacity-40" : ""
          }`}
        >
          <GripVertical size={11} className="text-muted" aria-hidden />
          {chip}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((_, j) => j !== i));
            }}
            className="ml-0.5 rounded text-muted transition-colors hover:text-primary"
            aria-label={`Remove ${chip}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        maxLength={maxLength * 4}
        aria-invalid={invalid ? true : undefined}
        onChange={(e) => {
          const text = e.target.value;
          // Typing a comma adds what came before it.
          if (text.includes(",")) {
            const parts = text.split(",");
            add(parts.slice(0, -1).flatMap(splitChips));
            onDraftChange(parts.at(-1) ?? "");
          } else onDraftChange(text);
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (/[,\n]/.test(text)) {
            e.preventDefault();
            add(splitChips(draft + text));
            onDraftChange("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commitDraft}
        placeholder={value.length ? morePlaceholder : placeholder}
        className="min-w-40 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted/60"
      />
    </div>
  );
}
