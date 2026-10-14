import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, Link2, List, ListOrdered } from "lucide-react";

const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "DEL", "BR", "P", "DIV", "UL", "OL", "LI", "SPAN", "H1", "H2", "H3", "A", "FONT",
]);
const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

// Strips everything except a small set of formatting tags; only safe link targets and font sizes keep an attribute.
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const clean = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (!ALLOWED_TAGS.has(el.tagName)) {
          if (["SCRIPT", "STYLE"].includes(el.tagName)) {
            el.remove();
            return;
          }
          clean(el);
          el.replaceWith(...Array.from(el.childNodes));
          return;
        }
        const href = el.tagName === "A" ? el.getAttribute("href") ?? "" : "";
        const size = el.tagName === "FONT" ? el.getAttribute("size") ?? "" : "";
        Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
        if (el.tagName === "A") {
          if (SAFE_HREF.test(href)) {
            el.setAttribute("href", href);
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
          }
        }
        if (el.tagName === "FONT" && /^[1-7]$/.test(size)) el.setAttribute("size", size);
        clean(el);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

// Visible text length (used for the character counter).
export function plainTextLength(html: string): number {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/ /g, " ").trim().length;
}

const RICH_CLASSES =
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_a]:text-blue-700 [&_a]:underline";

// Renders stored text (plain text or rich HTML) as formatted content.
export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={`rich-text ${RICH_CLASSES} ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

const TOOLS = [
  { cmd: "bold", icon: Bold, label: "Fet" },
  { cmd: "italic", icon: Italic, label: "Kursiv" },
  { cmd: "underline", icon: Underline, label: "Understruken" },
  { cmd: "strikeThrough", icon: Strikethrough, label: "Gjennomstreket" },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  autoFocus?: boolean;
  ariaLabel?: string;
}

export function RichTextEditor({ value, onChange, autoFocus = false, ariaLabel }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = sanitizeHtml(value);
      if (autoFocus) {
        ref.current.focus();
        // caret at the end
        const r = document.createRange();
        r.selectNodeContents(ref.current);
        r.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
    }
    // Only initialise once; the editor owns its content afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remember = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (range.current && sel) {
      sel.removeAllRanges();
      sel.addRange(range.current);
    }
  };
  const exec = (cmd: string, arg?: string) => {
    restore();
    document.execCommand(cmd, false, arg);
    remember();
    onChange(ref.current?.innerHTML ?? "");
  };

  const btnClass = "p-1.5 rounded hover:bg-gray-200 text-gray-800";
  const selectClass = "h-8 rounded border border-transparent bg-transparent text-sm text-gray-800 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div className="border border-gray-400 rounded-lg focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 bg-white">
      <div role="toolbar" aria-label="Tekstformatering" className="flex flex-wrap items-center gap-1 p-1.5 border-b border-gray-300 bg-gray-100 rounded-t-lg">
        <select
          aria-label="Avsnittsstil"
          defaultValue="P"
          onChange={(e) => exec("formatBlock", e.target.value)}
          className={selectClass}
        >
          <option value="P">Avsnitt</option>
          <option value="H1">Overskrift 1</option>
          <option value="H2">Overskrift 2</option>
          <option value="H3">Overskrift 3</option>
        </select>
        <span aria-hidden="true" className="w-px h-5 bg-gray-300 mx-0.5" />
        {TOOLS.map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
            className={btnClass}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <select
          aria-label="Tekststørrelse"
          defaultValue="3"
          onChange={(e) => exec("fontSize", e.target.value)}
          className={selectClass}
        >
          <option value="2">Liten</option>
          <option value="3">Normal</option>
          <option value="5">Stor</option>
        </select>
        <button
          type="button"
          title="Lenke"
          aria-label="Lenke"
          onMouseDown={(e) => {
            e.preventDefault();
            remember();
            const url = window.prompt("Lenke (https://…)");
            if (url && SAFE_HREF.test(url.trim())) exec("createLink", url.trim());
          }}
          className={btnClass}
        >
          <Link2 className="w-4 h-4" />
        </button>
        {[
          { cmd: "insertUnorderedList", icon: List, label: "Punktliste" },
          { cmd: "insertOrderedList", icon: ListOrdered, label: "Nummerert liste" },
        ].map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
            className={btnClass}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        suppressContentEditableWarning
        onInput={() => {
          remember();
          onChange(ref.current?.innerHTML ?? "");
        }}
        onKeyUp={remember}
        onMouseUp={remember}
        className={`min-h-[120px] max-h-[50vh] overflow-auto px-3 py-3 text-sm text-gray-900 focus:outline-none ${RICH_CLASSES}`}
      />
    </div>
  );
}
