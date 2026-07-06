/// <reference path="../vite-env.d.ts" />
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AssessmentQuestion } from "./components/AssessmentQuestion";
import { AssessmentSummary } from "./components/AssessmentSummary";

// Assessment criteria are template-driven: admins can add/remove/edit them in template mode.
interface Question {
  id: number;
  title: string;
  godkandText: string;
  underkandText: string;
}

const initialQuestions: Question[] = [
  {
    id: 1,
    title: "Självständigt observera och bedöma patienters vårdbehov utifrån symtom och tecken på sjukdom och/eller skada",
    godkandText: "Inhämta information genom ett strukturerat arbetssätt samt analyser och tolka patienters tillstånd utifrån händelse, sjukdomshistoria och vitala parametrar. Förstå och kunna tolka varningstecken",
    underkandText: "Bristande teoretiska kunskaper och/eller oförmåga att på ett strukturerat arbetssätt inhämta viktig information utifrån händelse, sjukdomshistoria och vitala parametrar samt tolka och förstå innebörden i insamlad fakta",
  },
  {
    id: 2,
    title: "Självständigt bedöma och prioritera patienters omedelbara medicinska- och omvårdnadsbehov",
    godkandText: "Identifiera omedelbara medicinska- och omvårdnadsbehov utifrån insamlad information, händelse, sjukdomshistoria och vitala parametrar",
    underkandText: "Bristande teoretiska kunskaper och/eller oförmåga att identifiera medicinska och/eller omvårdnadsbehov utifrån insamlad information, händelse, sjukdomshistoria och vitala parametrar",
  },
  {
    id: 3,
    title: "Självständigt genomföra de åtgärder som patienters bedömda vårdbehov kräver utifrån patientens autonomi, värdighet och rättigheter",
    godkandText: "Förmåga att identifiera och prioritera mellan olika omvårdnads- och medicinska åtgärder och fatta relevanta beslut utifrån individuella behov, medicinska tillstånd och vårdsituation, samt att genomföra och utvärdera effekten av åtgärderna",
    underkandText: "Oförmåga att identifiera möjliga lösningar i omvårdnadssituationer med flera beståndsdelar eller bristande kunskap och/eller oförmåga att fatta beslut om, genomföra eller utvärdera effekten av omvårdnadsåtgärder i olika typer av situationer",
  },
  {
    id: 4,
    title: "Visa kunskap om gällande lagar, författningar samt säkerhetsföreskrifter inom akutsjukvården",
    godkandText: "Visa förståelse för lagar som reglerar akutsjukvårdens verksamhet och kunna applicera dessa i specifika vårdsituationer",
    underkandText: "Bristande förståelse för vilka legala förutsättningar som finns för att agera inom akutsjukvården i samband med specifika vårdsituationer",
  },
];

// Every user-facing string in the form view, editable by admins in template mode.
const defaultTexts: Record<string, string> = {
  "topbar.bedomning": "BEDÖMNING",
  "tab.halvtid": "Halvtidsbedömning",
  "tab.slut": "Slutbedömning",
  "btn.preview": "Förhandsvisning",
  "nav.vfu": "VFU-Information",
  "nav.larandemal": "Lärandemål Akutsjukvård",
  "nav.sammanfattning": "Sammanfattning",
  "nav.signering.halvtid": "Signering av halvtidsbedömning",
  "nav.signering.slut": "Signering av slutbedömning",
  "btn.avbryt": "Avbryt bedömningsprocess",
  "btn.handlingsplan": "Aktivera handlingsplan",
  "btn.prev": "Föregående",
  "btn.next": "Nästa",
  "vfu.title": "VFU-Information",
  "vfu.kursLabel": "Kurs:",
  "vfu.kurskodLabel": "Kurskod:",
  "vfu.studentName": "Studentens namn:",
  "vfu.enhet": "Vårdavdelning/enhet:",
  "ph.enhet": "Enter location",
  "vfu.planering": "Planering",
  "vfu.period": "Genomförandeperiod av VFU, datum:",
  "vfu.malsamtal": "Datum för målformuleringssamtal:",
  "vfu.datumHalvtid": "Datum för halvtidsbedömning:",
  "vfu.datumSlut": "Datum för slutbedömning:",
  "txt.valgfritt": "(Valgfritt)",
  "vfu.info1": "BeVut är utformat efter kursmål. För varje kursmål finns kriterier angivna för hur målen ska uppnås. Bedömningssamtalen ska vara studentdrivna.",
  "vfu.info2": "Halvtidsbedömningen är ett formativt samtal där studentens styrkor och förbättringsområden ska diskuteras. Bedömningen utgår ifrån studentens nivå vid halvtid. Samtalet som görs ska stimulera fortsatt utveckling som bedöms vid slutbedömningen. Som betyg används Underkänd (U) och Godkänd (G) för den verksamhetsförlagda utbildningen. Samtliga kursmål ska vara godkända vid slutbedömningen inför den examinerande simuleringen som sker vid Högskolan i Borås.",
  "vfu.info3": "Delarna får ej separeras från varandra. Dokumentet fylls i med bläck av handledare och student. Ifyllt formulär skickas till kursansvarig universitetsadjunkt snarast efter avslutad VFU:",
  "status.halvtidTitle": "Halvtidsbedömning",
  "status.slutTitle": "Slutbedömning",
  "status.skapad": "Skapad",
  "status.signHandledare": "Undertecknad av handledare",
  "status.signLarare": "Undertecknad av lärare",
  "status.signStudent": "Undertecknad av student",
  "status.notSigned": "Inte undertecknad",
  "vfu.slutInfo": "Slutbedömning kommer att vara synlig efter att alla roller har undertecknat halvtidsbedömning",
  "q.topLabel": "Lärandemål",
  "q.colPassMid": "Betryggande utveckling",
  "q.colFailMid": "Ej betryggande utveckling",
  "q.colPassEnd": "För godkänt ska studenten:",
  "q.colFailEnd": "Student uppfyller inte kriterierna för godkänd:",
  "q.showMidterm": "Visa gradering från halvtidsbedömning",
  "q.hideMidterm": "Dölj gradering från halvtidsbedömning",
  "gate.notVisible": "Gradings are not visible until the supervisor has signed.",
  "opp.title": "Sammanfattning",
  "opp.franvaro": "Frånvaro:",
  "opp.dagar": "dagar",
  "opp.ki": "Av KI sanktionerad uppgift",
  "opp.sjukdom": "Sjukdom",
  "opp.annat": "Annat",
  "opp.braMid": "Detta har fungerat bra:",
  "opp.braEnd": "Eventuella kommentarer utöver det som framgår av Bedömningskriterierna:",
  "opp.tranaMer": "Detta behöver studenten träna mer på:",
  "ph.textarea": "Enter text here...",
  "sign.summaryTitle": "Sammanfattning - Lärandemål Akutsjukvård",
  "summary.larandemal": "Lärandemål",
  "summary.passMid": "Betryggande utveckling",
  "summary.failMid": "Ej betryggande utveckling",
  "summary.passEnd": "Godkänt",
  "summary.failEnd": "Student uppfyller inte kriterierna för godkänd",
  "sign.datumLabel": "Datum för signering",
  "sign.btnSupervisor": "Signera",
  "sign.btnStudent": "Signera som student",
  "sign.btnTeacher": "Signera som lärare",
  "sign.waiting": "Väntar på handledarens signatur. Bedömningen är inte tillgänglig ännu.",
  "sign.waitingShort": "Väntar på handledarens signatur.",
  "sign.signedBy": "Signerad av:",
  "sign.studentSection": "Studentens signatur",
  "sign.teacherSection": "Lärarens signatur",
  "sign.ejStudent": "Ej signerad av student.",
  "sign.ejLarare": "Ej signerad av lärare.",
  "sign.useAction": "Använd åtgärdsfältet nedan för att välja datum och signera.",
  "sign.checkPreview": "Kontrollera bedömningen i förhandsvisning uppe till höger innan du signerar",
  "val.heading": "Vänligen fyll i alla obligatoriska fält:",
  "val.enhet": "Akutmottagning (Praksisinformasjon)",
  "val.datum": "Datum för signering (Signering)",
  "banner.notSigned": "not signed by supervisor — you cannot see the gradings and cannot sign the form yet.",
  "banner.pleaseSign": "Please review and sign the form. If not signed within 48 hours, the form will be signed automatically on your behalf.",
};

export default function App() {
  const [activeSection, setActiveSection] = useState("praksisinformasjon");
  const [activeTerm, setActiveTerm] = useState<"midterm" | "endterm">("midterm");
  const [endtermCreated, setEndtermCreated] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const [activeRole, setActiveRole] = useState<"supervisor" | "student" | "teacher">("supervisor");

  // Template (admin) edit mode
  const [templateMode, setTemplateMode] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>(defaultTexts);
  const [editing, setEditing] = useState<{ value: string; save: (v: string) => void } | null>(null);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const nextQuestionId = useRef(initialQuestions.length + 1);

  // Midterm states
  const [midtermGrades, setMidtermGrades] = useState<Record<number, string | null>>({});
  const [isSigned, setIsSigned] = useState(false);
  const [fungeratBra, setFungeratBra] = useState("");
  const [tranaMer, setTranaMer] = useState("");

  // Endterm states
  const [endtermGrades, setEndtermGrades] = useState<Record<number, string | null>>({});
  const [isSignedEnd, setIsSignedEnd] = useState(false);
  const [fungeratBraEnd, setFungeratBraEnd] = useState("");
  const [fungeratBraEndFilled, setFungeratBraEndFilled] = useState(false);
  const [tranaMerEnd, setTranaMerEnd] = useState("");
  const [franvaroDagar, setFranvaroDagar] = useState("");
  const [franvaroKI, setFranvaroKI] = useState(false);
  const [franvaroSjukdom, setFranvaroSjukdom] = useState(false);
  const [franvaroAnnat, setFranvaroAnnat] = useState(false);

  // Shared states
  const [akutmottagningFilled, setAkutmottagningFilled] = useState(false);
  const [akutmottagning, setAkutmottagning] = useState("");
  const [malformuleringssamtal, setMalformuleringssamtal] = useState("");
  const [halvtidsbedomning, setHalvtidsbedomning] = useState("");
  const [slutbedomning, setSlutbedomning] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isStudentSigned, setIsStudentSigned] = useState(false);
  const [isStudentSignedEnd, setIsStudentSignedEnd] = useState(false);
  const [isTeacherSigned, setIsTeacherSigned] = useState(false);
  const [isTeacherSignedEnd, setIsTeacherSignedEnd] = useState(false);
  const [showEndtermPopup, setShowEndtermPopup] = useState(false);
  // Signature date — the signer must pick a date before signing (both terms)
  const [signDatum, setSignDatum] = useState("");
  const [signDatumEnd, setSignDatumEnd] = useState("");

  // When both student and teacher have signed the midterm, open the endterm form automatically
  useEffect(() => {
    if (isStudentSigned && isTeacherSigned) {
      setEndtermCreated(true);
      setActiveTerm("endterm");
      setShowEndtermPopup(true);
    }
  }, [isStudentSigned, isTeacherSigned]);

  // Template texts: look up a user-facing string by key.
  const t = (key: string) => texts[key] ?? key;
  // Open the edit popup for a template text key.
  const editText = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing({ value: t(key), save: (v) => setTexts((prev) => ({ ...prev, [key]: v })) });
  };
  // Editable text: renders the plain string normally; in template mode it becomes click-to-edit.
  const E = ({ k }: { k: string }) =>
    templateMode ? (
      <span
        onClick={editText(k)}
        title="Klicka för att redigera texten"
        className="cursor-pointer rounded px-0.5 outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
      >
        {t(k)}
      </span>
    ) : (
      <>{t(k)}</>
    );

  // Grades for the active term, keyed by question id.
  const grades = activeTerm === "midterm" ? midtermGrades : endtermGrades;
  const setGrade = (id: number, value: string | null) => {
    if (activeTerm === "midterm") setMidtermGrades((prev) => ({ ...prev, [id]: value }));
    else setEndtermGrades((prev) => ({ ...prev, [id]: value }));
  };

  const editQuestionText =
    (id: number, field: "title" | "godkandText" | "underkandText") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const question = questions.find((q) => q.id === id);
      if (!question) return;
      setEditing({
        value: question[field],
        save: (v) => setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: v } : q))),
      });
    };
  const addQuestion = () => {
    const id = nextQuestionId.current++;
    setQuestions((prev) => [
      ...prev,
      {
        id,
        title: "Nytt lärandemål",
        godkandText: "Beskriv kriterierna för godkänd här",
        underkandText: "Beskriv kriterierna för underkänd här",
      },
    ]);
  };
  const removeQuestion = (id: number) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  const validateAllFields = () => {
    const errors = [];
    if (!akutmottagningFilled) errors.push("praksisinformasjon");
    questions.forEach((q) => {
      if (!grades[q.id]) errors.push("bedomningskriterier");
    });
    if (!(activeTerm === "midterm" ? signDatum : signDatumEnd)) errors.push("signering");
    return errors;
  };

  const handleSign = () => {
    if (templateMode) return;
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

  const supervisorSignedNow = activeTerm === "midterm" ? isSigned : isSignedEnd;
  const mandatoryComplete = validateAllFields().length === 0;
  // Disable the sign button only in reading mode; the signering page keeps its original always-active button.
  const signDisabled = readingMode && !mandatoryComplete;

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
  const teacherSignedNow = activeTerm === "midterm" ? isTeacherSigned : isTeacherSignedEnd;
  const currentRoleSigned =
    activeRole === "supervisor" ? supervisorSignedNow : activeRole === "student" ? studentSignedNow : teacherSignedNow;

  // Signature date for the active term; required before any role can sign.
  const signDatumNow = activeTerm === "midterm" ? signDatum : signDatumEnd;
  const setSignDatumNow = (v: string) =>
    activeTerm === "midterm" ? setSignDatum(v) : setSignDatumEnd(v);
  // Sign buttons stay disabled until a signature date is chosen (both terms).
  const signBtnDisabled = signDisabled || !signDatumNow;
  // Today's date (local) — signature dates cannot be earlier than today.
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  // Signature action card: pick a signature date, then sign. Shared by all three roles.
  const signActionCard = (label: React.ReactNode, onClick: () => void) => (
    <div className="bg-white rounded-full shadow-lg border border-gray-200 pl-4 pr-2 py-2 flex items-center gap-3">
      <label htmlFor="signDatum" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        <E k="sign.datumLabel" /><span className="text-red-600 ml-0.5">*</span>
      </label>
      <input
        type="date"
        id="signDatum"
        min={todayStr}
        value={signDatumNow}
        onChange={(e) => setSignDatumNow(e.target.value)}
        className={`px-3 py-1.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !signDatumNow ? "border-red-400" : "border-gray-300"
        }`}
      />
      <button
        onClick={() => {
          if (!templateMode) onClick();
        }}
        disabled={!templateMode && signBtnDisabled}
        title={!signDatumNow && !templateMode ? "Välj ett datum för att kunna signera" : undefined}
        className={`px-6 py-2 font-semibold rounded-full transition-all ${
          templateMode || !signBtnDisabled
            ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {label}
      </button>
    </div>
  );
  // The sign action for the active role (or null if it's not this role's turn / already signed).
  const currentSignAction = () => {
    // In template mode always show the card so its texts can be edited; signing itself is disabled.
    if (templateMode) return signActionCard(<E k="sign.btnSupervisor" />, () => {});
    if (activeRole === "supervisor" && !supervisorSignedNow)
      return signActionCard(<E k="sign.btnSupervisor" />, handleSign);
    if (activeRole === "student" && supervisorSignedNow && !studentSignedNow)
      return signActionCard(<E k="sign.btnStudent" />, () => {
        if (activeTerm === "midterm") setIsStudentSigned(true);
        else setIsStudentSignedEnd(true);
      });
    if (activeRole === "teacher" && supervisorSignedNow && !teacherSignedNow)
      return signActionCard(<E k="sign.btnTeacher" />, () => {
        if (activeTerm === "midterm") setIsTeacherSigned(true);
        else setIsTeacherSignedEnd(true);
      });
    return null;
  };

  // Ordered wizard steps for the Föregående / Nästa footer navigation.
  const sectionOrder = ["praksisinformasjon", "bedomningskriterier", "oppsumering", "signering"];
  const sectionIndex = sectionOrder.indexOf(activeSection);
  const goToSection = (index: number) => {
    setActiveSection(sectionOrder[index]);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Per-page status (role-aware) → sidebar dot: red = mandatory missing, yellow = optional missing, green = done.
  const sectionStatus = (section: string): "red" | "yellow" | "green" => {
    let mandatoryMissing = false;
    let optionalMissing = false;
    switch (section) {
      case "praksisinformasjon":
        mandatoryMissing = !akutmottagningFilled;
        optionalMissing = !malformuleringssamtal || !halvtidsbedomning || !slutbedomning;
        break;
      case "bedomningskriterier":
        mandatoryMissing = !questions.every((q) => grades[q.id]);
        break;
      case "oppsumering":
        optionalMissing = activeTerm === "midterm" ? !fungeratBra || !tranaMer : !fungeratBraEnd;
        break;
      case "signering":
        mandatoryMissing = !currentRoleSigned;
        break;
    }
    if (mandatoryMissing) return "red";
    if (optionalMissing) return "yellow";
    return "green";
  };
  const statusDot = (section: string) => {
    // Students/teachers don't fill the form — only their Signering status is tracked; other items are gray.
    const s =
      (activeRole === "student" || activeRole === "teacher") && section !== "signering"
        ? "gray"
        : sectionStatus(section);
    const color =
      s === "red" ? "bg-red-500" : s === "yellow" ? "bg-yellow-400" : s === "green" ? "bg-green-500" : "bg-gray-300";
    return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${color}`} aria-hidden="true" />;
  };
  const navItemClass = (section: string) => {
    const active = activeSection === section;
    return `w-full flex items-start gap-3 px-3 py-2 text-sm rounded-lg ${
      active ? "text-gray-900 bg-gray-100 font-medium" : "text-gray-700 hover:bg-gray-100"
    }`;
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Endterm-created demo popup */}
      {showEndtermPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Explanation for demo</h2>
            <p className="text-sm text-gray-700 mb-6">
              Halvtidsbedömningen är ifylld och slutbedömningen skapas. När du stänger den här dialogrutan kommer du att navigeras till slutbedömningen.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowEndtermPopup(false);
                  setActiveSection("praksisinformasjon");
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Template text edit popup */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Redigera text</h2>
            <textarea
              autoFocus
              rows={4}
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  editing.save(editing.value);
                  setEditing(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              MOSO InPraxis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTemplateMode(!templateMode);
              setReadingMode(false);
              setEditing(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              templateMode
                ? "bg-purple-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Pencil className="w-4 h-4" />
            Template
          </button>
          <div className="w-px h-6 bg-gray-300" />
          {(["supervisor", "student", "teacher"] as const).map((role) => (
            <button
              key={role}
              onClick={() => { setActiveRole(role); setActiveSection("praksisinformasjon"); setShowValidationErrors(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeRole === role
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {role === "supervisor" ? "Handledare" : role === "teacher" ? "Lærer" : "Student"}
            </button>
          ))}
        </div>
      </header>

      {/* Template mode helper bar */}
      {templateMode && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-2 text-sm text-purple-800">
          Template-läge: klicka på en markerad text för att redigera den. Använd ⋮ i vänstermenyn och
          vid flikarna för att redigera navigeringstexter. Lärandemål läggs till, redigeras och tas
          bort på sidan Lärandemål.
        </div>
      )}

      {/* Page Title with Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="py-4 flex items-center">
          <div className="w-60 px-6 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">
              <E k="topbar.bedomning" />
            </span>
          </div>
          <div className="flex-1 px-8 flex gap-4 items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
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
                  {t("tab.halvtid")}
                </button>
                {templateMode && (
                  <button
                    onClick={editText("tab.halvtid")}
                    title="Redigera text"
                    className="p-1 text-gray-400 hover:text-gray-700"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>
              {endtermCreated && (
                <div className="flex items-center gap-1">
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
                    {t("tab.slut")}
                  </button>
                  {templateMode && (
                    <button
                      onClick={editText("tab.slut")}
                      title="Redigera text"
                      className="p-1 text-gray-400 hover:text-gray-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => !templateMode && setReadingMode(!readingMode)}
              className={`ml-auto flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
                readingMode
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Eye className="w-4 h-4" />
              <E k="btn.preview" />
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
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {[
                { section: "praksisinformasjon", key: "nav.vfu" },
                { section: "bedomningskriterier", key: "nav.larandemal" },
                { section: "oppsumering", key: "nav.sammanfattning" },
                {
                  section: "signering",
                  key: activeTerm === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut",
                },
              ].map(({ section, key }) => (
                <li key={section} className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveSection(section)}
                    className={`${navItemClass(section)} flex-1 min-w-0`}
                  >
                    {statusDot(section)}
                    <span className="text-left">{t(key)}</span>
                  </button>
                  {templateMode && (
                    <button
                      onClick={editText(key)}
                      title="Redigera text"
                      className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {activeRole !== "student" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <E k="btn.avbryt" />
                </button>
                <button className="w-full mt-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <E k="btn.handlingsplan" />
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main ref={mainScrollRef} className="flex-1 overflow-auto bg-gray-50 relative">
          <div className="px-8 py-8">
            {activeRole === "supervisor" && !readingMode && !templateMode && (() => {
              const items = [
                akutmottagningFilled,
                ...questions.map((q) => !!grades[q.id]),
                activeTerm === "midterm" ? isSigned : isSignedEnd,
              ];
              const completed = items.filter(Boolean).length;
              const total = items.length;
              const pct = Math.round((completed / total) * 100);
              const color = pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-red-400";
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
                <p className="text-sm text-yellow-800"><span className="font-semibold">{t("tab.halvtid")}</span> <E k="banner.notSigned" /></p>
              </div>
            )}
            {(activeRole === "student" || activeRole === "teacher") && endtermCreated && !isSignedEnd && activeTerm !== "midterm" && (
              <div className="mb-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800"><span className="font-semibold">{t("tab.slut")}</span> <E k="banner.notSigned" /></p>
              </div>
            )}
            {activeRole === "student" && isSigned && !isStudentSigned && (
              <div className="mb-3 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800"><span className="font-semibold">{t("tab.halvtid")}:</span> <E k="banner.pleaseSign" /></p>
              </div>
            )}
            {activeRole === "student" && isSignedEnd && !isStudentSignedEnd && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800"><span className="font-semibold">{t("tab.slut")}:</span> <E k="banner.pleaseSign" /></p>
              </div>
            )}
            {activeRole === "teacher" && isSigned && !isTeacherSigned && (
              <div className="mb-3 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800"><span className="font-semibold">{t("tab.halvtid")}:</span> <E k="banner.pleaseSign" /></p>
              </div>
            )}
            {activeRole === "teacher" && isSignedEnd && !isTeacherSignedEnd && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3 max-w-5xl mx-auto">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800"><span className="font-semibold">{t("tab.slut")}:</span> <E k="banner.pleaseSign" /></p>
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
                    Lärandemål Akutsjukvård
                  </h2>

                  <p className="text-sm text-gray-700 mb-4">
                    Halvtidsbedömning : <span className="font-semibold">O</span>, Slutbedömning : <span className="font-semibold">X</span>
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Lärandemål
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                            Halvtidsbedömning
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                            Slutbedömning
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions
                          .map((q) => ({
                            label: q.title,
                            halvtid: midtermGrades[q.id] ?? null,
                            slut: endtermGrades[q.id] ?? null,
                          }))
                          .map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                              {row.label}
                            </td>
                            <td className={`border border-gray-300 px-4 py-3 text-center text-lg font-bold ${
                              (activeRole === "supervisor" || isSigned) && row.halvtid === "godkand"
                                ? "bg-green-100 text-green-700"
                                : (activeRole === "supervisor" || isSigned) && row.halvtid === "underkand"
                                ? "bg-red-100 text-red-700"
                                : "text-gray-900"
                            }`}>
                              {(activeRole === "supervisor" || isSigned) && (row.halvtid === "godkand" || row.halvtid === "underkand") ? "O" : ""}
                            </td>
                            <td className={`border border-gray-300 px-4 py-3 text-center text-lg font-bold ${
                              (activeRole === "supervisor" || isSignedEnd) && row.slut === "godkand"
                                ? "bg-green-100 text-green-700"
                                : (activeRole === "supervisor" || isSignedEnd) && row.slut === "underkand"
                                ? "bg-red-100 text-red-700"
                                : "text-gray-900"
                            }`}>
                              {(activeRole === "supervisor" || isSignedEnd) && (row.slut === "godkand" || row.slut === "underkand") ? "X" : ""}
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
                        <p>Viktor Torvaldsson - Handledare</p>
                        <p>Datum: 2026-06-05</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">Ej signerad av handledare</p>
                    )}
                    {isTeacherSigned ? (
                      <div>
                        <p className="font-semibold mb-2">Lärare:</p>
                        <p>Lena Karlsson - Lärare</p>
                        <p>Datum: 2026-06-05</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">Ej signerad av lärare</p>
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
                    <p>
                      <span className="font-semibold">Frånvaro:</span> {franvaroDagar || "_______"} dagar{" "}
                      {[
                        franvaroKI && "Av KI sanktionerad uppgift",
                        franvaroSjukdom && "Sjukdom",
                        franvaroAnnat && "Annat",
                      ].filter(Boolean).join(", ") || "—"}
                    </p>
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
                  <div className="space-y-4 text-sm">
                    {isSignedEnd ? (
                      <div>
                        <p className="font-semibold mb-2">Handledare:</p>
                        <p>Viktor Torvaldsson - Handledare</p>
                        <p>Datum: 2026-06-05</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">Ej signerad av handledare</p>
                    )}
                    {isTeacherSignedEnd ? (
                      <div>
                        <p className="font-semibold mb-2">Lärare:</p>
                        <p>Lena Karlsson - Lärare</p>
                        <p>Datum: 2026-06-05</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">Ej signerad av lärare</p>
                    )}
                    {isStudentSignedEnd ? (
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

                {/* Copyright / license footer */}
                <div className="mt-10 pt-6 border-t border-gray-300 text-sm text-gray-900 space-y-1">
                  <p>Detta dokument är vägledande för examinators slutgiltiga betygsbedömning</p>
                  <p>Ansvarig lärares namn</p>
                  <p>
                    Enligt upphovsmannarätten tillhörande författarna Sektionen för omvårdnad Karolinska Institutet
                  </p>
                  <div className="flex items-center justify-center gap-[10px] pt-3">
                    <p className="text-base">
                      <span className="font-bold italic">BeVut</span> Hägg &amp; Ulfvarson 2008
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto">
              {activeSection === "praksisinformasjon" ? (
              /* Praksisinformasjon Form */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300"><E k="vfu.title" /></h1>

                <div className="mb-6 space-y-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold"><E k="vfu.kursLabel" /></span> Akutsjukvård med verksamhetsförlagd utbildning, 7,5 hp
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold"><E k="vfu.kurskodLabel" /></span> B2KS01
                  </p>
                </div>

                <form className="space-y-6">
                  <div>
                    <label htmlFor="studentName" className="block text-sm font-medium text-gray-900 mb-2">
                      <E k="vfu.studentName" />
                    </label>
                    <input
                      type="text"
                      id="studentName"
                      defaultValue="Anna Andersson"
                      readOnly={activeRole === "student"}
                      className={`w-full px-4 py-2 rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default" : "focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="akutmottagning" className="block text-sm font-medium text-gray-900 mb-2">
                      <E k="vfu.enhet" /><span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="akutmottagning"
                      placeholder={t("ph.enhet")}
                      value={akutmottagning}
                      readOnly={activeRole === "student" || templateMode}
                      onClick={templateMode ? editText("ph.enhet") : undefined}
                      onChange={(e) => {
                        setAkutmottagning(e.target.value);
                        setAkutmottagningFilled(!!e.target.value);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : `focus:outline-none focus:ring-2 focus:ring-blue-500 ${showValidationErrors && !akutmottagningFilled ? "border-red-500 border-2" : "border-gray-300"}`}`}
                    />
                  </div>
                </form>

                <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-gray-300"><E k="vfu.planering" /></h2>

                <form className="space-y-6 mt-6">
                  <div>
                    <label htmlFor="genomforandeperiod" className="block text-sm font-medium text-gray-900 mb-2">
                      <E k="vfu.period" />
                    </label>
                    <input
                      type="text"
                      id="genomforandeperiod"
                      defaultValue="2026-04-01 - 2026-06-01"
                      readOnly={activeRole === "student"}
                      className={`w-full px-4 py-2 rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default" : "focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="malformuleringssamtal" className="block text-sm font-medium text-gray-900 mb-2">
                      <E k="vfu.malsamtal" /> <span className="text-gray-500 font-normal"><E k="txt.valgfritt" /></span>
                    </label>
                    <input
                      type="date"
                      id="malformuleringssamtal"
                      value={malformuleringssamtal}
                      readOnly={activeRole === "student"}
                      onChange={(e) => setMalformuleringssamtal(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="halvtidsbedomning" className="block text-sm font-medium text-gray-900 mb-2">
                      <E k="vfu.datumHalvtid" /> <span className="text-gray-500 font-normal"><E k="txt.valgfritt" /></span>
                    </label>
                    <input
                      type="date"
                      id="halvtidsbedomning"
                      value={halvtidsbedomning}
                      readOnly={activeRole === "student"}
                      onChange={(e) => setHalvtidsbedomning(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="slutbedomning" className="block text-sm font-medium text-gray-900 mb-2">
                      <E k="vfu.datumSlut" /> <span className="text-gray-500 font-normal"><E k="txt.valgfritt" /></span>
                    </label>
                    <input
                      type="date"
                      id="slutbedomning"
                      value={slutbedomning}
                      readOnly={activeRole === "student"}
                      onChange={(e) => setSlutbedomning(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm ${activeRole === "student" ? "bg-gray-50 cursor-default border-gray-200" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                    />
                  </div>
                </form>

                <div className="text-sm text-gray-700 leading-relaxed space-y-3 mt-6">
                  <p><E k="vfu.info1" /></p>
                  <p><E k="vfu.info2" /></p>
                  <p><E k="vfu.info3" /></p>
                </div>

                {/* Form status legend */}
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                  {endtermCreated && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-3"><E k="status.slutTitle" /></p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600"><E k="status.skapad" /></span>
                          <span className="text-gray-900">2026-06-05</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600"><E k="status.signHandledare" /></span>
                          {isSignedEnd ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><E k="status.notSigned" /></span>}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600"><E k="status.signLarare" /></span>
                          {isTeacherSignedEnd ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><E k="status.notSigned" /></span>}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600"><E k="status.signStudent" /></span>
                          {isStudentSignedEnd ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><E k="status.notSigned" /></span>}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3"><E k="status.halvtidTitle" /></p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600"><E k="status.skapad" /></span>
                        <span className="text-gray-900">2026-04-01</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600"><E k="status.signHandledare" /></span>
                        {isSigned ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><E k="status.notSigned" /></span>}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600"><E k="status.signLarare" /></span>
                        {isTeacherSigned ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><E k="status.notSigned" /></span>}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600"><E k="status.signStudent" /></span>
                        {isStudentSigned ? <span className="text-gray-900">2026-06-05</span> : <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><E k="status.notSigned" /></span>}
                      </div>
                    </div>
                  </div>
                </div>

                {!endtermCreated && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-800"><E k="vfu.slutInfo" /></p>
                  </div>
                )}
              </div>
            ) : activeSection === "oppsumering" ? (
              /* Oppsumering Page */
              !templateMode && (activeRole === "student" || activeRole === "teacher") && !supervisorSignedNow ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <p className="text-gray-500 text-sm">{t("gate.notVisible")}</p>
                </div>
              ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6"><E k="opp.title" /></h1>

                <form className="space-y-6">

                  {activeTerm === "endterm" && (
                    <div>
                      <label htmlFor="franvaroDagar" className="block text-sm font-medium text-gray-900 mb-2">
                        <E k="opp.franvaro" />
                      </label>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            id="franvaroDagar"
                            min="0"
                            value={franvaroDagar}
                            onChange={(e) => setFranvaroDagar(e.target.value)}
                            placeholder="0"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900"><E k="opp.dagar" /></span>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-900">
                          <input
                            type="checkbox"
                            checked={franvaroKI}
                            onChange={(e) => setFranvaroKI(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <E k="opp.ki" />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-900">
                          <input
                            type="checkbox"
                            checked={franvaroSjukdom}
                            onChange={(e) => setFranvaroSjukdom(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <E k="opp.sjukdom" />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-900">
                          <input
                            type="checkbox"
                            checked={franvaroAnnat}
                            onChange={(e) => setFranvaroAnnat(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <E k="opp.annat" />
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="fungeratBra" className="block text-sm font-medium text-gray-900 mb-2">
                      {activeTerm === "midterm" ? (
                        <><E k="opp.braMid" /> <span className="text-gray-500 font-normal"><E k="txt.valgfritt" /></span></>
                      ) : (
                        <><E k="opp.braEnd" /> <span className="text-gray-500 font-normal"><E k="txt.valgfritt" /></span></>
                      )}
                    </label>
                    <textarea
                      id="fungeratBra"
                      rows={5}
                      value={activeTerm === "midterm" ? fungeratBra : fungeratBraEnd}
                      readOnly={templateMode}
                      onClick={templateMode ? editText("ph.textarea") : undefined}
                      onChange={(e) => {
                        if (activeTerm === "midterm") {
                          setFungeratBra(e.target.value);
                        } else {
                          setFungeratBraEnd(e.target.value);
                          setFungeratBraEndFilled(!!e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                      placeholder={t("ph.textarea")}
                    ></textarea>
                  </div>

                  {activeTerm === "midterm" && (
                    <div>
                      <label htmlFor="tranaMer" className="block text-sm font-medium text-gray-900 mb-2">
                        <E k="opp.tranaMer" /> <span className="text-gray-500 font-normal"><E k="txt.valgfritt" /></span>
                      </label>
                      <textarea
                        id="tranaMer"
                        rows={5}
                        value={tranaMer}
                        readOnly={templateMode}
                        onClick={templateMode ? editText("ph.textarea") : undefined}
                        onChange={(e) => setTranaMer(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        placeholder={t("ph.textarea")}
                      ></textarea>
                    </div>
                  )}
                </form>
              </div>
              )
            ) : activeSection === "bedomningskriterier" ? (
              /* Bedömningskriterier Akutsjukvård Page */
              !templateMode && (activeRole === "student" || activeRole === "teacher") && !supervisorSignedNow ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <p className="text-gray-500 text-sm">{t("gate.notVisible")}</p>
                </div>
              ) : (
              <div className="space-y-6">
                {questions.map((q, i) =>
                  templateMode ? (
                    /* Template editor card: edit texts, remove question */
                    <div key={q.id} id={`assessment-${i + 1}`} className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 relative">
                      <button
                        onClick={() => removeQuestion(q.id)}
                        title="Ta bort lärandemål"
                        className="absolute top-4 right-4 p-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-900 mb-1"><E k="q.topLabel" /></p>
                        <h2
                          onClick={editQuestionText(q.id, "title")}
                          title="Klicka för att redigera texten"
                          className="text-xl font-bold text-gray-900 max-w-xl cursor-pointer rounded px-0.5 outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
                        >
                          {q.title}
                        </h2>
                      </div>
                      <div className="flex gap-4 items-stretch">
                        <div className="flex-1 flex flex-col">
                          <p className="text-sm font-semibold text-gray-700 mb-3">
                            <E k={activeTerm === "midterm" ? "q.colPassMid" : "q.colPassEnd"} />
                          </p>
                          <div
                            onClick={editQuestionText(q.id, "godkandText")}
                            title="Klicka för att redigera texten"
                            className="flex-1 p-6 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 outline-dashed outline-1 outline-blue-400"
                          >
                            <p className="text-sm leading-relaxed">{q.godkandText}</p>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <p className="text-sm font-semibold text-gray-700 mb-3">
                            <E k={activeTerm === "midterm" ? "q.colFailMid" : "q.colFailEnd"} />
                          </p>
                          <div
                            onClick={editQuestionText(q.id, "underkandText")}
                            title="Klicka för att redigera texten"
                            className="flex-1 p-6 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 outline-dashed outline-1 outline-blue-400"
                          >
                            <p className="text-sm leading-relaxed">{q.underkandText}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={q.id} id={`assessment-${i + 1}`} className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                      <AssessmentQuestion
                        title={q.title}
                        godkandText={q.godkandText}
                        underkandText={q.underkandText}
                        selectedValue={grades[q.id] ?? null}
                        onSelect={(v) => setGrade(q.id, v)}
                        readOnly={supervisorSignedNow || activeRole !== "supervisor"}
                        midtermValue={activeTerm === "endterm" ? midtermGrades[q.id] : undefined}
                        marker={activeTerm === "midterm" ? "O" : "X"}
                        topLabel={t("q.topLabel")}
                        passHeading={t(activeTerm === "midterm" ? "q.colPassMid" : "q.colPassEnd")}
                        failHeading={t(activeTerm === "midterm" ? "q.colFailMid" : "q.colFailEnd")}
                        showMidtermLabel={t("q.showMidterm")}
                        hideMidtermLabel={t("q.hideMidterm")}
                      />
                    </div>
                  )
                )}
                {templateMode && (
                  <button
                    onClick={addQuestion}
                    className="w-full py-4 border-2 border-dashed border-blue-400 rounded-lg text-blue-600 text-sm font-semibold hover:bg-blue-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Lägg till lärandemål
                  </button>
                )}
              </div>
              )
            ) : activeSection === "signering" ? (
              /* Signering av sluttvurdering Page */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  <E k={activeTerm === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut"} />
                </h1>

                {!templateMode && (activeRole === "student" || activeRole === "teacher") && !supervisorSignedNow ? (
                  <div className="py-12 text-center text-gray-500 text-sm italic">
                    {t("sign.waiting")}
                  </div>
                ) : (
                <>
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4"><E k="sign.summaryTitle" /></h2>
                  <AssessmentSummary
                    marker={activeTerm === "midterm" ? "O" : "X"}
                    assessments={questions.map((q) => ({
                      title: q.title,
                      selectedValue: grades[q.id] ?? null,
                    }))}
                    larandemalHeading={<E k="summary.larandemal" />}
                    passHeading={<E k={activeTerm === "midterm" ? "summary.passMid" : "summary.passEnd"} />}
                    failHeading={<E k={activeTerm === "midterm" ? "summary.failMid" : "summary.failEnd"} />}
                  />
                </div>

                {/* Sign section */}
                <div id="sign-section">
                  {(activeTerm === "midterm" ? !isSigned : !isSignedEnd) && activeRole === "supervisor" ? (
                    <div>
                      {showValidationErrors && validateAllFields().length > 0 && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 mb-2"><E k="val.heading" /></p>
                          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                            {!akutmottagningFilled && <li><E k="val.enhet" /></li>}
                            {questions.map((q, i) =>
                              !grades[q.id] ? (
                                <li key={q.id}>Bedömningskriterium {i + 1} ({t("nav.larandemal")})</li>
                              ) : null
                            )}
                            {!signDatumNow && <li><E k="val.datum" /></li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Signature Info */
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-3"><E k="sign.signedBy" /></p>
                      <div className="flex items-center gap-3 w-fit">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          VT
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Viktor Torvaldsson</p>
                          <p className="text-xs text-gray-600">Handledare</p>
                        </div>
                        <div className="pl-4">
                          <p className="text-sm text-gray-700">{signDatumNow || "2026-06-05"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(activeRole === "student" || activeRole === "teacher") && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4"><E k="sign.studentSection" /></h3>
                    {!supervisorSignedNow ? (
                      <p className="text-sm text-gray-500 italic"><E k="sign.waitingShort" /></p>
                    ) : studentSignedNow ? (
                      <div className="flex items-center gap-3 w-fit">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">AA</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Anna Andersson</p>
                          <p className="text-xs text-gray-600">Student</p>
                        </div>
                        <div className="pl-4"><p className="text-sm text-gray-700">{signDatumNow || "2026-06-05"}</p></div>
                      </div>
                    ) : activeRole === "teacher" ? (
                      <p className="text-sm text-gray-500 italic"><E k="sign.ejStudent" /></p>
                    ) : (
                      <p className="text-sm text-gray-500 italic"><E k="sign.useAction" /></p>
                    )}
                  </div>
                )}

                {(activeRole === "student" || activeRole === "teacher") && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4"><E k="sign.teacherSection" /></h3>
                    {!supervisorSignedNow ? (
                      <p className="text-sm text-gray-500 italic"><E k="sign.waitingShort" /></p>
                    ) : teacherSignedNow ? (
                      <div className="flex items-center gap-3 w-fit">
                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">LK</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Lena Karlsson</p>
                          <p className="text-xs text-gray-600">Lärare</p>
                        </div>
                        <div className="pl-4"><p className="text-sm text-gray-700">{signDatumNow || "2026-06-05"}</p></div>
                      </div>
                    ) : activeRole === "student" ? (
                      <p className="text-sm text-gray-500 italic"><E k="sign.ejLarare" /></p>
                    ) : (
                      <p className="text-sm text-gray-500 italic"><E k="sign.useAction" /></p>
                    )}
                  </div>
                )}

                {!currentRoleSigned && (
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-800"><E k="sign.checkPreview" /></p>
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

              {/* Inline sign action (form view, Signering page) — shown after the form, before the divider */}
              {activeSection === "signering" && currentSignAction() && (
                <div className="mt-8 flex justify-center">
                  {currentSignAction()}
                </div>
              )}

              {/* Föregående / Nästa step navigation */}
              <nav className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6" aria-label="Sidnavigering">
                {sectionIndex > 0 ? (
                  <button
                    onClick={() => goToSection(sectionIndex - 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <E k="btn.prev" />
                  </button>
                ) : (
                  <span />
                )}
                {sectionIndex < sectionOrder.length - 1 && (
                  <button
                    onClick={() => goToSection(sectionIndex + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <E k="btn.next" />
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </nav>
              </div>
            )}
          </div>
          {/* Floating sign action — reading mode only */}
          {readingMode && currentSignAction() && (
            <div className="sticky bottom-6 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">{currentSignAction()}</div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Full Height */}
        <aside className="w-80 bg-white overflow-auto border-l border-gray-200 p-8">
          <div className="mb-4">
            <span className="text-sm font-bold text-gray-900 tracking-wide">
              Innehåll
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
              <a href="#" onClick={scrollTo("akutmottagning")} className="flex items-start gap-2 group">
                {rsIcon(akutmottagningFilled, true, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  Vårdavdelning/enhet
                </span>
              </a>
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
                    {rsIcon(fungeratBraEndFilled, false)}
                    <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                      Eventuella kommentarer utöver det som framgår av Bedömningskriterierna
                    </span>
                  </a>
                </>
              )}
            </div>
          ) : activeSection === "bedomningskriterier" ? (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <a key={q.id} href="#" onClick={scrollTo(`assessment-${i + 1}`)} className="flex items-start gap-2 group">
                  {rsIcon(!!grades[q.id], true)}
                  <span className="text-sm text-blue-600 group-hover:underline line-clamp-2">
                    {q.title}
                  </span>
                </a>
              ))}
            </div>
          ) : activeSection === "signering" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("sign-section")} className="flex items-start gap-2 group">
                {rsIcon(supervisorSignedNow, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  {activeTerm === "midterm" ? "Signering av halvtidsbedömning" : "Signering av slutbedömning"}
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