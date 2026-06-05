interface AssessmentQuestionProps {
  title: string;
  godkandText: string;
  underkandText: string;
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  marker: string;
}

export function AssessmentQuestion({
  title,
  godkandText,
  underkandText,
  selectedValue,
  onSelect,
  marker,
}: AssessmentQuestionProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 flex-1">
          {title}
          <span className="text-red-600 ml-2">*</span>
        </h2>
      </div>

      <div className="flex gap-4 items-stretch">
        <div className="flex-1 flex flex-col">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            För godkänt ska studenten:
          </p>
          <div className="flex-1 flex">
            <button
              onClick={() =>
                onSelect(selectedValue === "godkand" ? null : "godkand")
              }
              className={`w-full p-6 border-2 rounded-lg text-left transition-colors cursor-pointer relative ${
                selectedValue === "godkand"
                  ? "bg-green-100 border-green-500 text-gray-900"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-green-50 hover:border-green-500"
              }`}
            >
              {selectedValue === "godkand" && (
                <span className="absolute top-3 right-3 text-lg font-bold text-green-700">{marker}</span>
              )}
              <p className="text-sm leading-relaxed">{godkandText}</p>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Student uppfyller inte kriterierna för godkänd:
          </p>
          <div className="flex-1 flex">
            <button
              onClick={() =>
                onSelect(selectedValue === "underkand" ? null : "underkand")
              }
              className={`w-full p-6 border-2 rounded-lg text-left transition-colors cursor-pointer relative ${
                selectedValue === "underkand"
                  ? "bg-red-100 border-red-500 text-gray-900"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-red-50 hover:border-red-500"
              }`}
            >
              {selectedValue === "underkand" && (
                <span className="absolute top-3 right-3 text-lg font-bold text-red-700">{marker}</span>
              )}
              <p className="text-sm leading-relaxed">{underkandText}</p>
            </button>
          </div>
        </div>
      </div>

      {/* Stamp */}
      {selectedValue && (
        <div className="mt-6 flex items-center gap-3 w-fit">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            VT
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Viktor Torvaldsson
            </p>
            <p className="text-xs text-gray-600">Supervisor</p>
          </div>
          <div className="pl-4">
            <p className="text-sm text-gray-700">2026-06-04</p>
          </div>
        </div>
      )}
    </div>
  );
}
