import { useId, type ReactNode } from "react";

export interface LikertLevel {
  label: ReactNode;
  description: ReactNode;
}

interface LikertScaleProps {
  levels: LikertLevel[];
  value: number | null;
  onChange: (value: number | null) => void;
  readOnly?: boolean;
  // Accessible name for the radiogroup (the category title).
  ariaLabel: string;
  invalid?: boolean;
  // Display only (e.g. the halvtid result): no radios, just the coloured scale with name chips.
  display?: boolean;
  // Colour of the selected step (the selecting role's colour): fill, border and label text classes.
  selectedFill?: string;
  selectedBorder?: string;
  selectedTextClass?: string;
  // Optional marker shown on the line, e.g. the midterm score while scoring the endterm.
  // Name chips under a step. `fill` (fill + border classes of a role) makes that role's visible selection colour the circle itself;
  // chips without it (your own chip, the midterm "O") are labels only.
  markers?: { value: number | null; text: string; title: string; className?: string; fill?: string }[];
}

// Five-step scoring line: label above, node on the line, definition below.
// Stacks vertically (node left, text right) below the sm breakpoint.
export function LikertScale({
  levels,
  value,
  onChange,
  readOnly = false,
  ariaLabel,
  invalid = false,
  display = false,
  selectedFill = "bg-blue-600",
  selectedBorder = "border-blue-600",
  selectedTextClass = "text-blue-700",
  markers = [],
}: LikertScaleProps) {
  const uid = useId();
  const focusable = value ?? 0;

  const move = (e: React.KeyboardEvent, index: number) => {
    if (readOnly) return;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % levels.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + levels.length) % levels.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = levels.length - 1;
    else return;
    e.preventDefault();
    onChange(next);
    const radios = e.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll<HTMLElement>('[role="radio"]');
    radios?.[next]?.focus();
  };

  return (
    <div
      role={display ? undefined : "radiogroup"}
      aria-label={display ? undefined : ariaLabel}
      aria-hidden={display || undefined}
      aria-readonly={!display && readOnly ? true : undefined}
      className={`relative rounded-lg ${invalid ? "ring-2 ring-red-400 ring-offset-4" : ""}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-5">
        {levels.map((level, i) => {
          const selected = value === i;
          const labelId = `${uid}-l${i}`;
          const descId = `${uid}-d${i}`;
          const stepMarkers = markers.filter((m) => m.value === i);
          // Circle colour: my own selection = filled in my role colour; another role's visible selection = filled in that role's colour;
          // two or more roles on the same level = green.
          const others = stepMarkers.filter((m) => m.fill);
          const selectors = (selected ? 1 : 0) + others.length;
          const clickable = readOnly ? "cursor-default" : "cursor-pointer";
          const circleClass =
            selectors >= 2
              ? `bg-green-600 border-2 border-green-600 ${clickable}`
              : selected
                ? `${selectedFill} border-2 ${selectedBorder}`
                : others.length
                  ? `${others[0].fill} border-2 ${clickable}`
                  : `bg-white border-2 border-gray-500 ${readOnly ? "cursor-default" : "cursor-pointer hover:border-blue-600 hover:bg-blue-50"}`;
          return (
            // Subgrid (sm and up): label / circle / markers / description rows line up across all five steps.
            <div
              key={i}
              className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 py-2 sm:py-0 sm:px-1.5 sm:grid-cols-1 sm:grid-rows-subgrid sm:row-span-4 sm:gap-y-0 sm:text-center"
            >
              <p
                id={labelId}
                className={`col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto text-sm font-semibold sm:flex sm:items-end sm:justify-center ${selected ? selectedTextClass : "text-gray-800"}`}
              >
                {level.label}
              </p>
              <div className="col-start-1 row-start-1 row-span-3 sm:col-start-auto sm:row-start-auto sm:row-span-1 sm:mt-3 relative sm:w-full flex items-center justify-center h-8">
                {/* connecting line (horizontal layout only) */}
                <span
                  aria-hidden="true"
                  className={`hidden sm:block absolute top-1/2 h-0.5 bg-gray-400 -translate-y-1/2 ${i === 0 ? "left-1/2 -right-1.5" : i === levels.length - 1 ? "-left-1.5 right-1/2" : "-left-1.5 -right-1.5"}`}
                />
                {display ? (
                  <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${circleClass}`} />
                ) : (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-labelledby={labelId}
                  aria-describedby={descId}
                  tabIndex={i === focusable ? 0 : -1}
                  onClick={() => {
                    if (!readOnly && !selected) onChange(i);
                  }}
                  onKeyDown={(e) => move(e, i)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${circleClass}`}
                >
                </button>
                )}
              </div>
              {/* Other people's scores (and the midterm score) on this step — between the circle and the explanation */}
              <div
                className={`col-start-2 row-start-2 sm:col-start-auto sm:row-start-auto flex flex-wrap justify-start sm:justify-center content-start gap-1 ${stepMarkers.length ? "sm:mt-2" : ""}`}
              >
                {stepMarkers.map((m, mi) => (
                  <span
                    key={`${m.text}-${mi}`}
                    title={m.title}
                    className={`text-xs font-bold rounded border px-1.5 py-0.5 ${m.className ?? "bg-gray-100 text-gray-800 border-gray-400"}`}
                  >
                    <span aria-hidden="true">{m.text}</span>
                    <span className="sr-only">{m.title}</span>
                  </span>
                ))}
              </div>
              <p id={descId} className="col-start-2 row-start-3 sm:col-start-auto sm:row-start-auto text-xs text-gray-600 leading-snug sm:mt-3">
                {level.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
