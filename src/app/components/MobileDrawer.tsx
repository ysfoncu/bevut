import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  id: string;
  // Element that opened the drawer; focus returns here on close (Safari does not focus buttons on click).
  returnFocusTo?: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}

// Left drawer for small screens: role=dialog, focus moves in and is trapped, Esc / backdrop close it,
// the page behind does not scroll, and focus returns to the trigger on close.
export function MobileDrawer({ open, onClose, title, closeLabel, id, returnFocusTo, children }: MobileDrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    trigger.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the current step (aria-current) or the first control.
    const current = panel.current?.querySelector<HTMLElement>('[aria-current="page"]');
    (current ?? panel.current?.querySelector<HTMLElement>("button"))?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      ((returnFocusTo?.current ?? trigger.current) as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select, textarea"));
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
    <div className="fixed inset-0 z-40 md:hidden" onKeyDown={keyDown}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
