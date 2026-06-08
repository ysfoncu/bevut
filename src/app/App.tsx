import {
  ChevronLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { AssessmentQuestion } from "./components/AssessmentQuestion";
import { AssessmentSummary } from "./components/AssessmentSummary";

export default function App() {
  const [activeSection, setActiveSection] = useState("praksisinformasjon");
  const [activeTerm, setActiveTerm] = useState<"midterm" | "endterm">("midterm");
  const [endtermCreated, setEndtermCreated] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [activeRole, setActiveRole] = useState<"supervisor" | "student" | "teacher">("supervisor");

  // Midterm states
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [selectedAssessment2, setSelectedAssessment2] = useState<string | null>(null);
  const [selectedAssessment3, setSelectedAssessment3] = useState<string | null>(null);
  const [selectedAssessment4, setSelectedAssessment4] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [datumFilled, setDatumFilled] = useState(false);
  const [datum, setDatum] = useState("");
  const [fungeratBra, setFungeratBra] = useState("");
  const [tranaMer, setTranaMer] = useState("");

  // Endterm states
  const [selectedAssessmentEnd, setSelectedAssessmentEnd] = useState<string | null>(null);
  const [selectedAssessment2End, setSelectedAssessment2End] = useState<string | null>(null);
  const [selectedAssessment3End, setSelectedAssessment3End] = useState<string | null>(null);
  const [selectedAssessment4End, setSelectedAssessment4End] = useState<string | null>(null);
  const [isSignedEnd, setIsSignedEnd] = useState(false);
  const [datumFilledEnd, setDatumFilledEnd] = useState(false);
  const [datumEnd, setDatumEnd] = useState("");
  const [fungeratBraEnd, setFungeratBraEnd] = useState("");
  const [fungeratBraEndFilled, setFungeratBraEndFilled] = useState(false);
  const [tranaMerEnd, setTranaMerEnd] = useState("");

  // Shared states
  const [personnummerFilled, setPersonnummerFilled] = useState(false);
  const [akutmottagningFilled, setAkutmottagningFilled] = useState(false);
  const [personnummer, setPersonnummer] = useState("");
  const [akutmottagning, setAkutmottagning] = useState("");
  const [malformuleringssamtal, setMalformuleringssamtal] = useState("");
  const [halvtidsbedomning, setHalvtidsbedomning] = useState("");
  const [slutbedomning, setSlutbedomning] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isStudentSigned, setIsStudentSigned] = useState(false);
  const [isStudentSignedEnd, setIsStudentSignedEnd] = useState(false);

  const validateAllFields = () => {
    const errors = [];
    if (!personnummerFilled) errors.push("praksisinformasjon");
    if (!akutmottagningFilled) errors.push("praksisinformasjon");

    if (activeTerm === "midterm") {
      if (!selectedAssessment) errors.push("bedomningskriterier");
      if (!selectedAssessment2) errors.push("bedomningskriterier");
      if (!selectedAssessment3) errors.push("bedomningskriterier");
      if (!selectedAssessment4) errors.push("bedomningskriterier");
      if (!datumFilled) errors.push("oppsumering");
    } else {
      if (!selectedAssessmentEnd) errors.push("bedomningskriterier");
      if (!selectedAssessment2End) errors.push("bedomningskriterier");
      if (!selectedAssessment3End) errors.push("bedomningskriterier");
      if (!selectedAssessment4End) errors.push("bedomningskriterier");
      if (!datumFilledEnd) errors.push("oppsumering");
      if (!fungeratBraEndFilled) errors.push("oppsumering");
    }
    return errors;
  };

  const handleSign = () => {
    const errors = validateAllFields();
    if (errors.length > 0) {
      setShowValidationErrors(true);
    } else {
      if (activeTerm === "midterm") {
        setIsSigned(true);
        setShowValidationErrors(false);
      } else {
        setIsSignedEnd(true);
        setShowValidationErrors(false);
      }
    }
  };

  const getPraksisinformasjonStatus = () => {
    let mandatoryCount = 0;
    let optionalCount = 0;

    if (!personnummerFilled) mandatoryCount++;
    if (!akutmottagningFilled) mandatoryCount++;

    const totalCount = mandatoryCount + optionalCount;
    return { mandatoryCount, optionalCount, totalCount };
  };

  const getPlaneringStatus = () => {
    let mandatoryCount = 0;
    let optionalCount = 0;

    if (!malformuleringssamtal) optionalCount++;
    if (!halvtidsbedomning) optionalCount++;
    if (!slutbedomning) optionalCount++;

    const totalCount = mandatoryCount + optionalCount;
    return { mandatoryCount, optionalCount, totalCount };
  };

  const getBedomningskriterierStatus = () => {
    let mandatoryCount = 0;
    let optionalCount = 0;

    if (activeTerm === "midterm") {
      if (!selectedAssessment) mandatoryCount++;
      if (!selectedAssessment2) mandatoryCount++;
      if (!selectedAssessment3) mandatoryCount++;
      if (!selectedAssessment4) mandatoryCount++;
    } else {
      if (!selectedAssessmentEnd) mandatoryCount++;
      if (!selectedAssessment2End) mandatoryCount++;
      if (!selectedAssessment3End) mandatoryCount++;
      if (!selectedAssessment4End) mandatoryCount++;
    }

    const totalCount = mandatoryCount + optionalCount;
    return { mandatoryCount, optionalCount, totalCount };
  };

  const getOppsumeringStatus = () => {
    let mandatoryCount = 0;
    let optionalCount = 0;

    if (activeTerm === "midterm") {
      if (!datumFilled) mandatoryCount++;
      if (!fungeratBra) optionalCount++;
      if (!tranaMer) optionalCount++;
    } else {
      if (!datumFilledEnd) mandatoryCount++;
      if (!fungeratBraEndFilled) mandatoryCount++;
    }

    const totalCount = mandatoryCount + optionalCount;
    return { mandatoryCount, optionalCount, totalCount };
  };

  const getSigneringStatus = () => {
    let mandatoryCount = 0;
    let optionalCount = 0;

    if (activeTerm === "midterm") {
      if (!isSigned) mandatoryCount++;
    } else {
      if (!isSignedEnd) mandatoryCount++;
    }

    const totalCount = mandatoryCount + optionalCount;
    return { mandatoryCount, optionalCount, totalCount };
  };

  const supervisorSignedNow = activeTerm === "midterm" ? isSigned : isSignedEnd;

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const rsIcon = (filled: boolean, mandatory: boolean, showForTeacher = false) => {
    if (activeRole !== "supervisor" && !(activeRole === "teacher" && showForTeacher)) return null;
    if (filled) return (
      <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
    if (mandatory) return (
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
    return (
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  };
  const studentSignedNow = activeTerm === "midterm" ? isStudentSigned : isStudentSignedEnd;

  const renderSidebarBadge = (
    type: "regular" | "signering",
    status?: { mandatoryCount: number; optionalCount: number; totalCount: number },
    editableForTeacher = false
  ) => {
    if (activeRole === "teacher" && !editableForTeacher) {
      return (
        <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-gray-500" />
        </div>
      );
    }
    if (activeRole === "student") {
      if (type === "signering") {
        if (!supervisorSignedNow) {
          return (
            <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
        }
        if (!studentSignedNow) {
          return (
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-red-500">
              <span className="text-white font-bold text-sm">1</span>
            </div>
          );
        }
        return (
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-green-500">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-gray-500" />
        </div>
      );
    }
    if (type === "signering") {
      if (!supervisorSignedNow) {
        return (
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-red-500">
            <span className="text-white font-bold text-sm">1</span>
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-green-500">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </div>
      );
    }
    if (!status) return null;
    if (status.mandatoryCount > 0) {
      return (
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-red-500">
          <span className="text-white font-bold text-sm">{status.totalCount}</span>
        </div>
      );
    }
    if (status.optionalCount > 0) {
      return (
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-yellow-500">
          <span className="text-white font-bold text-sm">{status.totalCount}</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-green-500">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      </div>
    );
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              MOSO InPraxis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(["supervisor", "student", "teacher"] as const).map((role) => (
            <button
              key={role}
              onClick={() => { setActiveRole(role); setActiveSection("praksisinformasjon"); setShowValidationErrors(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeRole === role
                  ? "bg-purple-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Page Title with Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="py-4 flex items-center">
          <div className="w-60 px-6 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">
              VURDERING
            </span>
          </div>
          <div className="flex-1 px-8 flex gap-4 items-center">
            <div className="flex gap-4">
              <button
                onClick={() => !readingMode && setActiveTerm("midterm")}
                disabled={readingMode}
                className={`font-bold transition-colors ${
                  readingMode
                    ? "text-gray-300 cursor-default"
                    : activeTerm === "midterm"
                    ? "underline"
                    : "text-gray-500"
                }`}
              >
                Midterm
              </button>
              {endtermCreated && (
                <button
                  onClick={() => !readingMode && setActiveTerm("endterm")}
                  disabled={readingMode}
                  className={`font-bold transition-colors ${
                    readingMode
                      ? "text-gray-300 cursor-default"
                      : activeTerm === "endterm"
                      ? "underline"
                      : "text-gray-500"
                  }`}
                >
                  Endterm
                </button>
              )}
            </div>
            <button
              onClick={() => setReadingMode(!readingMode)}
              className={`ml-auto flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
                readingMode
                  ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Eye className="w-4 h-4" />
              Reading Mode
            </button>
          </div>
        </div>
        <div className="flex">
          <div className="w-60"></div>
        </div>
      </div>

      {/* Main Layout: Left Sidebar + Main Content + Right Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`w-60 bg-white border-r border-gray-200 flex flex-col overflow-auto${readingMode ? " hidden" : ""}`}>
          {/* Student Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3">
                AA
              </div>
              <p className="text-sm font-semibold text-gray-900">Anna Andersson</p>
              <p className="text-xs text-gray-600 mt-1">anna.andersson@student.se</p>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveSection("praksisinformasjon")}
                  className={`w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg ${
                    activeSection === "praksisinformasjon"
                      ? "text-gray-900 bg-gray-100 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${activeRole === "supervisor" && showValidationErrors && (!personnummerFilled || !akutmottagningFilled) ? "border-2 border-red-500" : ""}`}
                >
                  {!readingMode && renderSidebarBadge("regular", getPraksisinformasjonStatus(), true)}
                  <span className="text-left">Praksisinformasjon</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("planering")}
                  className={`w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg ${
                    activeSection === "planering"
                      ? "text-gray-900 bg-gray-100 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {!readingMode && renderSidebarBadge("regular", getPlaneringStatus(), true)}
                  <span className="text-left">Planering</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("bedomningskriterier")}
                  className={`w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg ${
                    activeSection === "bedomningskriterier"
                      ? "text-gray-900 bg-gray-100 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${activeRole === "supervisor" && showValidationErrors && ((activeTerm === "midterm" && (!selectedAssessment || !selectedAssessment2 || !selectedAssessment3 || !selectedAssessment4)) || (activeTerm === "endterm" && (!selectedAssessmentEnd || !selectedAssessment2End || !selectedAssessment3End || !selectedAssessment4End))) ? "border-2 border-red-500" : ""}`}
                >
                  {!readingMode && renderSidebarBadge("regular", getBedomningskriterierStatus())}
                  <span className="text-left">Bedömningskriterier Akutsjukvård</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("oppsumering")}
                  className={`w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg ${
                    activeSection === "oppsumering"
                      ? "text-gray-900 bg-gray-100 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${activeRole === "supervisor" && showValidationErrors && ((activeTerm === "midterm" && !datumFilled) || (activeTerm === "endterm" && !datumFilledEnd)) ? "border-2 border-red-500" : ""}`}
                >
                  {!readingMode && renderSidebarBadge("regular", getOppsumeringStatus())}
                  <span className="text-left">Oppsumering</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("signering")}
                  className={`w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg ${
                    activeSection === "signering"
                      ? "text-gray-900 bg-gray-100 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {!readingMode && renderSidebarBadge("signering")}
                  <span className="text-left">
                    {activeTerm === "midterm" ? "Signering av midterm" : "Signering av sluttvurdering"}
                  </span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Avbryt vurderingsprosess
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 relative">
          <div className="px-8 py-8">
            {activeRole === "supervisor" && !readingMode && (() => {
              const midtermItems = [personnummerFilled, akutmottagningFilled, !!selectedAssessment, !!selectedAssessment2, !!selectedAssessment3, !!selectedAssessment4, datumFilled, isSigned];
              const endtermItems = [personnummerFilled, akutmottagningFilled, !!selectedAssessmentEnd, !!selectedAssessment2End, !!selectedAssessment3End, !!selectedAssessment4End, datumFilledEnd, fungeratBraEndFilled, isSignedEnd];
              const items = activeTerm === "midterm" ? midtermItems : endtermItems;
              const completed = items.filter(Boolean).length;
              const total = items.length;
              const pct = Math.round((completed / total) * 100);
              const color = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-purple-500" : "bg-red-400";
              return (
                <div className="mb-6 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">Form completion</span>
                    <span className="text-xs font-semibold text-gray-700">{completed}/{total} — {pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}
            {(activeRole === "student" || activeRole === "teacher") && !isSigned && (
              <div className="mb-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800"><span className="font-semibold">Midterm</span> not signed by supervisor — you cannot see the midterm gradings and cannot sign the form yet.</p>
              </div>
            )}
            {(activeRole === "student" || activeRole === "teacher") && endtermCreated && !isSignedEnd && activeTerm !== "midterm" && (
              <div className="mb-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800"><span className="font-semibold">Endterm</span> not signed by supervisor — you cannot see the endterm gradings and cannot sign the form yet.</p>
              </div>
            )}
            {activeRole === "student" && isSigned && !isStudentSigned && (
              <div className="mb-3 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800"><span className="font-semibold">Midterm:</span> Please review and sign the form. If not signed within <span className="font-semibold">48 hours</span>, the form will be signed automatically on your behalf.</p>
              </div>
            )}
            {activeRole === "student" && isSignedEnd && !isStudentSignedEnd && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800"><span className="font-semibold">Endterm:</span> Please review and sign the form. If not signed within <span className="font-semibold">48 hours</span>, the form will be signed automatically on your behalf.</p>
              </div>
            )}
            {readingMode ? (
              /* Reading Mode - Combined View */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Bedömningsformulär för Verksamhetsförlagd utbildning</h1>
                  <p className="text-sm text-gray-600">Högskolan i Borås</p>
                </div>

                {/* Praksisinformasjon Section */}
                <div id="rm-praksisinformasjon" className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Praksisinformasjon</h2>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-semibold">Kurs:</span> Akutsjukvård med verksamhetsförlagd utbildning, 7,5 hp</p>
                    <p><span className="font-semibold">Kurskod:</span> B2KS01</p>
                    <p><span className="font-semibold">Studentens namn:</span> Anna Andersson</p>
                    <p><span className="font-semibold">Studentens personnummer:</span> {personnummer || "_______________"}</p>
                    <p><span className="font-semibold">Akutmottagning:</span> {akutmottagning || "_______________"}</p>
                  </div>
                </div>

                {/* Planering Section */}
                <div id="rm-planering" className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Planering</h2>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-semibold">Genomförandeperiod av VFU, datum:</span> 2026-04-01 - 2026-06-01</p>
                    <p><span className="font-semibold">Datum för målformuleringssamtal:</span> {malformuleringssamtal || "_______________"}</p>
                    <p><span className="font-semibold">Datum för halvtidsbedömning:</span> {halvtidsbedomning || "_______________"}</p>
                    <p><span className="font-semibold">Datum för slutbedömning:</span> {slutbedomning || "_______________"}</p>
                  </div>
                </div>

                {/* Bedömningskriterier Section - Combined Midterm and Endterm */}
                {(activeRole === "supervisor" || isSigned || isSignedEnd) ? (
                <div id="rm-bedomningskriterier" className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                    Bedömningskriterier Akutsjukvård
                  </h2>

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
                        {([
                          {
                            label: "Självständigt observera och bedöma patienters vårdbehov utifrån symtom och tecken på sjukdom och/eller skada",
                            halvtid: selectedAssessment,
                            slut: selectedAssessmentEnd,
                          },
                          {
                            label: "Självständigt bedöma och prioritera patienters omedelbara medicinska- och omvårdnadsbehov",
                            halvtid: selectedAssessment2,
                            slut: selectedAssessment2End,
                          },
                          {
                            label: "Självständigt genomföra de åtgärder som patienters bedömda vårdbehov kräver utifrån patientens autonomi, värdighet och rättigheter",
                            halvtid: selectedAssessment3,
                            slut: selectedAssessment3End,
                          },
                          {
                            label: "Visa kunskap om gällande lagar, författningar samt säkerhetsföreskrifter inom akutsjukvården",
                            halvtid: selectedAssessment4,
                            slut: selectedAssessment4End,
                          },
                        ] as { label: string; halvtid: string | null; slut: string | null }[]).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {row.label}
                            </td>
                            <td className="border border-gray-300 p-0 text-center text-lg font-bold text-gray-900">
                              <div className="flex flex-col divide-y divide-gray-200">
                                <div className="flex items-center justify-center px-3 h-10">
                                  <span>{(activeRole === "supervisor" || isSigned) && row.halvtid === "godkand" ? "O" : ""}</span>
                                </div>
                                <div className="flex items-center justify-center px-3 h-10">
                                  <span>{(activeRole === "supervisor" || isSignedEnd) && row.slut === "godkand" ? "X" : ""}</span>
                                </div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-0 text-center text-lg font-bold text-gray-900">
                              <div className="flex flex-col divide-y divide-gray-200">
                                <div className="flex items-center justify-center px-3 h-10">
                                  <span>{(activeRole === "supervisor" || isSigned) && row.halvtid === "underkand" ? "O" : ""}</span>
                                </div>
                                <div className="flex items-center justify-center px-3 h-10">
                                  <span>{(activeRole === "supervisor" || isSignedEnd) && row.slut === "underkand" ? "X" : ""}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                ) : null}

                {/* Oppsumering Section - Halvtidsbedömning */}
                {(activeRole === "supervisor" || isSigned) ? (
                <div id="rm-halvtidsbedomning" className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Halvtidsbedömning</h2>
                  <div className="space-y-4 text-sm">
                    <p><span className="font-semibold">Datum:</span> {datum || "_______________"}</p>
                    <div>
                      <p className="font-semibold mb-2">Detta har fungerat bra:</p>
                      <p className="whitespace-pre-wrap">{fungeratBra || "_______________"}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Detta behöver studenten träna mer på:</p>
                      <p className="whitespace-pre-wrap">{tranaMer || "_______________"}</p>
                    </div>
                  </div>
                </div>
                ) : null}

                {/* Signering Section - Midterm (before Slutbedömning) */}
                {(activeRole === "supervisor" || isSigned) ? (
                <div id="rm-signering-halvtid" className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Signering av halvtidsbedömning</h2>
                  <div className="space-y-4 text-sm">
                    {isSigned ? (
                      <div>
                        <p className="font-semibold mb-2">Handledare:</p>
                        <p>Viktor Torvaldsson - Supervisor</p>
                        <p>Datum: 2026-06-05</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">Ej signerad av handledare</p>
                    )}
                    {isStudentSigned ? (
                      <div>
                        <p className="font-semibold mb-2">Student:</p>
                        <p>Anna Andersson</p>
                        <p>Datum: 2026-06-05</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">Ej signerad av student</p>
                    )}
                  </div>
                </div>
                ) : null}

                {/* Oppsumering Section - Slutbedömning */}
                {(activeRole === "supervisor" || isSignedEnd) ? (
                <div id="rm-slutbedomning" className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Slutbedömning</h2>
                  <div className="space-y-4 text-sm">
                    <p><span className="font-semibold">Datum:</span> {datumEnd || "_______________"}</p>
                    <div>
                      <p className="font-semibold mb-2">Eventuella kommentarer utöver det som framgår av Bedömningskriterierna:</p>
                      <p className="whitespace-pre-wrap">{fungeratBraEnd || "_______________"}</p>
                    </div>
                  </div>
                </div>
                ) : null}

                {/* Signering Section - Endterm */}
                {(activeRole === "supervisor" || isSignedEnd) ? (
                <div id="rm-signering-slut">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Signering av slutbedömning</h2>
                  {isSignedEnd ? (
                    <div className="text-sm">
                      <p className="font-semibold mb-2">Signerad av:</p>
                      <p>Viktor Torvaldsson - Supervisor</p>
                      <p>Datum: 2026-06-05</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 italic">Ej signerad</p>
                  )}
                </div>
                ) : null}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto">
              {activeSection === "praksisinformasjon" ? (
              /* Praksisinformasjon Form */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Praksisinformasjon</h1>

                <div className="mb-6 space-y-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Kurs:</span> Akutsjukvård med verksamhetsförlagd utbildning, 7,5 hp
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Kurskod:</span> B2KS01
                  </p>
                </div>

                <form className="space-y-6">
                  <div>
                    <label htmlFor="studentName" className="block text-sm font-medium text-gray-900 mb-2">
                      Studentens namn:
                    </label>
                    <input
                      type="text"
                      id="studentName"
                      defaultValue="Anna Andersson"
                      readOnly={activeRole === "student"}
                      className={`w-full px-4 py-2 rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default" : "focus:outline-none focus:ring-2 focus:ring-purple-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="personnummer" className="block text-sm font-medium text-gray-900 mb-2">
                      Studentens personnummer:<span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="personnummer"
                      placeholder="YYYYMMDD-XXXX"
                      value={personnummer}
                      readOnly={activeRole === "student"}
                      onChange={(e) => {
                        setPersonnummer(e.target.value);
                        setPersonnummerFilled(!!e.target.value);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : `focus:outline-none focus:ring-2 focus:ring-purple-500 ${showValidationErrors && !personnummerFilled ? "border-red-500 border-2" : "border-gray-300"}`}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="akutmottagning" className="block text-sm font-medium text-gray-900 mb-2">
                      Akutmottagning:<span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="akutmottagning"
                      placeholder="Enter location"
                      value={akutmottagning}
                      readOnly={activeRole === "student"}
                      onChange={(e) => {
                        setAkutmottagning(e.target.value);
                        setAkutmottagningFilled(!!e.target.value);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : `focus:outline-none focus:ring-2 focus:ring-purple-500 ${showValidationErrors && !akutmottagningFilled ? "border-red-500 border-2" : "border-gray-300"}`}`}
                    />
                  </div>
                </form>

                {/* Form status legend */}
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                  {endtermCreated && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-3">Endterm</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created</span>
                          <span className="text-gray-900">2026-06-05</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signed by supervisor</span>
                          {isSignedEnd ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Not signed yet</span>}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signed by student</span>
                          {isStudentSignedEnd ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Not signed yet</span>}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">Midterm</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created</span>
                        <span className="text-gray-900">2026-04-01</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signed by supervisor</span>
                        {isSigned ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Not signed yet</span>}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signed by student</span>
                        {isStudentSigned ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Not signed yet</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeSection === "planering" ? (
              /* Planering Form */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Planering</h1>

                <form className="space-y-6 mb-8">
                  <div>
                    <label htmlFor="genomforandeperiod" className="block text-sm font-medium text-gray-900 mb-2">
                      Genomförandeperiod av VFU, datum:
                    </label>
                    <input
                      type="text"
                      id="genomforandeperiod"
                      defaultValue="2026-04-01 - 2026-06-01"
                      readOnly={activeRole === "student"}
                      className={`w-full px-4 py-2 rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default" : "focus:outline-none focus:ring-2 focus:ring-purple-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="malformuleringssamtal" className="block text-sm font-medium text-gray-900 mb-2">
                      Datum för målformuleringssamtal: <span className="text-gray-500 font-normal">(Valgfritt)</span>
                    </label>
                    <input
                      type="date"
                      id="malformuleringssamtal"
                      value={malformuleringssamtal}
                      readOnly={activeRole === "student"}
                      onChange={(e) => setMalformuleringssamtal(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="halvtidsbedomning" className="block text-sm font-medium text-gray-900 mb-2">
                      Datum för halvtidsbedömning: <span className="text-gray-500 font-normal">(Valgfritt)</span>
                    </label>
                    <input
                      type="date"
                      id="halvtidsbedomning"
                      value={halvtidsbedomning}
                      readOnly={activeRole === "student"}
                      onChange={(e) => setHalvtidsbedomning(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="slutbedomning" className="block text-sm font-medium text-gray-900 mb-2">
                      Datum för slutbedömning: <span className="text-gray-500 font-normal">(Valgfritt)</span>
                    </label>
                    <input
                      type="date"
                      id="slutbedomning"
                      value={slutbedomning}
                      readOnly={activeRole === "student"}
                      onChange={(e) => setSlutbedomning(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"}`}
                    />
                  </div>
                </form>

                <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                  <p>
                    BeVut är utformat efter kursmål. För varje kursmål finns kriterier angivna för hur målen ska
                    uppnås. Bedömningssamtalen ska vara studentdrivna.
                  </p>
                  <p>
                    Halvtidsbedömningen är ett formativt samtal där studentens styrkor och förbättringsområden
                    ska diskuteras. Bedömningen utgår ifrån studentens nivå vid halvtid. Samtalet som görs ska
                    stimulera fortsatt utveckling som bedöms vid slutbedömningen. Som betyg används Underkänd
                    (U) och Godkänd (G) för den verksamhetsförlagda utbildningen. Samtliga kursmål ska vara
                    godkända vid slutbedömningen inför den examinerande simuleringen som sker vid Högskolan i
                    Borås.
                  </p>
                  <p>
                    Delarna får ej separeras från varandra. Dokumentet fylls i med bläck av handledare och student.
                    Ifyllt formulär skickas till kursansvarig universitetsadjunkt snarast efter avslutad VFU:
                  </p>
                </div>
              </div>
            ) : activeSection === "oppsumering" ? (
              /* Oppsumering Page */
              (activeRole === "student" || activeRole === "teacher") && !supervisorSignedNow ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <p className="text-gray-500 text-sm">Gradings are not visible until the supervisor has signed.</p>
                </div>
              ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Oppsumering</h1>

                <form className="space-y-6">
                  <div>
                    <label htmlFor="datum" className="block text-sm font-medium text-gray-900 mb-2">
                      Datum:<span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      id="datum"
                      value={activeTerm === "midterm" ? datum : datumEnd}
                      onChange={(e) => {
                        if (activeTerm === "midterm") {
                          setDatum(e.target.value);
                          setDatumFilled(!!e.target.value);
                        } else {
                          setDatumEnd(e.target.value);
                          setDatumFilledEnd(!!e.target.value);
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${showValidationErrors && ((activeTerm === "midterm" && !datumFilled) || (activeTerm === "endterm" && !datumFilledEnd)) ? "border-red-500 border-2" : "border-gray-300"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="fungeratBra" className="block text-sm font-medium text-gray-900 mb-2">
                      {activeTerm === "midterm" ? (
                        <>Detta har fungerat bra: <span className="text-gray-500 font-normal">(Valgfritt)</span></>
                      ) : (
                        <>Eventuella kommentarer utöver det som framgår av Bedömningskriterierna:<span className="text-red-600 ml-1">*</span></>
                      )}
                    </label>
                    <textarea
                      id="fungeratBra"
                      rows={5}
                      value={activeTerm === "midterm" ? fungeratBra : fungeratBraEnd}
                      onChange={(e) => {
                        if (activeTerm === "midterm") {
                          setFungeratBra(e.target.value);
                        } else {
                          setFungeratBraEnd(e.target.value);
                          setFungeratBraEndFilled(!!e.target.value);
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical ${showValidationErrors && activeTerm === "endterm" && !fungeratBraEndFilled ? "border-red-500 border-2" : "border-gray-300"}`}
                      placeholder="Enter text here..."
                    ></textarea>
                  </div>

                  {activeTerm === "midterm" && (
                    <div>
                      <label htmlFor="tranaMer" className="block text-sm font-medium text-gray-900 mb-2">
                        Detta behöver studenten träna mer på: <span className="text-gray-500 font-normal">(Valgfritt)</span>
                      </label>
                      <textarea
                        id="tranaMer"
                        rows={5}
                        value={tranaMer}
                        onChange={(e) => setTranaMer(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
                        placeholder="Enter text here..."
                      ></textarea>
                    </div>
                  )}
                </form>
              </div>
              )
            ) : activeSection === "bedomningskriterier" ? (
              /* Bedömningskriterier Akutsjukvård Page */
              (activeRole === "student" || activeRole === "teacher") && !supervisorSignedNow ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <p className="text-gray-500 text-sm">Gradings are not visible until the supervisor has signed.</p>
                </div>
              ) : (
              <div className="space-y-6">
                <div id="assessment-1" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                  <AssessmentQuestion
                    title="Självständigt observera och bedöma patienters vårdbehov utifrån symtom och tecken på sjukdom och/eller skada"
                    godkandText="Inhämta information genom ett strukturerat arbetssätt samt analyser och tolka patienters tillstånd utifrån händelse, sjukdomshistoria och vitala parametrar. Förstå och kunna tolka varningstecken"
                    underkandText="Bristande teoretiska kunskaper och/eller oförmåga att på ett strukturerat arbetssätt inhämta viktig information utifrån händelse, sjukdomshistoria och vitala parametrar samt tolka och förstå innebörden i insamlad fakta"
                    selectedValue={activeTerm === "midterm" ? selectedAssessment : selectedAssessmentEnd}
                    onSelect={activeTerm === "midterm" ? setSelectedAssessment : setSelectedAssessmentEnd}
                    marker={activeTerm === "midterm" ? "O" : "X"}
                  />
                </div>

                <div id="assessment-2" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                  <AssessmentQuestion
                    title="Självständigt bedöma och prioritera patienters omedelbara medicinska- och omvårdnadsbehov"
                    godkandText="Identifiera omedelbara medicinska- och omvårdnadsbehov utifrån insamlad information, händelse, sjukdomshistoria och vitala parametrar"
                    underkandText="Bristande teoretiska kunskaper och/eller oförmåga att identifiera medicinska och/eller omvårdnadsbehov utifrån insamlad information, händelse, sjukdomshistoria och vitala parametrar"
                    selectedValue={activeTerm === "midterm" ? selectedAssessment2 : selectedAssessment2End}
                    onSelect={activeTerm === "midterm" ? setSelectedAssessment2 : setSelectedAssessment2End}
                    marker={activeTerm === "midterm" ? "O" : "X"}
                  />
                </div>

                <div id="assessment-3" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                  <AssessmentQuestion
                    title="Självständigt genomföra de åtgärder som patienters bedömda vårdbehov kräver utifrån patientens autonomi, värdighet och rättigheter"
                    godkandText="Förmåga att identifiera och prioritera mellan olika omvårdnads- och medicinska åtgärder och fatta relevanta beslut utifrån individuella behov, medicinska tillstånd och vårdsituation, samt att genomföra och utvärdera effekten av åtgärderna"
                    underkandText="Oförmåga att identifiera möjliga lösningar i omvårdnadssituationer med flera beståndsdelar eller bristande kunskap och/eller oförmåga att fatta beslut om, genomföra eller utvärdera effekten av omvårdnadsåtgärder i olika typer av situationer"
                    selectedValue={activeTerm === "midterm" ? selectedAssessment3 : selectedAssessment3End}
                    onSelect={activeTerm === "midterm" ? setSelectedAssessment3 : setSelectedAssessment3End}
                    marker={activeTerm === "midterm" ? "O" : "X"}
                  />
                </div>

                <div id="assessment-4" className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                  <AssessmentQuestion
                    title="Visa kunskap om gällande lagar, författningar samt säkerhetsföreskrifter inom akutsjukvården"
                    godkandText="Visa förståelse för lagar som reglerar akutsjukvårdens verksamhet och kunna applicera dessa i specifika vårdsituationer"
                    underkandText="Bristande förståelse för vilka legala förutsättningar som finns för att agera inom akutsjukvården i samband med specifika vårdsituationer"
                    selectedValue={activeTerm === "midterm" ? selectedAssessment4 : selectedAssessment4End}
                    onSelect={activeTerm === "midterm" ? setSelectedAssessment4 : setSelectedAssessment4End}
                    marker={activeTerm === "midterm" ? "O" : "X"}
                  />
                </div>
              </div>
              )
            ) : activeSection === "signering" ? (
              /* Signering av sluttvurdering Page */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  {activeTerm === "midterm" ? "Signering av midterm" : "Signering av sluttvurdering"}
                </h1>

                {(activeRole === "student" || activeRole === "teacher") && !supervisorSignedNow ? (
                  <div className="py-12 text-center text-gray-500 text-sm italic">
                    Väntar på handledarens signatur. Bedömningen är inte tillgänglig ännu.
                  </div>
                ) : (
                <>
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sammanfattning - Bedömningskriterier Akutsjukvård</h2>
                  <AssessmentSummary
                    marker={activeTerm === "midterm" ? "O" : "X"}
                    assessments={[
                      {
                        title: "Självständigt observera och bedöma patienters vårdbehov utifrån symtom och tecken på sjukdom och/eller skada",
                        selectedValue: activeTerm === "midterm" ? selectedAssessment : selectedAssessmentEnd,
                      },
                      {
                        title: "Självständigt bedöma och prioritera patienters omedelbara medicinska- och omvårdnadsbehov",
                        selectedValue: activeTerm === "midterm" ? selectedAssessment2 : selectedAssessment2End,
                      },
                      {
                        title: "Självständigt genomföra de åtgärder som patienters bedömda vårdbehov kräver utifrån patientens autonomi, värdighet och rättigheter",
                        selectedValue: activeTerm === "midterm" ? selectedAssessment3 : selectedAssessment3End,
                      },
                      {
                        title: "Visa kunskap om gällande lagar, författningar samt säkerhetsföreskrifter inom akutsjukvården",
                        selectedValue: activeTerm === "midterm" ? selectedAssessment4 : selectedAssessment4End,
                      },
                    ]}
                  />
                </div>

                {/* Sign section */}
                <div id="sign-section">
                  {(activeTerm === "midterm" ? !isSigned : !isSignedEnd) && activeRole === "supervisor" ? (
                    <div>
                      {showValidationErrors && validateAllFields().length > 0 && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 mb-2">Vänligen fyll i alla obligatoriska fält:</p>
                          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                            {!personnummerFilled && <li>Studentens personnummer (Praksisinformasjon)</li>}
                            {!akutmottagningFilled && <li>Akutmottagning (Praksisinformasjon)</li>}
                            {activeTerm === "midterm" ? (
                              <>
                                {!selectedAssessment && <li>Bedömningskriterium 1 (Bedömningskriterier Akutsjukvård)</li>}
                                {!selectedAssessment2 && <li>Bedömningskriterium 2 (Bedömningskriterier Akutsjukvård)</li>}
                                {!selectedAssessment3 && <li>Bedömningskriterium 3 (Bedömningskriterier Akutsjukvård)</li>}
                                {!selectedAssessment4 && <li>Bedömningskriterium 4 (Bedömningskriterier Akutsjukvård)</li>}
                                {!datumFilled && <li>Datum (Oppsumering)</li>}
                              </>
                            ) : (
                              <>
                                {!selectedAssessmentEnd && <li>Bedömningskriterium 1 (Bedömningskriterier Akutsjukvård)</li>}
                                {!selectedAssessment2End && <li>Bedömningskriterium 2 (Bedömningskriterier Akutsjukvård)</li>}
                                {!selectedAssessment3End && <li>Bedömningskriterium 3 (Bedömningskriterier Akutsjukvård)</li>}
                                {!selectedAssessment4End && <li>Bedömningskriterium 4 (Bedömningskriterier Akutsjukvård)</li>}
                                {!datumFilledEnd && <li>Datum (Oppsumering)</li>}
                                {!fungeratBraEndFilled && <li>Eventuella kommentarer utöver det som framgår av Bedömningskriterierna (Oppsumering)</li>}
                              </>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Signature Info */
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-3">Signerad av:</p>
                      <div className="flex items-center gap-3 w-fit">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          VT
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Viktor Torvaldsson</p>
                          <p className="text-xs text-gray-600">Supervisor</p>
                        </div>
                        <div className="pl-4">
                          <p className="text-sm text-gray-700">2026-06-05</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(activeRole === "student" || activeRole === "teacher") && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Studentens signatur</h3>
                    {!supervisorSignedNow ? (
                      <p className="text-sm text-gray-500 italic">Väntar på handledarens signatur.</p>
                    ) : studentSignedNow ? (
                      <div className="flex items-center gap-3 w-fit">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">AA</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Anna Andersson</p>
                          <p className="text-xs text-gray-600">Student</p>
                        </div>
                        <div className="pl-4"><p className="text-sm text-gray-700">2026-06-05</p></div>
                      </div>
                    ) : activeRole === "teacher" ? (
                      <p className="text-sm text-gray-500 italic">Ej signerad av student.</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Använd knappen nedan för att signera.</p>
                    )}
                  </div>
                )}
                </>
                )}
              </div>
            ) : (
              /* Assessment Card */
              <>
                <div className="mb-6">
                  </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 italic max-w-xl">
                      Studenten har följt basala hygienrutiner
                    </h2>
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Venter på Veileder
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Sist oppdatert av:
                      </p>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-900">
                          <span className="font-medium">Student:</span>
                        </p>
                        <p className="text-gray-900">
                          <span className="font-medium">Lærer:</span>
                        </p>
                        <p className="text-gray-900">
                          <span className="font-medium">Veileder:</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
              )}
              </div>
            )}
          </div>
          {/* Floating sign action */}
          {activeSection === "signering" && !readingMode && (
            <>
              {activeRole === "supervisor" && !supervisorSignedNow && (
                <div className="sticky bottom-6 flex justify-center pointer-events-none">
                  <button
                    onClick={handleSign}
                    className="pointer-events-auto px-8 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    Signera
                  </button>
                </div>
              )}
              {activeRole === "student" && supervisorSignedNow && !studentSignedNow && (
                <div className="sticky bottom-6 flex justify-center pointer-events-none">
                  <button
                    onClick={() => {
                      if (activeTerm === "midterm") {
                        setIsStudentSigned(true);
                        setEndtermCreated(true);
                      } else {
                        setIsStudentSignedEnd(true);
                      }
                    }}
                    className="pointer-events-auto px-8 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    Signera som student
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar - Full Height */}
        <aside className="w-80 bg-white overflow-auto border-l border-gray-200 p-8">
          <div className="mb-4">
            <span className="text-sm font-bold text-gray-900 tracking-wide">
              INNHOLD
            </span>
          </div>

          {readingMode ? (
            <div className="space-y-2">
              {([
                { id: "rm-praksisinformasjon", label: "Praksisinformasjon" },
                { id: "rm-planering", label: "Planering" },
                { id: "rm-bedomningskriterier", label: "Bedömningskriterier" },
                { id: "rm-halvtidsbedomning", label: "Halvtidsbedömning" },
                { id: "rm-signering-halvtid", label: "Signering – halvtid" },
                { id: "rm-slutbedomning", label: "Slutbedömning" },
                { id: "rm-signering-slut", label: "Signering – slut" },
              ]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full text-left text-sm text-blue-600 hover:underline py-1"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
          <div>

          {activeSection === "praksisinformasjon" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("personnummer")} className="flex items-start gap-2 group">
                {rsIcon(personnummerFilled, true, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Studentens personnummer
                </span>
              </a>
              <a href="#" onClick={scrollTo("akutmottagning")} className="flex items-start gap-2 group">
                {rsIcon(akutmottagningFilled, true, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Akutmottagning
                </span>
              </a>
            </div>
          ) : activeSection === "planering" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("malformuleringssamtal")} className="flex items-start gap-2 group">
                {rsIcon(!!malformuleringssamtal, false, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Datum för målformuleringssamtal
                </span>
              </a>
              <a href="#" onClick={scrollTo("halvtidsbedomning")} className="flex items-start gap-2 group">
                {rsIcon(!!halvtidsbedomning, false, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Datum för halvtidsbedömning
                </span>
              </a>
              <a href="#" onClick={scrollTo("slutbedomning")} className="flex items-start gap-2 group">
                {rsIcon(!!slutbedomning, false, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Datum för slutbedömning
                </span>
              </a>
            </div>
          ) : activeSection === "oppsumering" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("datum")} className="flex items-start gap-2 group">
                {rsIcon(activeTerm === "midterm" ? datumFilled : datumFilledEnd, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Datum
                </span>
              </a>
              {activeTerm === "midterm" ? (
                <>
                  <a href="#" onClick={scrollTo("fungeratBra")} className="flex items-start gap-2 group">
                    {rsIcon(!!fungeratBra, false)}
                    <span className="text-sm text-blue-600 group-hover:underline">
                      Detta har fungerat bra
                    </span>
                  </a>
                  <a href="#" onClick={scrollTo("tranaMer")} className="flex items-start gap-2 group">
                    {rsIcon(!!tranaMer, false)}
                    <span className="text-sm text-blue-600 group-hover:underline">
                      Detta behöver studenten träna mer på
                    </span>
                  </a>
                </>
              ) : (
                <>
                  <a href="#" onClick={scrollTo("fungeratBra")} className="flex items-start gap-2 group">
                    {rsIcon(fungeratBraEndFilled, true)}
                    <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                      Eventuella kommentarer utöver det som framgår av Bedömningskriterierna
                    </span>
                  </a>
                </>
              )}
            </div>
          ) : activeSection === "bedomningskriterier" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("assessment-1")} className="flex items-start gap-2 group">
                {rsIcon(!!(activeTerm === "midterm" ? selectedAssessment : selectedAssessmentEnd), true)}
                <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                  Självständigt observera och bedöma patienters vårdbehov utifrån symtom och tecken på sjukdom och/eller skada
                </span>
              </a>
              <a href="#" onClick={scrollTo("assessment-2")} className="flex items-start gap-2 group">
                {rsIcon(!!(activeTerm === "midterm" ? selectedAssessment2 : selectedAssessment2End), true)}
                <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                  Självständigt bedöma och prioritera patienters omedelbara medicinska- och omvårdnadsbehov
                </span>
              </a>
              <a href="#" onClick={scrollTo("assessment-3")} className="flex items-start gap-2 group">
                {rsIcon(!!(activeTerm === "midterm" ? selectedAssessment3 : selectedAssessment3End), true)}
                <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                  Självständigt genomföra de åtgärder som patienters bedömda vårdbehov kräver utifrån patientens autonomi, värdighet och rättigheter
                </span>
              </a>
              <a href="#" onClick={scrollTo("assessment-4")} className="flex items-start gap-2 group">
                {rsIcon(!!(activeTerm === "midterm" ? selectedAssessment4 : selectedAssessment4End), true)}
                <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                  Visa kunskap om gällande lagar, författningar samt säkerhetsföreskrifter inom akutsjukvården
                </span>
              </a>
            </div>
          ) : activeSection === "signering" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("sign-section")} className="flex items-start gap-2 group">
                {rsIcon(supervisorSignedNow, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  {activeTerm === "midterm" ? "Signering av midterm" : "Sign"}
                </span>
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  1 Kommunicera och bemöta patienter
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  2 Kommunicera med och bemöta familj oc...
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  3 Samverka med olika instanser inom vård...
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  4 Informera och undervisa patienter...
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  5 Informera och undervisa...
                </span>
              </a>
            </div>
          )}
          </div>
          )}
        </aside>
      </div>
    </div>
  );
}