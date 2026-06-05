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
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Bedömningskriterier
            </th>
            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              Godkänt
            </th>
            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
              Student uppfyller inte kriterierna för godkänd
            </th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((assessment, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                {assessment.title}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-lg font-bold text-gray-900">
                {assessment.selectedValue === "godkand"
                  ? marker
                  : ""}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-lg font-bold text-gray-900">
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