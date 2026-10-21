/// <reference path="../vite-env.d.ts" />
import {
  ChevronDown,
  ChevronLeft,
  X,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Info,
  Lock,
  Menu,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { USER_GUIDE_HTML } from "./userGuide";
import { RichText, RichTextEditor, plainTextLength } from "./components/RichText";
import { RoleCommentField, formatShortDate, formatDate, formatDateTime } from "./components/RoleCommentField";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { MobileDrawer } from "./components/MobileDrawer";
import {
  CategoryPage,
  roleScore,
  PEOPLE,
  PEOPLE_LIST,
  peopleOfRole,
  personById,
  ROLE_STYLE,
  type Category,
  type CategoryResponse,
  type Person,
  type Role,
} from "./components/CategoryPage";

// The six main categories are fixed (title order and structure); their LUBs and description are template-driven.
const PLACEHOLDER_DESCRIPTION =
  "<p>Operasjonalisert tekst for hvordan læringsutbyttene tolkes og observeres i praksis. Rediger teksten i malmodus.</p>";
const categoryTitles = [
  "Profesjonell kommunikasjon, undervisning og veiledning",
  "Sykepleieprosessen",
  "Samhandling og samarbeid",
  "Pasientsikkerhet, legemiddelhåndtering og smittevern",
  "Ledelse, helse- og omsorgsteknologi og kvalitetsarbeid",
  "Profesjonell kompetanse",
];
const initialCategories: Category[] = categoryTitles.map((title, i) => ({
  id: `cat-${i + 1}`,
  title,
  lubs: [1, 2, 3].map((n) => ({ id: i * 10 + n, number: `LUB ${i + 1}.${n}`, text: `Læringsutbytte ${n} for emnet (rediger i malmodus).` })),
  description: PLACEHOLDER_DESCRIPTION,
}));
// Mock info for each question page (prototype). Template mode can still edit, remove and add more.
const mockInfos = (topic: string, example: string): { title: string; body: string }[] => [
  {
    title: "Om denne kategorien",
    body: `<p>Denne kategorien handler om <b>${topic}</b>. Vurderingen skal vise hva studenten mestrer i praksis, ikke bare hva studenten kan beskrive.</p><ul><li>Se på hele praksisperioden, ikke enkelthendelser.</li><li>Begrunn måloppnåelsen med konkrete eksempler.</li></ul>`,
  },
  {
    title: "Eksempler på observasjoner",
    body: `<p>Eksempler som kan brukes i vurderingen:</p><ol><li>${example}</li><li>Studenten reflekterer over egen praksis og tar imot veiledning.</li><li>Studenten viser utvikling fra start til slutt i perioden.</li></ol>`,
  },
];
const initialPageInfos: Record<string, { id: number; title: string; body: string }[]> = Object.fromEntries(
  [
    ["cat-1", "kommunikasjon, undervisning og veiledning", "Studenten tilpasser språk og informasjon til pasientens behov."],
    ["cat-2", "sykepleieprosessen fra kartlegging til evaluering", "Studenten kartlegger, planlegger og evaluerer tiltak sammen med pasienten."],
    ["cat-3", "samhandling og samarbeid med pasient, pårørende og kolleger", "Studenten bidrar aktivt i tverrfaglige møter og overleveringer."],
    ["cat-4", "pasientsikkerhet, legemiddelhåndtering og smittevern", "Studenten følger rutiner for håndhygiene og legemiddelhåndtering."],
    ["cat-5", "ledelse, helse- og omsorgsteknologi og kvalitetsarbeid", "Studenten bruker tilgjengelig teknologi og melder avvik ved behov."],
    ["cat-6", "profesjonell kompetanse og yrkesetikk", "Studenten viser faglig forsvarlighet og tar ansvar for egne handlinger."],
  ].map(([id, topic, ex], i) => [id, mockInfos(topic, ex).map((m, j) => ({ id: 100 + i * 10 + j, ...m }))])
);
const INFO_MIN_W = 280;
const INFO_MAX_W = 760;
const INFO_DEFAULT_W = 420;
const clampInfoWidth = (w: number) => Math.min(INFO_MAX_W, Math.max(INFO_MIN_W, w));
const emptyResponse: CategoryResponse = {
  student: "",
  supervisor: "",
  teacher: "",
  textBy: { student: "s1", supervisor: "v1", teacher: "t1" },
  scores: {},
};
// Workflow per term: student and supervisor submit; the teacher grades and signs; then student and supervisor sign.
interface TermFlow {
  submitted: { student: boolean; supervisor: boolean };
  signed: Record<Role, boolean>;
  // Silent system timestamps (ISO) of each signature, and the date the teacher picks as completion date.
  signedAt: Record<Role, string>;
  completionDate: string;
  // Absence days ("Fraværsdager"), entered by the teacher; "" = not filled in (0 is a valid answer).
  absenceDays: string;
  // Final assessment only: the teacher's decision "Praksisen blir vurdert som: Bestått / Ikke bestått".
  outcome: "pass" | "fail" | null;
  // Final assessment only: does the student need a transfer conversation ("Behov for overføringssamtale?")
  transferTalk: boolean;
  // The teacher's last comments ("Oppsummering for midt-/sluttvurdering"), rich-text HTML, in both terms.
  finalComment: string;
  // ISO date each role published (student/supervisor: submitted, teacher: signed)
  publishedAt: Record<Role, string>;
}
const emptyFlow: TermFlow = {
  submitted: { student: false, supervisor: false },
  signed: { student: false, supervisor: false, teacher: false },
  signedAt: { student: "", supervisor: "", teacher: "" },
  completionDate: "",
  absenceDays: "",
  outcome: null,
  transferTalk: false,
  finalComment: "",
  publishedAt: { student: "", supervisor: "", teacher: "" },
};
type Term = "midterm" | "endterm";

// Filled in automatically by the system (prototype sample values).
const SYSTEM_INFO = {
  studentName: "Anna Andersson",
  studentNumber: "245817",
  period: "Praksisstudier 2 – vår 2026",
  startDate: "2026-04-01",
  endDate: "2026-06-12",
};

// Every user-facing string in the form view, editable by admins in template mode.
const defaultTexts: Record<string, string> = {
  "topbar.bedomning": "VURDERING",
  "tab.halvtid": "Halvtidsvurdering",
  "tab.slut": "Sluttvurdering",
  "btn.preview": "Forhåndsvisning",
  "nav.vfu": "Praksisinformasjon",
  "nav.signering.halvtid": "Godkjenning av vurdering",
  "nav.signering.slut": "Godkjenning av vurdering",
  "btn.avbryt": "Avbryt vurderingsprosess",
  "btn.handlingsplan": "Gi varsel",
  "warn.title": "Gi varsel",
  "warn.body": "Her kan brukeren aktivere «Fare for» og «Overføringssamtale», som i dagens skjema.",
  "warn.proto": "Denne funksjonen er ikke med i prototypen.",
  "warn.close": "Lukk",
  "cancel.title": "Avbryt vurderingsprosess",
  "cancel.body": "Når du avbryter vurderingsprosessen, kan ikke student, praksisveileder eller du sende inn eller signere mer i dette skjemaet. Begrunnelsen vises for alle på siden Praksisinformasjon.",
  "cancel.reasonLabel": "Begrunnelse for avbrytelsen",
  "cancel.reasonHint": "Obligatorisk. Skriv hvorfor vurderingsprosessen avbrytes.",
  "cancel.reasonRequired": "Skriv en begrunnelse for å avbryte vurderingsprosessen.",
  "cancel.confirm": "Avbryt vurderingsprosessen",
  "cancel.back": "Tilbake",
  "cancel.bannerTitle": "Vurderingsprosessen er avbrutt",
  "cancel.bannerReason": "Begrunnelse",
  "cancel.bannerBy": "Avbrutt av",
  "cancel.blocker": "Vurderingsprosessen er avbrutt.",
  "btn.prev": "Forrige",
  "btn.next": "Neste",
  "vfu.studentName": "Studentnavn",
  "vfu.studentNumber": "Studentnummer",
  "vfu.placement": "Praksisplass",
  "vfu.placementPlaceholder": "Skriv inn praksisplass",
  "vfu.period": "Praksisperiode",
  "vfu.dates": "Start–sluttdato",
  "vfu.autoHint": "Studentnavn, studentnummer, praksisperiode og datoer hentes automatisk fra systemet.",
  "status.halvtidTitle": "Halvtidsvurdering",
  "status.slutTitle": "Sluttvurdering",
  "status.skapad": "Opprettet",
  "status.signHandledare": "Signert av veileder",
  "status.signLarare": "Signert av lærer",
  "status.signStudent": "Signert av student",
  "status.notSigned": "Ikke signert",
  "vfu.slutInfo": "Sluttvurderingen blir synlig når alle roller har signert halvtidsvurderingen",
  "nav.step": "Steg {n} av {total}",
  "nav.menu": "Navigasjon",
  "nav.close": "Lukk",
  "toc.jump": "Hopp til",
  "dot.todo": "Ikke startet",
  "dot.progress": "Under arbeid",
  "dot.done": "Ferdig",
  "dot.error": "Mangler",
  "dot.legend": "Forklaring til symboler",
  "flow.nextStep": "Neste steg:",
  "flow.confirmHeading": "Bekreftelse før signering",
  "flow.nextFill": "Fyll ut måloppnåelse i {n} kategorier.",
  "flow.nextFillStudent": "Fyll ut kommentar og måloppnåelse i {n} kategorier.",
  "flow.nextSubmit": "Send inn skjemaet.",
  "flow.nextSign": "Signer skjemaet.",
  "flow.nextWaiting": "Venter på {who}.",
  "flow.goToSigning": "Gå til Godkjenning",
  "flow.allCategoriesDone": "Alle kategorier er fullført.",
  "flow.progressDone": "{done} av {total} kategorier fullført",
  "flow.progressLabel": "Fremdrift i kategoriene",
  "cat.lubHeading": "Læringsutbytter (LUB)",
  "cat.descHeading": "Beskrivelse av læringsutbyttene",
  "cat.assessHeading": "Vurdering og kommentarer",
  "cat.fieldStudent": "Studentens egenvurdering",
  "cat.fieldSupervisor": "Praksisveileders vurdering",
  "cat.fieldTeacher": "Lærers vurdering",
  "cat.placeholder": "Skriv her …",
  "cat.gradedBy": "Vurdert av",
  "cat.agreeLegend": "Grønn: flere roller har valgt samme nivå",
  "cat.you": "Du",
  "cat.save": "Lagre",
  "cat.cancel": "Avbryt",
  "cat.unsaved": "Ikke lagret",
  "cat.noComment": "Ingen kommentar",
  "cat.midtermShow": "Vis halvtidsvurderingen for denne kategorien",
  "cat.midtermHide": "Skjul halvtidsvurderingen",
  "cat.badgeStudent": "Student",
  "cat.badgeSupervisor": "Veileder",
  "cat.badgeTeacher": "Lærer",
  "cat.awaiting": "Venter på",
  "cat.visibleAfterSubmit": "Vises etter at du har sendt inn",
  "cat.scoreHintOwn": "Velg din egen måloppnåelse. Den vises for de andre rollene etter innsending.",
  "cat.scoreHintTeacher": "Velg endelig måloppnåelse. Den vises for student og praksisveileder etter at du har signert.",
  "cat.roleStudent": "student",
  "cat.roleSupervisor": "praksisveileder",
  "cat.roleTeacher": "lærer",
  "cat.scoreHeading": "Måloppnåelse",
  "cat.scoreRequired": "Velg et nivå på skåringslinjen for å kunne signere.",
  "cat.showMore": "Vis mer",
  "cat.showLess": "Vis mindre",
  "lik.1.label": "Lav måloppnåelse",
  "lik.1.desc": "betyr at målet i liten grad er oppnådd, og at det gjenstår arbeid for å nå forventet nivå.",
  "lik.2.label": "Delvis måloppnåelse",
  "lik.2.desc": "betyr at noen deler av målet er oppnådd, men vesentlige deler gjenstår.",
  "lik.3.label": "God måloppnåelse",
  "lik.3.desc": "forventet nivå – betyr at målet i hovedsak er oppnådd, og at resultatet svarer til forventningene.",
  "lik.4.label": "Høy måloppnåelse",
  "lik.4.desc": "betyr at målet er oppnådd i stor grad, med resultater som på flere områder overstiger forventningene.",
  "lik.5.label": "Svært høy måloppnåelse",
  "lik.5.desc": "betyr at målet er overgått, med resultater som klart overstiger forventningene.",
  "summary.category": "Hovedkategori",
  "summary.colStudent": "Student",
  "summary.colSupervisor": "Praksisveileder",
  "summary.colTeacher": "Lærer – endelig vurdering",
  "summary.none": "Ikke vurdert",
  "final.heading": "Praksisen blir vurdert som:",
  "final.commentsHeading.midterm": "Oppsummering for midtvurdering",
  "final.commentsHeading.endterm": "Oppsummering for sluttvurdering",
  "final.transferTalk": "Behov for overføringssamtale?",
  "final.yes": "Ja",
  "final.no": "Nei",
  "final.label": "Vurdering",
  "final.waiting": "Vurderingen vises når læreren har signert.",
  "final.chosen": "Vurdering valgt: {outcome}",
  "flow.required": "(obligatorisk)",
  "flow.confirmed": "Bekreftet",
  "flow.signedBy": "Signert av {name}, {date}",
  "flow.consentWithOutcome": "Jeg har lest og forstått innholdet og signerer skjemaet med vurderingen {outcome}.",
  "final.pass": "Bestått",
  "final.fail": "Ikke bestått",
  "final.need": "Velg om praksisen er bestått eller ikke bestått.",
  "sign.summaryTitle": "Oppsummering – måloppnåelse per hovedkategori",
  "sign.btnSupervisor": "Signer som praksisveileder",
  "sign.btnStudent": "Signer som student",
  "sign.btnTeacher": "Signer som lærer",
  "sign.signedBy": "Signert av:",
  "sign.studentSection": "Studentens signatur",
  "sign.teacherSection": "Lærerens signatur",
  "sign.ejStudent": "Ikke signert av student.",
  "sign.ejLarare": "Ikke signert av lærer.",
  "sign.useAction": "Bruk handlingsfeltet nedenfor for å signere.",
  "val.heading": "Vennligst fyll ut alle obligatoriske felt:",
  "flow.btnSubmit": "Send inn",
  "flow.readySubmit": "Klar til å sende inn.",
  "flow.readySign": "Klar til å signere.",
  "flow.missingScores": "Mangler måloppnåelse i {n} av {total} kategorier.",
  "flow.missingStudent": "Mangler kommentar eller måloppnåelse i {n} av {total} kategorier.",
  "cat.commentRequired": "Skriv en kommentar i egenvurderingen.",
  "cat.commentRequiredSupervisor": "Skriv en kommentar når du gir lav måloppnåelse.",
  "flow.goToFirst": "Gå til første",
  "flow.waitTeacherSign": "Innsendt. Når læreren har signert, kan du signere.",
  "flow.confirmSubmitTitle": "Send inn skjemaet?",
  "flow.confirmSubmitBody": "Etter innsending er skjemaet skrivebeskyttet for deg. Bare læreren kan åpne det på nytt.",
  "flow.confirmSignTitle": "Signer skjemaet?",
  "flow.confirmSignBody": "Du signerer som {name}. Signaturen kan ikke trekkes tilbake. Tidspunktet for signeringen registreres automatisk.",
  "flow.confirmCancel": "Avbryt",
  "flow.completionLabel": "Fullføringsdato",
  "flow.needCompletion": "Velg fullføringsdato.",
  "flow.absenceLabel": "Fraværsdager",
  "flow.needAbsence": "Fyll inn fraværsdager (0 eller flere).",
  "flow.consent": "Jeg har lest og forstått innholdet og signerer skjemaet.",
  "flow.consentRequired": "Du må bekrefte at du har lest og forstått skjemaet før du kan signere.",
  "flow.needConsent": "Bekreft at du har lest og forstått skjemaet.",
  "flow.toastSubmitted": "Skjemaet er sendt inn.",
  "flow.toastSigned": "Du har signert.",
  "flow.needStudent": "Studenten har ikke sendt inn ennå.",
  "flow.needSupervisor": "Praksisveileder har ikke sendt inn ennå.",
  "flow.needTeacher": "Læreren må signere først.",
  "flow.bannerFill": "Fyll ut din vurdering og måloppnåelse, og send inn under Godkjenning. Etter innsending er skjemaet skrivebeskyttet; kun læreren kan åpne det på nytt.",
  "flow.bannerSubmitted": "Innsendt. Du ser nå den andres vurdering og måloppnåelse så snart den er innsendt. Venter på lærerens gjennomgang og endelige vurdering.",
  "flow.bannerTeacherWait": "Venter på innsending fra:",
  "flow.bannerTeacherReview": "Gjennomgå skjemaene, gi endelig måloppnåelse og signer. Du kan åpne et innsendt skjema på nytt under Godkjenning.",
  "flow.bannerTeacherSigned": "Læreren har signert. Venter på signatur fra:",
  "flow.bannerPleaseSign": "Læreren har signert. Gjennomgå og signer skjemaet.",
  "flow.bannerAllSigned": "Alle har signert.",
  "flow.stepSubmitted": "Innsendt",
  "flow.stepNotSubmitted": "Ikke innsendt",
  "flow.reopen": "Åpne på nytt",
  "flow.reopenDisabled": "Læreren har signert skjemaet. Skjemaet kan ikke åpnes på nytt.",
  "flow.popupTitle": "Du kan ikke gi måloppnåelse ennå",
  "flow.popupBody": "Student og praksisveileder må sende inn skjemaet før du kan gi endelig måloppnåelse.",
  "flow.popupOk": "OK",
  "flow.stepSubmit": "Innsending",
  "flow.stepSign": "Signering",
  "flow.stepDone": "Signert",
  "flow.stepPending": "Ikke signert",
  "flow.panelTitle": "Innsending og signering",
  "flow.signedTeacher": "Signert av lærer",
  "flow.panelHint": "Rekkefølge: student og praksisveileder sender inn → læreren gjennomgår, gir endelig måloppnåelse og signerer → student og praksisveileder signerer.",
  "summary.legendNote": "Måloppnåelse per rolle",
};

// Template texts that are edited with the rich text editor and stored as HTML.
const richKeys = new Set<string>();

export default function App() {
  const [activeSection, setActiveSection] = useState("praksisinformasjon");
  const [activeTerm, setActiveTerm] = useState<"midterm" | "endterm">("midterm");
  const [endtermCreated, setEndtermCreated] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const [activeRole, setActiveRole] = useState<"supervisor" | "student" | "teacher">("supervisor");
  // Which person acts in each role (supervisors and teachers can be several).
  const [actingAs, setActingAs] = useState<Record<Role, string>>({ student: "s1", supervisor: "v1", teacher: "t1" });
  const me: Person = PEOPLE_LIST.find((p) => p.id === actingAs[activeRole]) ?? PEOPLE[activeRole];

  // Template (admin) edit mode
  const [templateMode, setTemplateMode] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>(defaultTexts);
  const [editing, setEditing] = useState<{ value: string; save: (v: string) => void; rich?: boolean } | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const nextLubId = useRef(1000);
  // Info parts on the Praksisinformasjon page (title + rich-text body), added in template mode and shown collapsed to all roles.
  const [infoParts, setInfoParts] = useState<{ id: number; title: string; body: string }[]>([]);
  const nextInfoId = useRef(1000);
  // Info for each question page (title + rich-text body), added in template mode, opened in a right-hand overlay.
  const [pageInfos, setPageInfos] = useState<Record<string, { id: number; title: string; body: string }[]>>(initialPageInfos);
  const [infoWidth, setInfoWidth] = useState(INFO_DEFAULT_W);
  const [openInfo, setOpenInfo] = useState<{ title: string; body: string } | null>(null);
  // Responses per term and category: three free-text fields plus the 5-step score.
  const [responses, setResponses] = useState<Record<Term, Record<string, CategoryResponse>>>({ midterm: {}, endterm: {} });

  const [flow, setFlow] = useState<Record<Term, TermFlow>>({ midterm: emptyFlow, endterm: emptyFlow });
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showEndtermPopup, setShowEndtermPopup] = useState(false);
  const [showGradeBlocked, setShowGradeBlocked] = useState(false);
  // Confirmation dialog for the irreversible actions, and a short confirmation message afterwards.
  const [confirmAction, setConfirmAction] = useState<null | "submit" | "sign">(null);
  // Information-only popups for functions outside this prototype.
  const [infoPopup, setInfoPopup] = useState<null | "warn">(null);
  // The teacher can cancel the whole assessment process with a mandatory reason, shown on Praksisinformasjon.
  const [cancellation, setCancellation] = useState<null | { reason: string; by: string; at: string }>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState(false);
  const closeCancelDialog = () => {
    setShowCancelDialog(false);
    setCancelReason("");
    setCancelReasonError(false);
  };
  const confirmCancellation = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelReasonError(true);
      return;
    }
    setCancellation({ reason, by: me.name, at: new Date().toISOString() });
    closeCancelDialog();
    setActiveSection("praksisinformasjon");
  };
  const [toast, setToast] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  // Praksisplass is typed in manually (supervisor/teacher); the other items come from the system.
  const [placement, setPlacement] = useState("");
  const navTriggerRef = useRef<HTMLButtonElement>(null);
  // Consent checkbox in the form ("I have read and understood…"): unticked whenever the signer, term or page changes.
  const [consent, setConsent] = useState(false);
  useEffect(() => setConsent(false), [activeRole, activeTerm, activeSection, readingMode]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);
  const patchFlow = (term: Term, fn: (f: TermFlow) => TermFlow) => setFlow((prev) => ({ ...prev, [term]: fn(prev[term]) }));

  // Per-term signature flags (kept as named values for the status views).
  const isSigned = flow.midterm.signed.supervisor;
  const isSignedEnd = flow.endterm.signed.supervisor;
  const isStudentSigned = flow.midterm.signed.student;
  const isTeacherSigned = flow.midterm.signed.teacher;
  const isStudentSignedEnd = flow.endterm.signed.student;
  const isTeacherSignedEnd = flow.endterm.signed.teacher;
  const allSignedMid = isSigned && isStudentSigned && isTeacherSigned;

  // When all three roles have signed the midterm, open the endterm form automatically
  useEffect(() => {
    if (allSignedMid) {
      setEndtermCreated(true);
      setActiveTerm("endterm");
      setShowEndtermPopup(true);
    }
  }, [allSignedMid]);

  // Template texts: look up a user-facing string by key.
  const t = (key: string) => texts[key] ?? defaultTexts[key] ?? key;
  // Open the edit popup for a template text key.
  const editText = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing({ value: t(key), rich: richKeys.has(key), save: (v) => setTexts((prev) => ({ ...prev, [key]: v })) });
  };
  // Editable text: renders the plain string normally; in template mode it becomes click-to-edit.
  const E = ({ k }: { k: string }) =>
    richKeys.has(k) ? (
      templateMode ? (
        <div
          onClick={editText(k)}
          title="Klikk for å redigere teksten"
          className="cursor-pointer rounded px-2 py-2 min-h-[96px] outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
        >
          {t(k).replace(/<[^>]*>|&nbsp;|\s/g, "") ? (
            <RichText html={t(k)} />
          ) : (
            <span className="text-blue-500 italic">Klikk her for å legge til tekst</span>
          )}
        </div>
      ) : (
        <RichText html={t(k)} />
      )
    ) : templateMode ? (
      <span
        onClick={editText(k)}
        title="Klikk for å redigere teksten"
        className="cursor-pointer rounded px-0.5 outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
      >
        {t(k)}
      </span>
    ) : (
      <>{t(k)}</>
    );

  // Responses for the active term, keyed by category id.
  const respFor = (catId: string, term: Term = activeTerm): CategoryResponse => responses[term][catId] ?? emptyResponse;
  const updateResp = (catId: string, patch: Partial<CategoryResponse>) =>
    setResponses((prev) => ({
      ...prev,
      [activeTerm]: { ...prev[activeTerm], [catId]: { ...(prev[activeTerm][catId] ?? emptyResponse), ...patch } },
    }));
  const setMyScore = (catId: string, level: number | null) =>
    setResponses((prev) => {
      const cur0 = prev[activeTerm][catId] ?? emptyResponse;
      // One shared score per role and category: whoever saves last wins.
      const scores = { ...cur0.scores };
      if (level === null) delete scores[activeRole];
      else scores[activeRole] = { level, at: todayStr, by: me.id };
      return { ...prev, [activeTerm]: { ...prev[activeTerm], [catId]: { ...cur0, scores } } };
    });
  const saveText = (catId: string, key: "student" | "supervisor" | "teacher", html: string) =>
    setResponses((prev) => {
      const cur0 = prev[activeTerm][catId] ?? emptyResponse;
      return {
        ...prev,
        [activeTerm]: { ...prev[activeTerm], [catId]: { ...cur0, [key]: html, textBy: { ...cur0.textBy, [key]: me.id } } },
      };
    });
  const updateCategory = (catId: string, patch: Partial<Category>) =>
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, ...patch } : c)));
  const editCategoryTitle = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setEditing({ value: cat.title, save: (v) => updateCategory(catId, { title: v }) });
  };
  const editLub = (catId: string, lubId: number) => {
    const lub = categories.find((c) => c.id === catId)?.lubs.find((l) => l.id === lubId);
    if (!lub) return;
    setEditing({
      value: lub.text,
      save: (v) =>
        setCategories((prev) =>
          prev.map((c) => (c.id === catId ? { ...c, lubs: c.lubs.map((l) => (l.id === lubId ? { ...l, text: v } : l)) } : c))
        ),
    });
  };
  const editLubNumber = (catId: string, lubId: number) => {
    const lub = categories.find((c) => c.id === catId)?.lubs.find((l) => l.id === lubId);
    if (!lub) return;
    setEditing({
      value: lub.number,
      save: (v) =>
        setCategories((prev) =>
          prev.map((c) => (c.id === catId ? { ...c, lubs: c.lubs.map((l) => (l.id === lubId ? { ...l, number: v } : l)) } : c))
        ),
    });
  };
  const addLub = (catId: string) =>
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, lubs: [...c.lubs, { id: nextLubId.current++, number: "", text: "Nytt læringsutbytte" }] } : c
      )
    );
  const removeLub = (catId: string, lubId: number) =>
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, lubs: c.lubs.filter((l) => l.id !== lubId) } : c)));
  const patchInfoPart = (id: number, patch: { title?: string; body?: string }) =>
    setInfoParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const addInfoPart = () => setInfoParts((prev) => [...prev, { id: nextInfoId.current++, title: "Ny infodel", body: "" }]);
  const removeInfoPart = (id: number) => setInfoParts((prev) => prev.filter((p) => p.id !== id));
  const likertLevels = [1, 2, 3, 4, 5].map((n) => ({ label: <E k={`lik.${n}.label`} />, description: <E k={`lik.${n}.desc`} /> }));
  const likertLabels = [1, 2, 3, 4, 5].map((n) => t(`lik.${n}.label`));

  // --- Workflow for the active term -----------------------------------------------------------
  const cur = flow[activeTerm];
  // "Done" = student/supervisor have submitted, teacher has signed. Done content is locked and visible to the others.
  const doneNow: Record<Role, boolean> = {
    student: cur.submitted.student,
    supervisor: cur.submitted.supervisor,
    teacher: cur.signed.teacher,
  };
  const bothSubmitted = cur.submitted.student && cur.submitted.supervisor;
  const supervisorSignedNow = cur.signed.supervisor;
  const studentSignedNow = cur.signed.student;
  const teacherSignedNow = cur.signed.teacher;
  const currentRoleSigned = cur.signed[activeRole];
  // A role's content is visible to the others once it is done (submitted / teacher signed); you always see your own.
  const roleDone = (r: Role, term: Term) => (r === "teacher" ? flow[term].signed.teacher : flow[term].submitted[r]);
  const canSee = (r: Role, term: Term) => {
    if (activeRole === r) return true;
    if (r === "teacher" || activeRole === "teacher") return roleDone(r, term);
    // student and supervisor see each other's content only after submitting themselves
    return roleDone(activeRole, term) && roleDone(r, term);
  };
  // Categories where the active role has not yet given a Måloppnåelse score.
  // Student: the written self-assessment is mandatory in every category too, so a category is incomplete without a saved comment.
  // Supervisor: a comment is mandatory when giving Lav måloppnåelse (level 0).
  const commentMissing = (c: { id: string }) => {
    const r = respFor(c.id);
    if (activeRole === "student") return plainTextLength(r.student) === 0;
    if (activeRole === "supervisor") return roleScore(r, "supervisor") === 0 && plainTextLength(r.supervisor) === 0;
    return false;
  };
  const missingScores = categories.filter((c) => roleScore(respFor(c.id), activeRole) === null || commentMissing(c));
  const setCompletionDate = (v: string) => patchFlow(activeTerm, (f) => ({ ...f, completionDate: v }));
  const setAbsenceDays = (v: string) => patchFlow(activeTerm, (f) => ({ ...f, absenceDays: v }));
  const absenceInvalid = !/^\d+$/.test(cur.absenceDays ?? "");
  const setTransferTalk = (v: boolean) => {
    patchFlow(activeTerm, (f) => ({ ...f, transferTalk: v }));
    setConsent(false);
  };
  const setOutcome = (v: "pass" | "fail") => {
    patchFlow(activeTerm, (f) => ({ ...f, outcome: v }));
    setConsent(false); // consent is given for a specific decision, so changing the decision clears it
  };
  // The final decision only exists in the final assessment.
  const needsOutcome = activeTerm === "endterm";

  // What currently blocks the active role from its next step (submit / sign).
  const submitBlockers = [...(cancellation ? [t("cancel.blocker")] : []), ...missingScores.flatMap((c) => [
    ...(commentMissing(c) ? [`${t(activeRole === "supervisor" ? "cat.commentRequiredSupervisor" : "cat.commentRequired").replace(/\.$/, "")}: ${c.title}`] : []),
    ...(roleScore(respFor(c.id), activeRole) === null ? [`${t("cat.scoreRequired").replace(/\.$/, "")}: ${c.title}`] : []),
  ])];
  const signBlockers: string[] = cancellation ? [t("cancel.blocker")] : [];
  if (activeRole === "teacher") {
    if (!cur.submitted.student) signBlockers.push(t("flow.needStudent"));
    if (!cur.submitted.supervisor) signBlockers.push(t("flow.needSupervisor"));
    if (!cur.completionDate) signBlockers.push(t("flow.needCompletion"));
    if (absenceInvalid) signBlockers.push(t("flow.needAbsence"));
    if (needsOutcome && !cur.outcome) signBlockers.push(t("final.need"));
    if (missingScores.length > 0)
      signBlockers.push(t("flow.missingScores").replace("{n}", String(missingScores.length)).replace("{total}", String(categories.length)));
  } else if (!cur.signed.teacher) {
    signBlockers.push(t("flow.needTeacher"));
  }
  if (!consent) signBlockers.push(t("flow.needConsent"));

  const submitForm = () => {
    if (templateMode || activeRole === "teacher") return;
    if (submitBlockers.length > 0) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setToast(t("flow.toastSubmitted"));
    const r = activeRole;
    patchFlow(activeTerm, (f) => ({
      ...f,
      submitted: { ...f.submitted, [r]: true },
      publishedAt: { ...f.publishedAt, [r]: todayStr },
    }));
  };
  // Teacher can reopen a submitted form for its owner until the teacher has signed.
  const reopenForm = (r: "student" | "supervisor") => {
    if (activeRole !== "teacher" || cur.signed.teacher) return;
    patchFlow(activeTerm, (f) => ({
      ...f,
      submitted: { ...f.submitted, [r]: false },
      publishedAt: { ...f.publishedAt, [r]: "" },
    }));
  };
  const signForm = () => {
    if (templateMode || cur.signed[activeRole]) return;
    if (signBlockers.length > 0) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setToast(t("flow.toastSigned"));
    setConsent(false);
    const r = activeRole;
    const signedAt = new Date().toISOString(); // recorded silently — nobody picks a signing date
    patchFlow(activeTerm, (f) => ({
      ...f,
      signed: { ...f.signed, [r]: true },
      signedAt: { ...f.signedAt, [r]: signedAt },
      publishedAt: r === "teacher" ? { ...f.publishedAt, teacher: todayStr } : f.publishedAt,
    }));
  };

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const rsIcon = (filled: boolean, mandatory: boolean) => {
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
  // Today's date (local) — signature dates cannot be earlier than today.
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  // --- Next step (sign / submit) -----------------------------------------------------------------
  // A blocked button stays focusable: pressing it scrolls to what is missing and shows the reason.
  const triggerAction = (kind: "submit" | "sign", ready: boolean) => {
    if (templateMode) return;
    if (ready) {
      setConfirmAction(kind);
      return;
    }
    setShowValidationErrors(true);
    const teacherSign = kind === "sign" && activeRole === "teacher";
    const target =
      teacherSign && !cur.completionDate
        ? "completionDate"
        : teacherSign && absenceInvalid
          ? "absenceDays"
          : teacherSign && needsOutcome && !cur.outcome
          ? "outcome-pass"
          : kind === "sign" && !consent
            ? "signConsent"
            : null;
    const el = target ? document.getElementById(target) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  };

  // Consent checkbox and (teacher) completion date: part of the form body, shown right above the dock.
  const outcomeText = (v: "pass" | "fail") => t(v === "pass" ? "final.pass" : "final.fail");
  const consentDisabled = templateMode || !!cancellation || (needsOutcome && activeRole === "teacher" && !cur.outcome);
  const consentLabel =
    needsOutcome && cur.outcome ? t("flow.consentWithOutcome").replace("{outcome}", outcomeText(cur.outcome)) : t("flow.consent");
  const consentBlock = (
    <div>
      <label className="flex items-start gap-3 min-h-11 text-sm text-gray-900 cursor-pointer">
        <input
          id="signConsent"
          type="checkbox"
          checked={consent}
          disabled={consentDisabled}
          aria-invalid={showValidationErrors && !consent}
          aria-describedby={showValidationErrors && !consent ? "consent-error" : undefined}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-5 h-5 flex-shrink-0 accent-blue-700"
        />
        <span>{consentLabel}</span>
      </label>
      {showValidationErrors && !consent && !templateMode && (
        <p id="consent-error" className="mt-1 ml-8 flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          {t("flow.consentRequired")}
        </p>
      )}
    </div>
  );
  const completionBlock = (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <label htmlFor="completionDate" className="text-sm font-medium text-gray-900 whitespace-nowrap">
          <E k="flow.completionLabel" /> <span className="font-normal text-gray-600">{t("flow.required")}</span>
        </label>
        <input
          type="date"
          id="completionDate"
          required
          value={cur.completionDate}
          disabled={!!cancellation}
          aria-invalid={showValidationErrors && !cur.completionDate}
          aria-describedby={showValidationErrors && !cur.completionDate ? "completion-error" : undefined}
          onChange={(e) => setCompletionDate(e.target.value)}
          className={`w-full sm:w-44 px-3 py-2 min-h-11 sm:min-h-0 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showValidationErrors && !cur.completionDate ? "border-red-600 border-2" : "border-gray-500"
          }`}
        />
      </div>
      {showValidationErrors && !cur.completionDate && (
        <p id="completion-error" className="mt-1 flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          {t("flow.needCompletion")}
        </p>
      )}
    </div>
  );

  const absenceBlock = (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <label htmlFor="absenceDays" className="text-sm font-medium text-gray-900 whitespace-nowrap">
          <E k="flow.absenceLabel" /> <span className="font-normal text-gray-600">{t("flow.required")}</span>
        </label>
        <input
          type="number"
          id="absenceDays"
          required
          min={0}
          step={1}
          inputMode="numeric"
          value={cur.absenceDays ?? ""}
          disabled={!!cancellation}
          aria-invalid={showValidationErrors && absenceInvalid}
          aria-describedby={showValidationErrors && absenceInvalid ? "absence-error" : undefined}
          onChange={(e) => setAbsenceDays(e.target.value)}
          className={`w-full sm:w-44 px-3 py-2 min-h-11 sm:min-h-0 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showValidationErrors && absenceInvalid ? "border-red-600 border-2" : "border-gray-500"
          }`}
        />
      </div>
      {showValidationErrors && absenceInvalid && (
        <p id="absence-error" className="mt-1 flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          {t("flow.needAbsence")}
        </p>
      )}
    </div>
  );

  // What the active role's next action is (or null when it is not this role's turn / already done).
  type SignStep = { kind: "submit" | "sign"; label: React.ReactNode; ready: boolean; statusText: string; goTo?: string; showButton: boolean };
  const signDescriptor = (): SignStep | null => {
    const signLabel =
      activeRole === "teacher" ? <E k="sign.btnTeacher" /> : activeRole === "student" ? <E k="sign.btnStudent" /> : <E k="sign.btnSupervisor" />;
    // In template mode always show the step so its texts can be edited; the actions themselves are inert.
    if (templateMode) return { kind: "submit", label: <E k="flow.btnSubmit" />, ready: true, statusText: t("flow.readySubmit"), showButton: true };
    if (activeRole !== "teacher" && !cur.submitted[activeRole]) {
      const ready = submitBlockers.length === 0;
      return {
        kind: "submit",
        label: <E k="flow.btnSubmit" />,
        ready,
        statusText: ready
          ? t("flow.readySubmit")
          : t(activeRole !== "teacher" ? "flow.missingStudent" : "flow.missingScores").replace("{n}", String(missingScores.length)).replace("{total}", String(categories.length)),
        goTo: missingScores[0]?.id,
        showButton: true,
      };
    }
    if (!cur.signed[activeRole] && (activeRole === "teacher" || cur.submitted[activeRole])) {
      const ready = signBlockers.length === 0;
      // Student/supervisor waiting for the teacher: status only, no button yet.
      const waitingForTeacher = activeRole !== "teacher" && !cur.signed.teacher;
      return {
        kind: "sign",
        label: signLabel,
        ready,
        statusText: waitingForTeacher
          ? t("flow.waitTeacherSign")
          : ready
            ? t("flow.readySign")
            : `${signBlockers[0]}${signBlockers.length > 1 ? ` (+${signBlockers.length - 1})` : ""}`,
        goTo: activeRole === "teacher" ? missingScores[0]?.id : undefined,
        showButton: !waitingForTeacher,
      };
    }
    return null;
  };

  // Ordered wizard steps for the Forrige / Neste footer navigation.
  const sectionOrder = ["praksisinformasjon", ...categories.map((c) => c.id), "signering"];
  const sectionIndex = sectionOrder.indexOf(activeSection);
  const goToSection = (index: number) => {
    setActiveSection(sectionOrder[index]);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Per-page status (role-aware) → sidebar dot: red = mandatory missing, yellow = optional missing, green = done.
  // Four states, each with its own shape + text (never colour alone). Red is reserved for errors after a failed attempt.
  type DotState = "todo" | "progress" | "done" | "error";
  const DOT: Record<DotState, { Icon: typeof Circle; cls: string; key: string }> = {
    todo: { Icon: Circle, cls: "text-gray-400", key: "dot.todo" },
    progress: { Icon: AlertTriangle, cls: "text-amber-600", key: "dot.progress" },
    done: { Icon: CheckCircle2, cls: "text-green-600", key: "dot.done" },
    error: { Icon: XCircle, cls: "text-red-600", key: "dot.error" },
  };
  const sectionState = (section: string): DotState => {
    if (section === "praksisinformasjon") return "done";
    if (section === "signering") {
      if (currentRoleSigned) return "done";
      const ready = activeRole === "teacher" ? bothSubmitted : cur.submitted[activeRole];
      return ready ? "progress" : "todo";
    }
    const r = respFor(section);
    if (roleScore(r, activeRole) !== null && !commentMissing({ id: section })) return "done";
    if (showValidationErrors) return "error";
    return plainTextLength(r[activeRole]) > 0 ? "progress" : "todo";
  };
  const statusIcon = (section: string) => {
    const d = DOT[sectionState(section)];
    return <d.Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${d.cls}`} aria-hidden="true" />;
  };
  const statusText = (section: string) => t(DOT[sectionState(section)].key);
  const navItemClass = (section: string) => {
    const active = activeSection === section;
    return `w-full flex items-start gap-3 px-3 py-2 min-h-11 md:min-h-0 text-sm rounded-lg ${
      active ? "text-gray-900 bg-gray-100 font-medium" : "text-gray-700 hover:bg-gray-100"
    }`;
  };

  // Navigation items shared by the desktop sidebar and the mobile drawer.
  const navItems = [
    { section: "praksisinformasjon", label: t("nav.vfu"), edit: editText("nav.vfu") },
    ...categories.map((c) => ({ section: c.id, label: c.title, edit: () => editCategoryTitle(c.id) })),
    {
      section: "signering",
      label: t(activeTerm === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut"),
      edit: editText(activeTerm === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut"),
    },];
  const stepIndex = Math.max(0, navItems.findIndex((i) => i.section === activeSection));
  const renderNav = (onPick?: () => void) => (
    <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map(({ section, label, edit }) => (
                <li key={section} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveSection(section);
                      onPick?.();
                    }}
                    aria-current={activeSection === section ? "page" : undefined}
                    className={`${navItemClass(section)} flex-1 min-w-0`}
                  >
                    {statusIcon(section)}
                    <span className="text-left">{label}</span>
                    <span className="sr-only">, {statusText(section)}</span>
                  </button>
                  {templateMode && (
                    <button
                      onClick={edit}
                      title="Rediger tekst"
                      className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <ul aria-label={t("dot.legend")} className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-gray-700">
              {(["todo", "progress", "done", "error"] as DotState[]).map((k) => {
                const d = DOT[k];
                return (
                  <li key={k} className="flex items-center gap-1.5">
                    <d.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${d.cls}`} aria-hidden="true" />
                    {t(d.key)}
                  </li>
                );
              })}
            </ul>

            {activeRole === "teacher" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {!cancellation && <button
                  onClick={() => { if (!templateMode) setShowCancelDialog(true); }}
                  className="w-full px-4 py-2 text-sm font-medium text-red-700 border border-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                >
                  <E k="btn.avbryt" />
                </button>}
                <button
                  disabled={!!cancellation}
                  onClick={() => { if (!templateMode) setInfoPopup("warn"); }}
                  className={`w-full px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 ${
                    cancellation ? "mt-0 text-gray-500 bg-gray-100 border-gray-300 cursor-not-allowed" : "mt-2 text-red-700 border-red-600 hover:bg-red-50"
                  }`}
                >
                  <E k="btn.handlingsplan" />
                </button>
              </div>
            )}
          </nav>
  );

  // The in-page table of contents only appears where it has 3+ anchors (category pages, preview).
  const isQuestionPage = categories.some((c) => c.id === activeSection);
  const activeInfos = pageInfos[activeSection] ?? [];
  const patchPageInfo = (pageId: string, id: number, patch: { title?: string; body?: string }) =>
    setPageInfos((prev) => ({ ...prev, [pageId]: (prev[pageId] ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const addPageInfo = (pageId: string) =>
    setPageInfos((prev) => ({ ...prev, [pageId]: [...(prev[pageId] ?? []), { id: nextInfoId.current++, title: "Ny info", body: "" }] }));
  const removePageInfo = (pageId: string, id: number) =>
    setPageInfos((prev) => ({ ...prev, [pageId]: (prev[pageId] ?? []).filter((p) => p.id !== id) }));
  useEffect(() => setOpenInfo(null), [activeSection, templateMode, readingMode]);
  useEffect(() => {
    if (!openInfo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenInfo(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openInfo]);
  // "Info" for the active question page: collapsed list in the right-hand bar; a click opens the body in an overlay.
  const infoBlock =
    isQuestionPage && !readingMode && (templateMode || activeInfos.length > 0) ? (
      <div className="mb-8 pb-6 border-b border-gray-200">
        {templateMode && <span className="block mb-3 text-sm font-bold text-gray-900 tracking-wide">Info</span>}
        <ul className="space-y-2">
          {activeInfos.map((p) =>
            templateMode ? (
              <li key={p.id} className="border border-dashed border-blue-400 rounded-lg p-2 space-y-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing({ value: p.title, save: (v) => patchPageInfo(activeSection, p.id, { title: v }) })}
                    title="Klikk for å redigere tittelen"
                    className="flex-1 min-w-0 text-left text-sm font-semibold text-gray-900 rounded px-1 outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
                  >
                    {p.title || <span className="text-blue-500 italic">Legg til tittel</span>}
                  </button>
                  <button
                    onClick={() => removePageInfo(activeSection, p.id)}
                    aria-label={`Fjern info ${p.title}`}
                    className="p-1.5 text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div
                  onClick={() => setEditing({ value: p.body, rich: true, save: (v) => patchPageInfo(activeSection, p.id, { body: v }) })}
                  title="Klikk for å redigere teksten"
                  className="cursor-pointer rounded px-2 py-1.5 min-h-[48px] text-sm outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
                >
                  {plainTextLength(p.body) > 0 ? <RichText html={p.body} /> : <span className="text-blue-500 italic">Klikk her for å legge til tekst</span>}
                </div>
              </li>
            ) : (
              <li key={p.id}>
                <button
                  onClick={() => setOpenInfo({ title: p.title, body: p.body })}
                  aria-haspopup="dialog"
                  className="flex items-center gap-2 min-h-11 text-left text-sm font-medium text-blue-700 hover:underline"
                >
                  <Info className="w-5 h-5 flex-shrink-0 text-blue-600" aria-hidden="true" />
                  {p.title}
                </button>
              </li>
            )
          )}
        </ul>
        {templateMode && (
          <button
            onClick={() => addPageInfo(activeSection)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Legg til info
          </button>
        )}
      </div>
    ) : null;
  // Shown at the top of Praksisinformasjon (and in the reading view) once the teacher has cancelled the process.
  const cancellationBanner = cancellation ? (
    <div role="alert" className="mb-6 rounded-lg border-2 border-red-600 bg-red-50 p-4 text-sm text-gray-900">
      <p className="flex items-center gap-2 font-semibold text-red-800">
        <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        {t("cancel.bannerTitle")}
      </p>
      <dl className="mt-3 space-y-2">
        <div>
          <dt className="font-medium">{t("cancel.bannerReason")}</dt>
          <dd className="mt-0.5 whitespace-pre-wrap break-words">{cancellation.reason}</dd>
        </div>
        <div>
          <dt className="inline font-medium">{t("cancel.bannerBy")}: </dt>
          <dd className="inline">{cancellation.by} ({t("cat.roleTeacher")}) – {formatDateTime(cancellation.at)}</dd>
        </div>
      </dl>
    </div>
  ) : null;
  const showToc = readingMode || categories.some((c) => c.id === activeSection);
  // Preview: the halvtid preview only contains halvtid data; the slutt preview contains both halvtid and slutt.
  const previewTerms: Term[] = activeTerm === "midterm" ? ["midterm"] : ["midterm", "endterm"];

  // In-page table of contents (right panel on large screens, "Hopp til" disclosure below lg).
  const tocBody = (
    <>
          {readingMode ? (
            <div className="space-y-2">
              {([
                { id: "rm-praksisinformasjon", label: t("nav.vfu") },
                ...categories.map((c) => ({ id: `rm-${c.id}`, label: c.title })),
                ...previewTerms.map((term) =>
                  term === "midterm"
                    ? { id: "rm-signering-halvtid", label: "Godkjenning – halvtid" }
                    : { id: "rm-signering-slut", label: "Godkjenning – slutt" }
                ),
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
            null
          ) : categories.some((c) => c.id === activeSection) ? (
            <div className="space-y-3">
              {[
                { suffix: "lub", label: t("cat.lubHeading"), icon: null },
                { suffix: "desc", label: t("cat.descHeading"), icon: null },
                { suffix: "assess", label: t("cat.assessHeading"), icon: activeRole === "student" ? "comment" : null },
                { suffix: "score", label: t("cat.scoreHeading"), icon: "score" },
              ].map(({ suffix, label, icon }) => (
                <a key={suffix} href="#" onClick={scrollTo(`${activeSection}-${suffix}`)} className="flex items-start gap-2 group">
                  {icon === "comment" && rsIcon(plainTextLength(respFor(activeSection).student) > 0, true)}
                  {icon === "score" && rsIcon(roleScore(respFor(activeSection), activeRole) !== null, true)}
                  <span className="text-sm text-blue-600 group-hover:underline">{label}</span>
                </a>
              ))}
            </div>
          ) : activeSection === "signering" ? (
            <div className="space-y-3">
              <a href="#" onClick={scrollTo("sign-section")} className="flex items-start gap-2 group">
                {rsIcon(currentRoleSigned, true)}
                <span className="text-sm text-blue-600 group-hover:underline">
                  {t(activeTerm === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut")}
                </span>
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  1 Kommunisere med og møte pasienter
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  2 Kommunisere med og møte pårørende...
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  3 Samarbeide med ulike instanser i helsetjenesten...
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  4 Informere og undervise pasienter...
                </span>
              </a>
              <a href="#" className="flex items-start gap-3 group">
                <span className="text-sm text-blue-600 group-hover:underline">
                  5 Informere og undervise...
                </span>
              </a>
            </div>
          )}
          </div>
          )}
    </>
  );

  // Praksisinformasjon items: automatic from the system except Praksisplass (typed in).
  const placementEditable = !templateMode && !cancellation && activeRole !== "student";
  const autoItem = (labelKey: string, value: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-700 mb-1"><E k={labelKey} /></dt>
      <dd className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 min-h-[2.5rem]">{value}</dd>
    </div>
  );
  const infoItems = (
    <div className="mb-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {autoItem("vfu.studentName", SYSTEM_INFO.studentName)}
        {autoItem("vfu.studentNumber", SYSTEM_INFO.studentNumber)}
        <div>
          <dt className="text-sm font-medium text-gray-700 mb-1">
            <label htmlFor="placement" className="text-sm font-medium text-gray-700"><E k="vfu.placement" /></label>
          </dt>
          <dd>
            <input
              id="placement"
              type="text"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              readOnly={!placementEditable}
              placeholder={placementEditable ? t("vfu.placementPlaceholder") : undefined}
              className={`w-full px-4 py-2 border rounded-lg text-sm min-h-[2.5rem] ${
                placementEditable
                  ? "border-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "border-gray-300 bg-gray-50 text-gray-900 cursor-default"
              }`}
            />
          </dd>
        </div>
        {autoItem("vfu.period", SYSTEM_INFO.period)}
        {autoItem("vfu.dates", `${formatDate(SYSTEM_INFO.startDate)} – ${formatDate(SYSTEM_INFO.endDate)}`)}
      </dl>
      <p className="mt-3 text-xs text-gray-600"><E k="vfu.autoHint" /></p>
    </div>
  );

  // Final assessment: the teacher decides pass / fail; everyone can see the decision once the teacher has signed.
  // Teacher (editable): two neutral option cards, icon + text on the chosen one (colour is never the only cue).
  // Everyone else / locked: plain definition text, never chips or disabled radios. Waiting: a neutral placeholder.
  const OutcomeIcon = ({ v }: { v: "pass" | "fail" }) =>
    v === "pass" ? (
      <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0" aria-hidden="true" />
    ) : (
      <XCircle className="w-5 h-5 text-red-700 flex-shrink-0" aria-hidden="true" />
    );
  const outcomeField = () => {
    const isTeacher = activeRole === "teacher";
    const editable = isTeacher && !cur.signed.teacher && !templateMode && !cancellation;
    if (editable || templateMode) {
      return (
        <div className="space-y-5">
        <label className={`flex items-start gap-3 min-h-11 text-sm font-medium text-gray-900 ${templateMode ? "cursor-default" : "cursor-pointer"}`}>
          <input
            id="transferTalk"
            type="checkbox"
            checked={!!cur.transferTalk}
            disabled={templateMode}
            onChange={(e) => setTransferTalk(e.target.checked)}
            className="mt-0.5 w-5 h-5 flex-shrink-0 accent-blue-700"
          />
          <span><E k="final.transferTalk" /></span>
        </label>
        <fieldset aria-describedby={showValidationErrors && isTeacher && !cur.outcome ? "outcome-error" : undefined}>
          <legend className="text-sm font-medium text-gray-900 mb-2">
            <E k="final.heading" /> <span className="font-normal text-gray-600">{t("flow.required")}</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            {(["pass", "fail"] as const).map((v) => {
              const chosen = cur.outcome === v;
              return (
                <label
                  key={v}
                  className={`flex items-center gap-3 min-h-11 px-4 py-2.5 border-2 rounded-lg text-sm font-semibold ${
                    templateMode ? "cursor-default" : "cursor-pointer"
                  } ${
                    chosen
                      ? v === "pass"
                        ? "border-green-700 bg-green-50 text-green-900"
                        : "border-red-700 bg-red-50 text-red-900"
                      : "border-gray-400 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    id={`outcome-${v}`}
                    checked={chosen}
                    disabled={templateMode}
                    onChange={() => setOutcome(v)}
                    className="w-5 h-5 accent-gray-900"
                  />
                  <span className="flex-1"><E k={v === "pass" ? "final.pass" : "final.fail"} /></span>
                  {chosen && <OutcomeIcon v={v} />}
                </label>
              );
            })}
          </div>
          {showValidationErrors && isTeacher && !cur.outcome && !templateMode && (
            <p id="outcome-error" className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              {t("final.need")}
            </p>
          )}
          {/* one polite announcement when the decision is chosen */}
          <span aria-live="polite" className="sr-only">
            {cur.outcome ? t("final.chosen").replace("{outcome}", outcomeText(cur.outcome)) : ""}
          </span>
        </fieldset>
        </div>
      );
    }
    const visible = isTeacher || cur.signed.teacher;
    if (visible && cur.outcome) {
      return (
        <dl className="text-sm text-gray-900 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="font-medium"><E k="final.transferTalk" /></dt>
            <dd className="font-semibold">{t(cur.transferTalk ? "final.yes" : "final.no")}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="font-medium"><E k="final.label" />:</dt>
            <dd className="flex items-center gap-1.5 font-semibold"><OutcomeIcon v={cur.outcome} />{outcomeText(cur.outcome)}</dd>
          </div>
          {cur.completionDate && (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="font-medium"><E k="flow.completionLabel" />:</dt>
              <dd><time dateTime={cur.completionDate}>{formatDate(cur.completionDate)}</time></dd>
            </div>
          )}
        </dl>
      );
    }
    return (
      <div role="status" className="px-4 py-3 border border-dashed border-gray-400 rounded-lg text-sm text-gray-700 bg-white">
        <span className="font-medium">{t("cat.awaiting")} {t("cat.roleTeacher")}.</span> {t("final.waiting")}
      </div>
    );
  };

  // Slim "next step" hint shown on every page except Signering (which has the full action bar).
  const slimNext = (): { text: string; link?: string; goTo?: string; kind: "fill" | "go" | "wait" } | null => {
    if (templateMode || readingMode || cur.signed[activeRole]) return null;
    const fill = { text: t(activeRole !== "teacher" ? "flow.nextFillStudent" : "flow.nextFill").replace("{n}", String(missingScores.length)), link: t("flow.goToFirst"), goTo: missingScores[0]?.id, kind: "fill" as const };
    const sign = { text: t("flow.nextSign"), link: t("flow.goToSigning"), goTo: "signering", kind: "go" as const };
    if (activeRole !== "teacher") {
      if (!cur.submitted[activeRole]) return missingScores.length ? fill : { text: t("flow.nextSubmit"), link: t("flow.goToSigning"), goTo: "signering", kind: "go" as const };
      return cur.signed.teacher ? sign : { text: t("flow.nextWaiting").replace("{who}", t("cat.roleTeacher")), kind: "wait" as const };
    }
    if (!bothSubmitted) {
      const who = [!cur.submitted.student && t("cat.roleStudent"), !cur.submitted.supervisor && t("cat.roleSupervisor")].filter(Boolean).join(" og ");
      return { text: t("flow.nextWaiting").replace("{who}", who), kind: "wait" as const };
    }
    return missingScores.length ? fill : sign;
  };

  // One polite live region: announces the missing count only when it changes.
  const [announce, setAnnounce] = useState("");
  const prevMissing = useRef<number | null>(null);
  useEffect(() => {
    if (prevMissing.current !== null && prevMissing.current !== missingScores.length) {
      setAnnounce(
        missingScores.length === 0
          ? t("flow.allCategoriesDone")
          : t(activeRole !== "teacher" ? "flow.missingStudent" : "flow.missingScores").replace("{n}", String(missingScores.length)).replace("{total}", String(categories.length))
      );
    }
    prevMissing.current = missingScores.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingScores.length]);

  return (
    <div className="size-full flex flex-col bg-gray-50">
      <div aria-live="polite" role="status" className="sr-only">{announce}</div>
      {/* Endterm-created demo popup */}
      {showEndtermPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Forklaring til demoen</h2>
            <p className="text-sm text-gray-700 mb-6">
              Halvtidsvurderingen er fullført og sluttvurderingen er opprettet. Når du lukker denne dialogen, går du videre til sluttvurderingen.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowEndtermPopup(false);
                  setActiveSection("praksisinformasjon");
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
      {/* "Avbryt vurderingsprosess": the teacher must give a reason, which is then shown on Praksisinformasjon. */}
      {showCancelDialog && (
        <ConfirmDialog
          destructive
          title={t("cancel.title")}
          body={
            <>
              <p>{t("cancel.body")}</p>
              <label htmlFor="cancel-reason" className="block pt-2 font-medium text-gray-900">
                {t("cancel.reasonLabel")} <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (e.target.value.trim()) setCancelReasonError(false);
                }}
                rows={4}
                maxLength={1000}
                required
                aria-invalid={cancelReasonError}
                aria-describedby={cancelReasonError ? "cancel-reason-error" : "cancel-reason-hint"}
                className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                  cancelReasonError ? "border-red-600 border-2" : "border-gray-500"
                }`}
              />
              {cancelReasonError ? (
                <p id="cancel-reason-error" role="alert" className="text-sm text-red-700">{t("cancel.reasonRequired")}</p>
              ) : (
                <p id="cancel-reason-hint" className="text-xs text-gray-600">{t("cancel.reasonHint")}</p>
              )}
            </>
          }
          confirmLabel={t("cancel.confirm")}
          cancelLabel={t("cancel.back")}
          onConfirm={confirmCancellation}
          onCancel={closeCancelDialog}
        />
      )}

      {/* "Gi varsel": information only — the real function is outside this prototype. */}
      {infoPopup && (
        <ConfirmDialog
          title={t("warn.title")}
          body={
            <>
              <p>{t("warn.body")}</p>
              <p>{t("warn.proto")}</p>
            </>
          }
          confirmLabel={t("warn.close")}
          cancelLabel=""
          onConfirm={() => setInfoPopup(null)}
          onCancel={() => setInfoPopup(null)}
        />
      )}

      {/* Confirmation for the irreversible actions (the consent checkbox lives in the form, not here). */}
      {confirmAction && (
        <ConfirmDialog
          title={t(confirmAction === "submit" ? "flow.confirmSubmitTitle" : "flow.confirmSignTitle")}
          body={
            confirmAction === "submit" ? (
              <p>{t("flow.confirmSubmitBody")}</p>
            ) : (
              <>
                <p>{t("flow.confirmSignBody").replace("{name}", me.name)}</p>
                {activeRole === "teacher" && cur.completionDate && (
                  <p>
                    <span className="font-medium">{t("flow.completionLabel")}:</span>{" "}
                    <time dateTime={cur.completionDate}>{formatDate(cur.completionDate)}</time>
                  </p>
                )}
              </>
            )
          }
          confirmLabel={
            confirmAction === "submit"
              ? t("flow.btnSubmit")
              : t(activeRole === "teacher" ? "sign.btnTeacher" : activeRole === "student" ? "sign.btnStudent" : "sign.btnSupervisor")
          }
          cancelLabel={t("flow.confirmCancel")}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            const k = confirmAction;
            setConfirmAction(null);
            if (k === "submit") submitForm();
            else signForm();
          }}
        />
      )}
      {toast && (
        <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 text-green-400" aria-hidden="true" />
          {toast}
        </div>
      )}
      {/* Teacher tried to grade before student and supervisor have submitted */}
      {showGradeBlocked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onKeyDown={(e) => e.key === "Escape" && setShowGradeBlocked(false)}
        >
          <div role="alertdialog" aria-modal="true" aria-labelledby="gb-title" aria-describedby="gb-body" className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 id="gb-title" className="text-lg font-semibold text-gray-900 mb-3">{t("flow.popupTitle")}</h2>
            <p id="gb-body" className="text-sm text-gray-700 mb-3">{t("flow.popupBody")}</p>
            <ul className="mb-6 space-y-1.5">
              {(["student", "supervisor"] as const).filter((r) => !cur.submitted[r]).map((r) => (
                <li key={r} className={`inline-flex items-center gap-1.5 mr-2 px-3 py-1 rounded-full border text-sm font-medium ${ROLE_STYLE[r].chip}`}>
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {t("cat.awaiting")} {t(ROLE_STYLE[r].roleKey)}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button
                autoFocus
                onClick={() => setShowGradeBlocked(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("flow.popupOk")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Template text edit popup */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Rediger tekst</h2>
            {editing.rich ? (
              <RichTextEditor value={editing.value} onChange={(v) => setEditing((prev) => (prev ? { ...prev, value: v } : prev))} />
            ) : (
              <textarea
                autoFocus
                rows={4}
                value={editing.value}
                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            )}
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
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
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

        <div className="flex flex-wrap items-center gap-2 min-w-0">
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
            Mal
          </button>
          <div className="hidden sm:block w-px h-6 bg-gray-300" />
          {(["supervisor", "student", "teacher"] as const).map((role) => (
            <button
              key={role}
              onClick={() => { setActiveRole(role); setTemplateMode(false); setActiveSection("praksisinformasjon"); setShowValidationErrors(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                !templateMode && activeRole === role
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {role === "supervisor" ? "Veileder" : role === "teacher" ? "Lærer" : "Student"}
            </button>
          ))}
          {!templateMode && peopleOfRole(activeRole).length > 1 && (
            <select
              aria-label="Aktiv bruker"
              value={actingAs[activeRole]}
              onChange={(e) => setActingAs((prev) => ({ ...prev, [activeRole]: e.target.value }))}
              className="md:ml-2 px-3 py-2 border border-gray-400 rounded-lg text-sm text-gray-800 bg-white max-w-full"
            >
              {peopleOfRole(activeRole).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Template mode helper bar */}
      {templateMode && (
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-2 text-sm text-purple-800">
          Malmodus: klikk på en markert tekst for å redigere den. Bruk ⋮ i venstremenyen og ved fanene for å redigere
          navigasjonstekstene. Læringsutbytter (nummer og tekst) legges til, redigeres og fjernes på hver hovedkategori-side.
        </div>
      )}

      {/* Page Title with Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="py-3 md:py-4 flex flex-wrap items-center gap-y-2">
          <div className="md:w-60 px-4 md:px-6 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4 text-gray-700" />
            {/* Small screens: only the arrow; the label stays available to screen readers */}
            <span className="text-sm font-medium text-gray-700 sr-only md:not-sr-only">
              <E k="topbar.bedomning" />
            </span>
          </div>
          <div className="flex-1 min-w-0 px-4 md:px-8 flex flex-wrap gap-x-4 gap-y-2 items-center">
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
                    title="Rediger tekst"
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
                      title="Rediger tekst"
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
              className={`ml-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 min-w-11 min-h-11 md:min-w-0 md:min-h-0 text-sm rounded-lg border transition-colors ${
                readingMode
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              {/* Small screens: icon only; the label stays available to screen readers */}
              <span className="sr-only md:not-sr-only"><E k="btn.preview" /></span>
            </button>
          </div>
        </div>
        <div className="hidden md:flex">
          <div className="w-60"></div>
        </div>
      </div>

      {/* Small screens: one tappable step header instead of the left sidebar; it opens the navigation drawer */}
      {!readingMode && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-1">
          <button
            ref={navTriggerRef}
            type="button"
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
            onClick={() => setNavOpen(true)}
            className="w-full min-h-11 flex items-center gap-3 text-left"
          >
            {statusIcon(activeSection)}
            <span className="flex-1 min-w-0 text-sm">
              <span className="block text-xs text-gray-600">
                {t("nav.step").replace("{n}", String(stepIndex + 1)).replace("{total}", String(navItems.length))}
              </span>
              <span className="block truncate font-medium text-gray-900">{navItems[stepIndex]?.label}<span className="sr-only">, {statusText(activeSection)}</span></span>
            </span>
            <Menu className="w-5 h-5 text-gray-700 flex-shrink-0" aria-hidden="true" />
            <span className="sr-only">{t("nav.menu")}</span>
          </button>
        </div>
      )}
      <MobileDrawer open={navOpen} onClose={() => setNavOpen(false)} title={t("nav.menu")} closeLabel={t("nav.close")} id="mobile-nav" returnFocusTo={navTriggerRef}>
        {renderNav(() => {
          setNavOpen(false);
          mainScrollRef.current?.scrollTo({ top: 0 });
        })}
      </MobileDrawer>

      {/* Main Layout: Left Sidebar + Main Content + Right Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`hidden md:flex w-60 bg-white border-r border-gray-200 flex-col overflow-auto${readingMode ? " md:hidden" : ""}`}>
          {renderNav()}
        </aside>

        {/* Main Content */}
        <main ref={mainScrollRef} className="flex-1 min-w-0 overflow-auto bg-gray-50 relative scroll-pb-48 flex flex-col">
          <div className="flex-1 px-4 py-5 md:px-8 md:py-8">
            {/* Below lg the right-hand table of contents is a collapsed "Hopp til" disclosure */}
            {showToc && (readingMode || infoBlock) && (
            <details className="lg:hidden mb-4 bg-white border border-gray-200 rounded-lg max-w-5xl mx-auto">
              <summary className="min-h-11 flex items-center px-4 text-sm font-semibold text-gray-900 cursor-pointer">{t("toc.jump")}</summary>
              <div className="px-4 pb-4">{infoBlock}{readingMode && tocBody}</div>
            </details>
            )}
            {!readingMode && !templateMode && activeSection !== "signering" && (() => {
              const total = categories.length;
              const doneCount = total - missingScores.length;
              const pct = Math.round((doneCount / total) * 100);
              const color = pct === 100 ? "bg-green-600" : "bg-blue-600";
              const summary = t("flow.progressDone").replace("{done}", String(doneCount)).replace("{total}", String(total));
              return (
                <div className="mb-6 max-w-5xl mx-auto">
                  <div
                    role="progressbar"
                    aria-label={t("flow.progressLabel")}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={doneCount}
                    aria-valuetext={summary}
                    className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{summary}</p>
                </div>
              );
            })()}
            {!templateMode && !cancellation && (() => {
              const missing: string[] = [];
              if (!cur.submitted.student) missing.push(t("cat.roleStudent"));
              if (!cur.submitted.supervisor) missing.push(t("cat.roleSupervisor"));
              const unsigned = (["student", "supervisor"] as const).filter((r) => !cur.signed[r]).map((r) => t(r === "student" ? "cat.roleStudent" : "cat.roleSupervisor"));
              let tone: "yellow" | "blue" | "green" = "blue";
              let text = "";
              if (activeRole === "teacher") {
                if (!bothSubmitted) { tone = "yellow"; text = `${t("flow.bannerTeacherWait")} ${missing.join(", ")}`; }
                else if (!cur.signed.teacher) { tone = "blue"; text = t("flow.bannerTeacherReview"); }
                else if (unsigned.length) { tone = "yellow"; text = `${t("flow.bannerTeacherSigned")} ${unsigned.join(", ")}`; }
                else { tone = "green"; text = t("flow.bannerAllSigned"); }
              } else if (!cur.submitted[activeRole]) {
                tone = "blue"; text = t("flow.bannerFill");
              } else if (!cur.signed.teacher) {
                tone = "yellow"; text = t("flow.bannerSubmitted");
              } else if (!cur.signed[activeRole]) {
                tone = "blue"; text = t("flow.bannerPleaseSign");
              } else if (unsigned.length) {
                tone = "yellow"; text = `${t("flow.bannerTeacherSigned")} ${unsigned.join(", ")}`;
              } else {
                tone = "green"; text = t("flow.bannerAllSigned");
              }
              const toneClass =
                tone === "yellow" ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                : tone === "green" ? "bg-green-50 border-green-300 text-green-800"
                : "bg-blue-50 border-blue-300 text-blue-800";
              return (
                <div role="status" className={`mb-6 p-4 border rounded-lg flex items-start gap-3 max-w-5xl mx-auto ${toneClass}`}>
                  <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm"><span className="font-semibold">{t(activeTerm === "midterm" ? "tab.halvtid" : "tab.slut")}:</span> {text}</p>
                </div>
              );
            })()}
            {readingMode ? (
              /* Reading Mode - Combined View */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Vurderingsskjema for praksisstudier</h1>
                  <p className="text-sm text-gray-600">Lovisenberg diakonale høgskole</p>
                </div>

                {/* Praksisinformasjon Section */}
                <div id="rm-praksisinformasjon" className="mb-8 text-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">{t("nav.vfu")}</h2>
                  {cancellationBanner}
                  <dl className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      ["vfu.studentName", SYSTEM_INFO.studentName],
                      ["vfu.studentNumber", SYSTEM_INFO.studentNumber],
                      ["vfu.placement", placement || "—"],
                      ["vfu.period", SYSTEM_INFO.period],
                      ["vfu.dates", `${formatDate(SYSTEM_INFO.startDate)} – ${formatDate(SYSTEM_INFO.endDate)}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-medium inline">{t(k)}: </dt>
                        <dd className="inline">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {infoParts.map((p) => (
                    <div key={p.id} className="mt-3">
                      <p className="font-semibold">{p.title}</p>
                      <RichText html={p.body} />
                    </div>
                  ))}
                </div>

                {/* Category sections — LUB, description, assessments and score per term */}
                {categories.map((c) => (
                  <div key={c.id} id={`rm-${c.id}`} className="mb-8 text-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">{c.title}</h2>
                    <ul className="mb-3 space-y-1">
                      {c.lubs.map((l) => (
                        <li key={l.id}><span className="font-semibold text-blue-700 mr-2">{l.number}</span>{l.text}</li>
                      ))}
                    </ul>
                    <div className="mb-3 text-gray-700"><RichText html={c.description} /></div>
                    {previewTerms.map((term) => {
                      if (term === "endterm" && !endtermCreated) return null;
                      const r = responses[term][c.id] ?? emptyResponse;
                      const roles: { role: Role; fieldKey: "student" | "supervisor" | "teacher"; labelKey: string }[] = [
                        { role: "student", fieldKey: "student", labelKey: "cat.fieldStudent" },
                        { role: "supervisor", fieldKey: "supervisor", labelKey: "cat.fieldSupervisor" },
                        { role: "teacher", fieldKey: "teacher", labelKey: "cat.fieldTeacher" },
                      ];
                      return (
                        <div key={term} className="mb-3 p-3 border border-gray-200 rounded-lg space-y-2">
                          <p className="font-semibold">{t(term === "midterm" ? "tab.halvtid" : "tab.slut")}</p>
                          {roles.map(({ role: rr, fieldKey, labelKey }) => {
                            const vis = canSee(rr, term);
                            return (
                              <div key={rr}>
                                <p>
                                  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${ROLE_STYLE[rr].dot}`} aria-hidden="true" />
                                  <span className="font-medium">{t(labelKey)}:</span> {vis ? r[fieldKey] || "—" : `${t("cat.awaiting")} ${t(ROLE_STYLE[rr].roleKey)}`}
                                </p>
                                {r.scores[rr] && vis && (
                                  <p className="pl-4">
                                    <span className="font-medium">{(personById(r.scores[rr]!.by) ?? PEOPLE[rr]).name}</span> ({t(ROLE_STYLE[rr].badgeKey)}) – {t(`lik.${r.scores[rr]!.level + 1}.label`)} - {formatShortDate(r.scores[rr]!.at)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Signering sections */}
                {previewTerms.map((term) => {
                  if (term === "endterm" && !endtermCreated) return null;
                  const f = flow[term];
                  const steps: { role: Role; text: string; done: boolean; date: string }[] = [
                    { role: "student", text: t("flow.stepSubmit"), done: f.submitted.student, date: "" },
                    { role: "supervisor", text: t("flow.stepSubmit"), done: f.submitted.supervisor, date: "" },
                    { role: "teacher", text: t("flow.stepSign"), done: f.signed.teacher, date: f.signedAt.teacher ? formatDateTime(f.signedAt.teacher) : "" },
                    { role: "student", text: t("flow.stepSign"), done: f.signed.student, date: f.signedAt.student ? formatDateTime(f.signedAt.student) : "" },
                    { role: "supervisor", text: t("flow.stepSign"), done: f.signed.supervisor, date: f.signedAt.supervisor ? formatDateTime(f.signedAt.supervisor) : "" },
                  ];
                  return (
                    <div key={term} id={term === "midterm" ? "rm-signering-halvtid" : "rm-signering-slut"} className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                        {t(term === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut")}
                      </h2>
                      {term === "endterm" && (
                        <p className="mb-1 text-sm">
                          <span className="font-semibold">{t("final.transferTalk")}</span>{" "}
                          {activeRole === "teacher" || f.signed.teacher ? t(f.transferTalk ? "final.yes" : "final.no") : "—"}
                        </p>
                      )}
                      {term === "endterm" && (
                        <p className="mb-3 text-sm">
                          <span className="font-semibold">{t("final.heading")}</span>{" "}
                          {(activeRole === "teacher" || f.signed.teacher) && f.outcome ? t(f.outcome === "pass" ? "final.pass" : "final.fail") : "—"}
                        </p>
                      )}
                      <div className="mb-3 text-sm">
                        <span className="font-semibold">{t(`final.commentsHeading.${term}`)}</span>{" "}
                        {(activeRole === "teacher" || f.signed.teacher) && plainTextLength(f.finalComment ?? "") > 0 ? (
                          <RichText html={f.finalComment} className="inline-block align-top" />
                        ) : (
                          "—"
                        )}
                      </div>
                      <ul className="space-y-2 text-sm">
                        {steps.map((st, i) => (
                          <li key={i}>
                            <span className="font-semibold">{PEOPLE[st.role].name}</span> ({t(ROLE_STYLE[st.role].roleKey)}) – {st.text}:{" "}
                            {st.done ? `${t("flow.stepDone")}${st.date ? ` ${st.date}` : ""}` : t("flow.stepPending")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="max-w-5xl mx-auto">
              {activeSection === "praksisinformasjon" ? (
              /* Praksisinformasjon Form */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300"><E k="nav.vfu" /></h1>

                {cancellationBanner}

                {infoItems}

                {/* Info parts: added in template mode, collapsed by default, visible to every role */}
                {(
                  <div className="space-y-3">
                    {/* Built-in first info part: the user guide. Fixed content, not editable or removable. */}
                    <details className="group border border-gray-300 rounded-lg bg-white">
                      <summary className="flex items-center justify-between gap-2 px-4 py-3 min-h-11 cursor-pointer font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden">
                        Brukerveiledning
                        <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-700 leading-relaxed">
                        <RichText html={USER_GUIDE_HTML.replace(/^<h2>.*?<\/h2>\n?/, "")} />
                      </div>
                    </details>
                    {infoParts.map((p) =>
                      templateMode ? (
                        <div key={p.id} className="border border-dashed border-blue-400 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditing({ value: p.title, save: (v) => patchInfoPart(p.id, { title: v }) })}
                              title="Klikk for å redigere tittelen"
                              className="flex-1 text-left font-semibold text-gray-900 rounded px-1 outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
                            >
                              {p.title || <span className="text-blue-500 italic">Klikk her for å legge til tittel</span>}
                            </button>
                            <button
                              onClick={() => removeInfoPart(p.id)}
                              aria-label={`Fjern infodel ${p.title}`}
                              className="p-2 text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div
                            onClick={() => setEditing({ value: p.body, rich: true, save: (v) => patchInfoPart(p.id, { body: v }) })}
                            title="Klikk for å redigere teksten"
                            className="cursor-pointer rounded px-2 py-2 min-h-[64px] outline-dashed outline-1 outline-blue-400 hover:bg-blue-100"
                          >
                            {plainTextLength(p.body) > 0 ? (
                              <RichText html={p.body} />
                            ) : (
                              <span className="text-blue-500 italic">Klikk her for å legge til tekst</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <details key={p.id} className="group border border-gray-300 rounded-lg bg-white">
                          <summary className="flex items-center justify-between gap-2 px-4 py-3 min-h-11 cursor-pointer font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden">
                            {p.title}
                            <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                          </summary>
                          <div className="px-4 pb-4 text-sm text-gray-900">
                            <RichText html={p.body} />
                          </div>
                        </details>
                      )
                    )}
                    {templateMode && (
                      <button
                        onClick={addInfoPart}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" /> Legg til infodel
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : categories.some((c) => c.id === activeSection) ? (
              (() => {
                const idx = categories.findIndex((c) => c.id === activeSection);
                const cat = categories[idx];
                return (
                  <CategoryPage
                    key={`${cat.id}-${activeTerm}`}
                    category={cat}
                    index={idx}
                    role={activeRole as Role}
                    me={me}
                    templateMode={templateMode}
                    done={doneNow}
                    locked={!!cancellation}
                    response={respFor(cat.id)}
                    publishedAt={cur.publishedAt}
                    midterm={
                      activeTerm === "endterm"
                        ? { response: respFor(cat.id, "midterm"), publishedAt: flow.midterm.publishedAt }
                        : undefined
                    }
                    levels={likertLevels}
                    showErrors={showValidationErrors}
                    gradingBlocked={activeRole === "teacher" && !bothSubmitted}
                    onGradingBlocked={() => setShowGradeBlocked(true)}
                    t={t}
                    E={(k) => <E k={k} />}
                    onSaveText={(key, html) => saveText(cat.id, key, html)}
                    onSetScore={(level) => setMyScore(cat.id, level)}
                    onEditLub={(lubId) => editLub(cat.id, lubId)}
                    onEditLubNumber={(lubId) => editLubNumber(cat.id, lubId)}
                    onAddLub={() => addLub(cat.id)}
                    onRemoveLub={(lubId) => removeLub(cat.id, lubId)}
                    onChangeDescription={(html) => updateCategory(cat.id, { description: html })}
                  />
                );
              })()
            ) : activeSection === "signering" ? (
              /* Signering Page: summary of all scores + workflow status */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  <E k={activeTerm === "midterm" ? "nav.signering.halvtid" : "nav.signering.slut"} />
                </h1>
                <p className="text-sm text-gray-600 mb-6"><E k="flow.panelHint" /></p>

                {/* Absence days: entered by the teacher before signing, shown to everyone after the teacher has signed */}
                <div className="mb-8">
                  {!templateMode && activeRole === "teacher" && !cur.signed.teacher ? (
                    absenceBlock
                  ) : !templateMode && !cur.signed.teacher ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900 mb-1.5"><E k="flow.absenceLabel" /></p>
                      <span role="status" className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${ROLE_STYLE.teacher.chip}`}>
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        {t("cat.awaiting")} {t("cat.roleTeacher")}
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold"><E k="flow.absenceLabel" />:</span> {templateMode ? "" : cur.absenceDays}
                    </p>
                  )}
                </div>

                {/* The teacher's last comments — both terms; editable until the teacher signs, then shown to everyone */}
                <div className="mb-8">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5">
                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${ROLE_STYLE.teacher.dot}`} />
                    <E k={`final.commentsHeading.${activeTerm}`} />
                  </p>
                  {!templateMode && activeRole !== "teacher" && !cur.signed.teacher ? (
                    <span role="status" className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${ROLE_STYLE.teacher.chip}`}>
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {t("cat.awaiting")} {t("cat.roleTeacher")}
                    </span>
                  ) : (
                    <RoleCommentField
                      id="finalComment"
                      label={t(`final.commentsHeading.${activeTerm}`)}
                      value={cur.finalComment ?? ""}
                      editable={!templateMode && !cancellation && activeRole === "teacher" && !cur.signed.teacher}
                      published={!templateMode && cur.signed.teacher}
                      person={PEOPLE.teacher}
                      badge={t("cat.badgeTeacher")}
                      badgeClass={ROLE_STYLE.teacher.badgeText}
                      publishedAt={cur.publishedAt.teacher}
                      placeholder={t("cat.placeholder")}
                      emptyText={t("cat.noComment")}
                      saveLabel={t("cat.save")}
                      cancelLabel={t("cat.cancel")}
                      unsavedLabel={t("cat.unsaved")}
                      onSave={(html) => patchFlow(activeTerm, (f) => ({ ...f, finalComment: html }))}
                    />
                  )}
                </div>

                {/* Workflow status */}
                <div id="sign-section">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4"><E k="flow.panelTitle" /></h2>
                  <ul className="space-y-3">
                    {(["student", "supervisor", "teacher"] as Role[]).map((r) => {
                      const hasSubmit = r !== "teacher";
                      const submitted = hasSubmit ? cur.submitted[r as "student" | "supervisor"] : false;
                      const signed = cur.signed[r];
                      const canReopen = hasSubmit && submitted && activeRole === "teacher" && !cur.signed.teacher && !templateMode;
                      const chip = (done: boolean, doneText: string, pendingText: string) => (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${done ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                          {done ? doneText : pendingText}
                        </span>
                      );
                      return (
                        <li key={r} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 border border-gray-200 rounded-lg">
                          <div className={`w-10 h-10 ${PEOPLE[r].avatar} rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`} aria-hidden="true">
                            {PEOPLE[r].initials}
                          </div>
                          <div className="flex-1 min-w-[10rem]">
                            <p className="text-sm font-semibold text-gray-900">{PEOPLE[r].name}</p>
                            <p className={`text-xs font-medium ${ROLE_STYLE[r].badgeText}`}>{t(ROLE_STYLE[r].badgeKey)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {hasSubmit && chip(submitted, t("flow.stepSubmitted"), t("flow.stepNotSubmitted"))}
                            {chip(signed, `${t("flow.stepDone")}${cur.signedAt[r] ? ` · ${formatDateTime(cur.signedAt[r])}` : ""}`, t("flow.stepPending"))}
                            {r === "teacher" && cur.completionDate && chip(true, `${t("flow.completionLabel")}: ${formatDate(cur.completionDate)}`, "")}
                          </div>
                          {canReopen && (
                            <button
                              onClick={() => reopenForm(r as "student" | "supervisor")}
                              className="px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                            >
                              <E k="flow.reopen" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {!templateMode && cur.signed.teacher && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                      <Lock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <E k="flow.reopenDisabled" />
                    </p>
                  )}
                </div>

                {(() => {
                  const d = signDescriptor();
                  const showSignFields = !!d && d.kind === "sign" && d.showButton;
                  // In the final assessment the block is always shown, because it holds the pass / fail decision everyone can see.
                  if (!showSignFields && activeTerm !== "endterm") return null;
                  const teacherDateEditable = showSignFields && activeRole === "teacher";
                  // Halvtid / non-teacher views show the completion date as plain text once the teacher has signed.
                  const dateReadOnly = !!cur.completionDate && cur.signed.teacher && activeTerm !== "endterm";
                  return (
                    <div className="mt-6 border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                      <div className="p-4 md:p-5 space-y-5">
                        <h3 className="text-base font-semibold text-gray-900"><E k="flow.confirmHeading" /></h3>
                        {activeTerm === "endterm" && outcomeField()}
                        {teacherDateEditable && completionBlock}
                        {dateReadOnly && (
                          <p className="text-sm text-gray-900">
                            <span className="font-medium"><E k="flow.completionLabel" />:</span>{" "}
                            <time dateTime={cur.completionDate}>{formatDate(cur.completionDate)}</time>
                          </p>
                        )}
                      </div>
                      {(showSignFields || currentRoleSigned) && (
                        <div className="border-t border-gray-300 bg-white p-4 md:p-5">
                          {showSignFields ? (
                            consentBlock
                          ) : (
                            <div className="text-sm text-gray-900 space-y-1">
                              <p className="flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0" aria-hidden="true" />
                                {t("flow.confirmed")}
                              </p>
                              {cur.signedAt[activeRole] && (
                                <p className="text-gray-700">
                                  {t("flow.signedBy").replace("{name}", me.name).replace("{date}", formatDateTime(cur.signedAt[activeRole]))}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {showValidationErrors && !templateMode && !currentRoleSigned && (() => {
                  const needSubmit = activeRole !== "teacher" && !cur.submitted[activeRole];
                  const items = needSubmit ? submitBlockers : signBlockers;
                  if (items.length === 0) return null;
                  return (
                    <div role="alert" className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                      <p className="text-sm font-semibold text-red-800 mb-2"><E k="val.heading" /></p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {items.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  );
                })()}

              </div>
            ) : (
              /* Assessment Card */
              <>
                <div className="mb-6">
                  </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 italic max-w-xl">
                      Studenten har fulgt grunnleggende hygienerutiner
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
          {/* Docked action bar: ONE flat band aligned to the content column.
              Desktop: [Forrige] [status] [primary action]. Phone: status on top, then [Forrige] [primary].
              Primary = the sign/submit action on Signering, otherwise "Neste". */}
          {!readingMode && (() => {
            const onSign = activeSection === "signering";
            const d = onSign ? signDescriptor() : null;
            const slim = onSign ? null : slimNext();
            const isLastBeforeSign = sectionIndex === sectionOrder.length - 2;
            let icon: React.ReactNode = null;
            let text = "";
            let link: { label: string; to: string } | null = null;
            if (onSign) {
              if (d) {
                icon = d.showButton ? (
                  d.ready ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" /> : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                );
                text = d.statusText;
                if (d.goTo && !d.ready && d.showButton && !templateMode) link = { label: t("flow.goToFirst"), to: d.goTo };
              } else if (cur.signed[activeRole]) {
                icon = <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />;
                text = t("flow.toastSigned");
              }
            } else if (slim) {
              icon =
                slim.kind === "fill" ? <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
                : slim.kind === "go" ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                : <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />;
              text = `${t("flow.nextStep")} ${slim.text}`;
              if (slim.goTo) link = { label: slim.link ?? "", to: slim.goTo };
            }
            return (
              <div className="sticky bottom-0 z-20 shrink-0 bg-white/95 backdrop-blur border-t border-gray-300 shadow-[0_-1px_4px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div role="region" aria-label="Neste steg" className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className={`order-1 basis-full md:order-2 md:basis-0 md:flex-1 min-w-0 flex items-start gap-2 text-sm text-gray-900${cancellation ? " hidden md:block" : ""}`}>
                    {!cancellation && (
                      <>
                        {icon}
                        <span>
                          {text}
                          {link && (
                            <button type="button" onClick={() => setActiveSection(link!.to)} className="ml-2 font-medium text-blue-700 underline">
                              {link.label}
                            </button>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  {sectionIndex > 0 && (
                    <button
                      onClick={() => goToSection(sectionIndex - 1)}
                      className="order-2 md:order-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-11 md:min-h-0 text-sm font-medium text-gray-800 border border-gray-400 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      <E k="btn.prev" />
                    </button>
                  )}
                  {onSign ? (
                    d?.showButton && (
                      <button
                        type="button"
                        aria-disabled={!templateMode && !d.ready}
                        onClick={() => triggerAction(d.kind, d.ready)}
                        className={`order-3 flex-1 md:flex-none px-6 py-2.5 min-h-11 md:min-h-0 text-sm font-semibold rounded-lg transition-colors ${
                          templateMode || d.ready
                            ? "bg-blue-700 text-white hover:bg-blue-800"
                            : "bg-gray-200 text-gray-700 border border-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  ) : (
                    sectionIndex < sectionOrder.length - 1 && (
                      <button
                        onClick={() => goToSection(sectionIndex + 1)}
                        className="order-3 flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-11 md:min-h-0 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        {isLastBeforeSign ? t("flow.goToSigning") : <E k="btn.next" />}
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })()}
        </main>

        {/* Right Sidebar - Full Height */}
        {showToc && (readingMode || infoBlock) && (
        <aside className="hidden lg:block w-80 bg-white overflow-auto border-l border-gray-200 p-8">
          {infoBlock}
          {readingMode && (
            <>
              <div className="mb-4">
                <span className="text-sm font-bold text-gray-900 tracking-wide">
                  Innhold
                </span>
              </div>

              {tocBody}
            </>
          )}
        </aside>
        )}

        {/* Info panel: right overlay without a backdrop, so the page stays readable and usable; the left edge can be dragged to resize */}
        {openInfo && (
          <aside
            aria-label={openInfo.title}
            style={{ "--info-w": `${infoWidth}px` } as React.CSSProperties}
            className="fixed inset-y-0 right-0 z-40 w-[var(--info-w)] max-w-full flex bg-white border-l border-gray-300 shadow-2xl"
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Endre bredde på infopanelet"
              aria-valuenow={infoWidth}
              aria-valuemin={INFO_MIN_W}
              aria-valuemax={INFO_MAX_W}
              tabIndex={0}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) setInfoWidth(clampInfoWidth(window.innerWidth - e.clientX));
              }}
              onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setInfoWidth((w) => clampInfoWidth(w + 24));
                if (e.key === "ArrowRight") setInfoWidth((w) => clampInfoWidth(w - 24));
              }}
              className="absolute left-0 top-0 h-full w-2 -ml-1 cursor-col-resize touch-none hover:bg-blue-200 focus:bg-blue-300 focus:outline-none z-10"
            />
            <div className="flex-1 min-w-0 overflow-auto p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{openInfo.title}</h2>
                <button onClick={() => setOpenInfo(null)} aria-label="Lukk" className="p-2 -m-2 rounded hover:bg-gray-100">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="text-sm text-gray-900">
                <RichText html={openInfo.body} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}