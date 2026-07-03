interface AssessmentSummaryProps {
  assessments: {
    title: string;
    selectedValue: string | null;
  }[];
  marker: string;
}

export function AssessmentSummary({
  assessments,
  marker,
}: AssessmentSummaryProps) {
  // marker "O" == Halvtidsbedömning (midterm), "X" == Slutbedömning (endterm)
  const isMidterm = marker === "O";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Lärandemål
            </th>
            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              {isMidterm ? "Betryggande utveckling" : "Godkänt"}
            </th>
            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              {isMidterm ? "Ej betryggande utveckling" : "Student uppfyller inte kriterierna för godkänd"}
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