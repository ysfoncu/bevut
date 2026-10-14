import type { ReactNode } from "react";

export interface SummaryEntry {
  label: string; // chosen level, e.g. "Høy måloppnåelse"
  person: string; // full name of whoever saved the score last
  className: string; // role colour classes
}

interface AssessmentSummaryProps {
  caption: string;
  categoryHeading: ReactNode;
  // Column headings, one per role: student, supervisor, teacher (final grading)
  columns: { key: string; heading: ReactNode }[];
  rows: { title: string; cells: SummaryEntry[][] }[];
  emptyText: string;
}

// Hovedkategori × role: each cell shows only the level the role chose (the grader is in the tooltip / screen-reader text).
export function AssessmentSummary({ caption, categoryHeading, columns, rows, emptyText }: AssessmentSummaryProps) {
  return (
    <>
      {/* Below md: one card per category with labelled values (no horizontal scrolling) */}
      <ul className="md:hidden space-y-3" aria-label={caption}>
        {rows.map((row, i) => (
          <li key={i} className="border border-gray-300 rounded-lg p-3">
            <p className="text-sm font-semibold text-gray-900 mb-2">{row.title}</p>
            <dl className="space-y-2">
              {row.cells.map((entries, ci) => (
                <div key={columns[ci].key}>
                  <dt className="text-xs text-gray-600">{columns[ci].heading}</dt>
                  <dd className="mt-0.5">
                    {entries.length === 0 ? (
                      <span className="text-sm text-gray-500">{emptyText}</span>
                    ) : (
                      <span
                        title={entries[0].person}
                        className={`inline-block text-sm font-medium rounded border px-2 py-0.5 ${entries[0].className}`}
                      >
                        {entries[0].label}
                        <span className="sr-only">, {entries[0].person}</span>
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    <div className="hidden md:block overflow-x-auto" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full border-collapse border border-gray-300">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-gray-50">
            <th scope="col" className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              {categoryHeading}
            </th>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="border border-gray-300 px-3 py-3 text-left text-sm font-semibold text-gray-900">
                {c.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 align-top">
              <th scope="row" className="border border-gray-300 px-4 py-3 text-left text-sm font-normal text-gray-900">
                {row.title}
              </th>
              {row.cells.map((entries, ci) => (
                <td key={columns[ci].key} className="border border-gray-300 px-3 py-3">
                  {entries.length === 0 ? (
                    <span className="text-sm text-gray-500" aria-label={emptyText}>—</span>
                  ) : (
                    <span
                      title={entries[0].person}
                      className={`inline-block text-sm font-medium rounded border px-2 py-0.5 ${entries[0].className}`}
                    >
                      {entries[0].label}
                      <span className="sr-only">, {entries[0].person}</span>
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
