import { useEffect, useRef, useState, type ReactNode } from "react";

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Modal for irreversible actions (in the real app this is where the e-mailed code is entered): focus starts on Cancel, Tab is trapped, Esc closes, focus returns to the trigger.
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<Element | null>(document.activeElement);

  useEffect(() => {
    const el = trigger.current as HTMLElement | null;
    return () => el?.focus?.();
  }, []);

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key !== "Tab" || !box.current) return;
    const items = Array.from(box.current.querySelectorAll<HTMLElement>('button, input, [href], [tabindex]:not([tabindex="-1"])'));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onKeyDown={keyDown}>
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cf-title"
        aria-describedby="cf-body"
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <h2 id="cf-title" className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
        <div id="cf-body" className="text-sm text-gray-700 mb-6 space-y-2">{body}</div>
        <div className="flex justify-end gap-2">
          <button
            autoFocus
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-400 rounded-lg hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
