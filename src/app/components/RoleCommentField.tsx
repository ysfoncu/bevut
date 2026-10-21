import { useEffect, useRef, useState } from "react";
import { RichText, RichTextEditor, plainTextLength } from "./RichText";

export const MAX_COMMENT_LENGTH = 10000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];

// "2026-10-12" → "Okt. 12"
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return m && d ? `${MONTHS[m - 1]}. ${d}` : "";
}

// "2026-10-12" → "12.10.2026"
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}` : "";
}

// ISO timestamp → "12.10.2026 14:32" (local time)
export function formatDateTime(iso: string): string {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

interface RoleCommentFieldProps {
  id: string;
  label: string;
  value: string;
  // This role may edit the field (own field, not yet submitted, not template mode).
  editable: boolean;
  // Published: submitted (student/supervisor) or signed (teacher). Shown as a comment card.
  published: boolean;
  person: { name: string; initials: string; avatar: string };
  badge: string;
  badgeClass: string;
  // ISO date the comment was published
  publishedAt: string;
  placeholder: string;
  emptyText: string;
  saveLabel: string;
  cancelLabel: string;
  unsavedLabel: string;
  // Mandatory and still empty: shown with a red border.
  invalid?: boolean;
  onSave: (html: string) => void;
}

const isEmpty = (html: string) => plainTextLength(html) === 0;

// Three states: idle (click to edit) → editing (rich editor + Lagre/Avbryt + counter) → published (comment card).
export function RoleCommentField({
  id,
  label,
  value,
  editable,
  published,
  person,
  badge,
  badgeClass,
  publishedAt,
  placeholder,
  emptyText,
  saveLabel,
  cancelLabel,
  unsavedLabel,
  invalid = false,
  onSave,
}: RoleCommentFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const latest = useRef({ editing, draft, value, onSave });
  latest.current = { editing, draft, value, onSave };

  // Leaving the page with an open, changed draft keeps it (so nothing is lost silently).
  useEffect(
    () => () => {
      const l = latest.current;
      if (l.editing && l.draft !== l.value && plainTextLength(l.draft) <= MAX_COMMENT_LENGTH) l.onSave(l.draft);
    },
    []
  );

  const length = plainTextLength(draft);
  const over = length > MAX_COMMENT_LENGTH;
  const dirty = draft !== value;

  const open = () => {
    setDraft(value);
    setEditing(true);
  };

  if (published) {
    return (
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 ${person.avatar} rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`} aria-hidden="true">
          {person.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold text-gray-900">{person.name}</span>
            <span className={`ml-3 font-medium ${badgeClass}`}>{badge}</span>
            {publishedAt && <span className="ml-3 text-gray-500">- {formatShortDate(publishedAt)}</span>}
          </p>
          <div id={id} className="mt-0.5 text-sm text-gray-600 leading-relaxed">
            {isEmpty(value) ? <span className="italic text-gray-500">{emptyText}</span> : <RichText html={value} />}
          </div>
        </div>
      </div>
    );
  }

  if (editable && editing) {
    return (
      <div>
        <RichTextEditor value={draft} onChange={setDraft} autoFocus ariaLabel={label} />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={over}
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {saveLabel}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-1.5 text-sm font-medium text-gray-900 rounded hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
        </div>
        <p className={`mt-2 text-xs ${over ? "text-red-700 font-semibold" : "text-gray-500"}`} aria-live="polite">
          {length}/{MAX_COMMENT_LENGTH}
          {dirty && !over && <span className="ml-3 text-amber-700">{unsavedLabel}</span>}
        </p>
      </div>
    );
  }

  // Idle: looks like the previous text box; click (or Enter/Space) opens the editor.
  const empty = isEmpty(value);
  return (
    <div
      id={id}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={editable ? label : undefined}
      aria-invalid={invalid && empty ? true : undefined}
      onClick={editable ? open : undefined}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
      className={`w-full min-h-[6.5rem] px-4 py-2 border rounded-lg text-sm ${
        editable
          ? `${invalid && empty ? "border-red-600 border-2" : "border-gray-500"} bg-white cursor-text focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`
          : "bg-gray-50 border-gray-400 cursor-default"
      }`}
    >
      {empty ? <span className="text-gray-500">{editable ? placeholder : ""}</span> : <RichText html={value} className="text-gray-900" />}
    </div>
  );
}
