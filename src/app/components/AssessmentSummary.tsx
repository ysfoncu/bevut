interface AssessmentSummaryProps {
  assessments: {
    title: string;
    selectedValue: string | null;
  }[];
  marker: string;
  // Template-driven column headings; fall back to the built-in defaults when not provided.
  larandemalHeading?: React.ReactNode;
  passHeading?: React.ReactNode;
  failHeading?: React.ReactNode;
}

export function AssessmentSummary({
  assessments,
  marker,
  larandemalHeading,
  passHeading,
  failHeading,
}: AssessmentSummaryProps) {
  // marker "O" == Halvtidsbedömning (midterm), "X" == Slutbedömning (endterm)
  const isMidterm = marker === "O";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              {larandemalHeading ?? "Lärandemål"}
            </th>
            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              {passHeading ?? (isMidterm ? "Betryggande utveckling" : "Godkänt")}
            </th>
            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              {failHeading ?? (isMidterm ? "Ej betryggande utveckling" : "Student uppfyller inte kriterierna för godkänd")}
            </th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((assessment, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                {assessment.title}
              </td>
              <td
                className={`border border-gray-300 px-4 py-3 text-center text-lg font-bold ${
                  assessment.selectedValue === "godkand"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-900"
                }`}
              >
                {assessment.selectedValue === "godkand"
                  ? marker
                  : ""}
              </td>
              <td
                className={`border border-gray-300 px-4 py-3 text-center text-lg font-bold ${
                  assessment.selectedValue === "underkand"
                    ? "bg-red-100 text-red-700"
                    : "text-gray-900"
                }`}
              >
                {assessment.selectedValue === "underkand"
                  ? marker
                  : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}