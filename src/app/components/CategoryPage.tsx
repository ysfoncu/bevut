import { useState, type ReactNode } from "react";
import { Info, Plus, Trash2, ChevronDown, ChevronUp, Clock, Lock, AlertCircle } from "lucide-react";
import { RichText, RichTextEditor, plainTextLength } from "./RichText";
import { LikertScale, type LikertLevel } from "./LikertScale";
import { RoleCommentField, formatShortDate } from "./RoleCommentField";

export interface Category {
  id: string;
  title: string;
  // Læringsutbytter (LUB): one rich-text block without a heading (numbers and text are typed in template mode), stored as sanitised HTML.
  lub: string;
  // Operationalisation of the LUBs, stored as sanitised rich-text HTML.
  description: string;
}

export type Role = "supervisor" | "student" | "teacher";

// Several people can hold the same role (e.g. two supervisors or teachers). Scores are stored per person.
export interface Person {
  id: string;
  role: Role;
  name: string;
  initials: string;
  avatar: string;
}
export const PEOPLE_LIST: Person[] = [
  { id: "s1", role: "student", name: "Anna Andersson", initials: "AA", avatar: "bg-[#76157C]" },
  { id: "v1", role: "supervisor", name: "Viktor Torvaldsson", initials: "VT", avatar: "bg-[#8786F7]" },
  { id: "v2", role: "supervisor", name: "Sara Berg", initials: "SB", avatar: "bg-[#8786F7]" },
  { id: "t1", role: "teacher", name: "Lena Karlsson", initials: "LK", avatar: "bg-[#173348]" },
  { id: "t2", role: "teacher", name: "Jonas Dahl", initials: "JD", avatar: "bg-[#173348]" },
];
export const personById = (id: string | undefined) => PEOPLE_LIST.find((p) => p.id === id);
export const peopleOfRole = (role: Role) => PEOPLE_LIST.filter((p) => p.role === role);

// One Måloppnåelse score per role and category. Any person in the role can answer or change it; the latest save wins.
export interface RoleScore {
  level: number; // 0-4
  at: string; // ISO date it was last saved
  by: string; // person id of whoever saved it last
}

// Each role has one shared text and one shared score per category (latest saved wins).
export interface CategoryResponse {
  student: string;
  supervisor: string;
  teacher: string;
  // Who last saved each role's text (person id), so the comment card shows the right author.
  textBy: Record<Role, string>;
  scores: Partial<Record<Role, RoleScore>>;
}
export const roleScore = (resp: CategoryResponse, role: Role): number | null => resp.scores[role]?.level ?? null;

// Primary person per role (used where a single representative is shown).
export const PEOPLE: Record<Role, Person> = {
  student: PEOPLE_LIST[0],
  supervisor: PEOPLE_LIST[1],
  teacher: PEOPLE_LIST[3],
};

interface CategoryPageProps {
  category: Category;
  index: number;
  role: Role;
  // The person acting in this role (their own score is the one being edited).
  me: Person;
  templateMode: boolean;
  // Student/supervisor: form submitted. Teacher: signed. A role's content is locked and visible to the others once done.
  done: Record<Role, boolean>;
  response: CategoryResponse;
  // ISO date each role published (submitted / signed) in the active term.
  publishedAt: Record<Role, string>;
  // Endterm only: the halvtid answers for this category. Shown ONLY on demand (collapsed block) so the earlier grading
  // cannot unintentionally steer the new one.
  midterm?: { response: CategoryResponse; publishedAt: Record<Role, string> };
  levels: LikertLevel[];
  showErrors: boolean;
  t: (key: string) => string;
  E: (key: string) => ReactNode;
  onSaveText: (key: "student" | "supervisor" | "teacher", html: string) => void;
  onSetScore: (level: number | null) => void;
  // Teacher only: grading is blocked until student and supervisor have submitted; selecting a step calls onGradingBlocked.
  gradingBlocked: boolean;
  // The assessment process was cancelled: nothing can be edited or graded by anyone.
  locked?: boolean;
  onGradingBlocked: () => void;
  // Template-mode callbacks
  onChangeLub: (html: string) => void;
  onChangeDescription: (html: string) => void;
}

// One colour per role: student #76157C, supervisor #8786F7, teacher #173348.
export const ROLE_STYLE: Record<Role, { chip: string; dot: string; roleKey: string; badgeKey: string; badgeText: string; selectedFill: string; selectedBorder: string; selectedText: string }> = {
  student: { chip: "bg-[#76157C]/10 text-[#76157C] border-[#76157C]/40", dot: "bg-[#76157C]", roleKey: "cat.roleStudent", badgeKey: "cat.badgeStudent", badgeText: "text-[#76157C]", selectedFill: "bg-[#76157C]", selectedBorder: "border-[#76157C]", selectedText: "text-[#76157C]" },
  // The chip text is a darker shade of #8786F7 so it stays readable on the light tint.
  supervisor: { chip: "bg-[#8786F7]/15 text-[#3F3DB0] border-[#8786F7]", dot: "bg-[#8786F7]", roleKey: "cat.roleSupervisor", badgeKey: "cat.badgeSupervisor", badgeText: "text-[#8786F7]", selectedFill: "bg-[#8786F7]", selectedBorder: "border-[#8786F7]", selectedText: "text-[#3F3DB0]" },
  teacher: { chip: "bg-[#173348]/10 text-[#173348] border-[#173348]/40", dot: "bg-[#173348]", roleKey: "cat.roleTeacher", badgeKey: "cat.badgeTeacher", badgeText: "text-[#173348]", selectedFill: "bg-[#173348]", selectedBorder: "border-[#173348]", selectedText: "text-[#173348]" },
};

export const ROLE_LETTER: Record<Role, string> = { student: "S", supervisor: "V", teacher: "L" };
const ROLE_ORDER: Role[] = ["student", "supervisor", "teacher"];

const DESCRIPTION_COLLAPSE_AT = 450;
const plain = (html: string) => html.replace(/<[^>]*>|&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export function CategoryPage({
  category,
  index,
  role,
  me,
  templateMode,
  done,
  response,
  midterm,
  publishedAt,
  levels,
  showErrors,
  t,
  E,
  onSaveText,
  onSetScore,
  gradingBlocked,
  locked = false,
  onGradingBlocked,
  onChangeLub,
  onChangeDescription,
}: CategoryPageProps) {
  const [expanded, setExpanded] = useState(false);
  const [midOpen, setMidOpen] = useState(false);
  const longDescription = plain(category.description).length > DESCRIPTION_COLLAPSE_AT;
  const ownEditable = !templateMode && !locked && !done[role];
  const ownScore = roleScore(response, role);
  // What the active role may see of another role's content:
  //  - teacher sees student/supervisor once they have submitted
  //  - student and supervisor see each other's only after they have submitted themselves (and the other has submitted)
  //  - everyone sees the teacher's content once the teacher has signed
  const visibility = (owner: Role): "own" | "visible" | "locked" | "awaiting" => {
    if (owner === role) return "own";
    if (owner === "teacher" || role === "teacher") return done[owner] ? "visible" : "awaiting";
    if (!done[role]) return "locked";
    return done[owner] ? "visible" : "awaiting";
  };
  const scoreMissing = showErrors && ownScore === null && ownEditable;
  // Student: always mandatory. Supervisor: mandatory when giving Lav måloppnåelse (level 0).
  const commentRequired = (key: "student" | "supervisor" | "teacher") =>
    (key === "student" && role === "student") || (key === "supervisor" && role === "supervisor" && ownScore === 0);
  const commentMissing = (key: "student" | "supervisor" | "teacher") =>
    showErrors && commentRequired(key) && !done[key as "student" | "supervisor"] && !templateMode && !locked && plainTextLength(response[key]) === 0;
  // Supervisor chose Lav måloppnåelse but has not written the mandatory comment yet.
  const lowScoreNeedsComment = role === "supervisor" && ownScore === 0 && ownEditable && plainTextLength(response.supervisor) === 0;
  const cid = category.id;

  const fields: { key: "student" | "supervisor" | "teacher"; labelKey: string; owner: Role }[] = [
    { key: "student", labelKey: "cat.fieldStudent", owner: "student" },
    { key: "supervisor", labelKey: "cat.fieldSupervisor", owner: "supervisor" },
    { key: "teacher", labelKey: "cat.fieldTeacher", owner: "teacher" },
  ];

  // Scores that are visible to me: my own role's (shared by all colleagues, always visible) and other roles' once they are done.
  const gradedRoles = templateMode ? [] : ROLE_ORDER.filter((r) => response.scores[r] && (r === role || visibility(r) === "visible"));
  const whoGraded = (r: Role) => personById(response.scores[r]?.by) ?? PEOPLE[r];
  // Other roles' scores as markers on the scale, plus the midterm final scores while grading the endterm.
  const scoreMarkers: { value: number | null; text: string; title: string; className: string; fill?: string }[] = templateMode
    ? []
    : [
        // Your own name chip: after you have published (the teacher's appears immediately on selection).
        ...(ownScore !== null && (done[role] || role === "teacher")
          ? [
              {
                value: ownScore,
                text: whoGraded(role).initials,
                title: `${whoGraded(role).name} (${t(ROLE_STYLE[role].roleKey)})`,
                className: ROLE_STYLE[role].chip,
              },
            ]
          : []),
        ...gradedRoles
          .filter((r) => r !== role)
          .map((r) => ({
            value: response.scores[r]!.level,
            text: whoGraded(r).initials,
            title: `${whoGraded(r).name} (${t(ROLE_STYLE[r].roleKey)})`,
            className: ROLE_STYLE[r].chip,
            fill: `${ROLE_STYLE[r].selectedFill} ${ROLE_STYLE[r].selectedBorder}`,
          })),
      ];
  // "Waiting for" chips under the scale are blockers for the teacher only.
  const pendingChips = templateMode || role !== "teacher" ? [] : ROLE_ORDER.filter((r) => visibility(r) === "awaiting");

  const sectionCard = "bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{category.title}</h1>

      {/* A. Læringsutbytter — one rich-text block, no visible heading; always visible (universal design) */}
      {(templateMode || plainTextLength(category.lub) > 0) && (
        <section id={`${cid}-lub`} aria-label={t("cat.lubHeading")} className={sectionCard}>
          {templateMode ? (
            <RichTextEditor value={category.lub} onChange={onChangeLub} ariaLabel={t("cat.lubHeading")} />
          ) : (
            <div className="text-sm text-gray-900 leading-relaxed">
              <RichText html={category.lub} />
            </div>
          )}
        </section>
      )}

      {/* B. Beskrivelse av læringsutbyttene */}
      <section id={`${cid}-desc`} aria-labelledby={`${cid}-desc-h`} className={`${sectionCard} bg-blue-50/40 border-blue-200`}>
        <h2 id={`${cid}-desc-h`} className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" aria-hidden="true" />
          {E("cat.descHeading")}
        </h2>
        {templateMode ? (
          <RichTextEditor value={category.description} onChange={onChangeDescription} />
        ) : (
          <>
            <div
              id={`${cid}-desc-body`}
              className={`text-sm text-gray-800 leading-relaxed relative ${longDescription && !expanded ? "max-h-32 overflow-hidden" : ""}`}
            >
              <RichText html={category.description} />
              {longDescription && !expanded && (
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-blue-50 to-transparent" />
              )}
            </div>
            {longDescription && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls={`${cid}-desc-body`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expanded ? t("cat.showLess") : t("cat.showMore")}
              </button>
            )}
          </>
        )}
      </section>

      {/* C. Vurderings- og kommentarfelt — text comes before the scoring line */}
      <section id={`${cid}-assess`} aria-label={t("cat.assessHeading")} className={`${sectionCard} space-y-5`}>
        {fields.map(({ key, labelKey, owner }) => {
          const id = `${cid}-${key}`;
          const editable = !templateMode && !locked && role === owner && !done[owner];
          const style = ROLE_STYLE[owner];
          // Another role's field that is not visible yet: show a chip instead of an empty box.
          const vis = templateMode ? "own" : visibility(owner);
          const awaiting = vis === "awaiting" || vis === "locked";
          const labelClass = "flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1.5";
          const dot = <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />;
          return (
            <div key={key}>
              {awaiting ? (
                <>
                  <p id={`${id}-label`} className={labelClass}>{dot}{E(labelKey)}</p>
                  <span
                    role="status"
                    aria-labelledby={`${id}-label`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${style.chip}`}
                  >
                    {vis === "locked" ? <Lock className="w-4 h-4" aria-hidden="true" /> : <Clock className="w-4 h-4" aria-hidden="true" />}
                    {vis === "locked" ? t("cat.visibleAfterSubmit") : `${t("cat.awaiting")} ${t(style.roleKey)}`}
                  </span>
                </>
              ) : (
                <>
                  <p id={`${id}-label`} className={labelClass}>
                    {dot}
                    {E(labelKey)}
                    {commentRequired(key) && editable && <span className="text-red-600" aria-hidden="true">*</span>}
                  </p>
                  <RoleCommentField
                    id={id}
                    label={t(labelKey)}
                    value={response[key]}
                    editable={editable}
                    published={!templateMode && done[owner]}
                    person={personById(response.textBy[owner]) ?? PEOPLE[owner]}
                    badge={t(style.badgeKey)}
                    badgeClass={style.badgeText}
                    publishedAt={publishedAt[owner]}
                    placeholder={t("cat.placeholder")}
                    emptyText={t("cat.noComment")}
                    saveLabel={t("cat.save")}
                    cancelLabel={t("cat.cancel")}
                    unsavedLabel={t("cat.unsaved")}
                    invalid={key === "supervisor" && commentRequired(key) && !templateMode && !locked}
                    onSave={(html) => onSaveText(key, html)}
                  />
                  {commentMissing(key) && (
                    <p role="alert" className="mt-2 text-sm text-red-700">{t(key === "supervisor" ? "cat.commentRequiredSupervisor" : "cat.commentRequired")}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </section>

      {/* D. Skåringslinje — you set your own score; other roles' scores appear as markers once they are done */}
      <section id={`${cid}-score`} aria-labelledby={`${cid}-score-h`} className={sectionCard}>
        <h2 id={`${cid}-score-h`} className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          {E("cat.scoreHeading")}
          {ownEditable && <span className="text-red-600" aria-hidden="true">*</span>}
        </h2>
        {!templateMode && !locked && (
          <p className="text-sm text-gray-600 mb-5 flex items-center gap-2">
            <span aria-hidden="true" className={`w-2.5 h-2.5 flex-shrink-0 rounded-full ${ROLE_STYLE[role].dot}`} />
            {role === "teacher" ? t("cat.scoreHintTeacher") : t("cat.scoreHintOwn")}
          </p>
        )}
        <LikertScale
          levels={levels}
          value={templateMode ? null : ownScore}
          onChange={(v) => {
            if (gradingBlocked) onGradingBlocked();
            else onSetScore(v);
          }}
          readOnly={!ownEditable}
          ariaLabel={`${category.title} – ${t("cat.scoreHeading")}`}
          invalid={scoreMissing}
          selectedFill={ROLE_STYLE[role].selectedFill}
          selectedBorder={ROLE_STYLE[role].selectedBorder}
          selectedTextClass={ROLE_STYLE[role].selectedText}
          markers={scoreMarkers}
        />
        {lowScoreNeedsComment && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm font-medium text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            {t("cat.lowScoreComment")}
          </p>
        )}
        {/* Everyone who graded: avatar, name, role, date and the chosen level — the grader is always clear */}
        {gradedRoles.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("cat.gradedBy")}</h3>
            <ul className="space-y-4">
              {gradedRoles.map((r) => {
                const sc = response.scores[r]!;
                const p = whoGraded(r);
                const st = ROLE_STYLE[r];
                return (
                  <li key={r} className="flex items-start gap-3">
                    <div className={`w-11 h-11 ${p.avatar} rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`} aria-hidden="true">
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className={`ml-3 font-medium ${st.badgeText}`}>{t(st.badgeKey)}</span>
                        <span className="ml-3 text-gray-500">- {formatShortDate(sc.at)}</span>
                        {p.id === me.id && <span className="ml-3 text-xs font-semibold text-gray-600 border border-gray-300 rounded px-1.5 py-0.5">{t("cat.you")}</span>}
                      </p>
                      <p className={`mt-1 inline-flex items-center gap-2 text-sm font-medium rounded border px-2 py-0.5 ${st.chip}`}>
                        <span aria-hidden="true" className="font-bold">{p.initials}</span>
                        {t(`lik.${sc.level + 1}.label`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {(() => {
          const levels = new Map<number, number>();
          if (ownScore !== null && !templateMode) levels.set(ownScore, 1);
          scoreMarkers.filter((m) => m.fill && m.value !== null).forEach((m) => levels.set(m.value as number, (levels.get(m.value as number) ?? 0) + 1));
          const agreement = [...levels.values()].some((n) => n >= 2);
          return agreement ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-700">
              <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full bg-green-600" />
              {t("cat.agreeLegend")}
            </p>
          ) : null;
        })()}
        {pendingChips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pendingChips.map((r) => (
              <span
                key={r}
                role="status"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${ROLE_STYLE[r].chip}`}
              >
                <Clock className="w-4 h-4" aria-hidden="true" />
                {t("cat.awaiting")} {t(ROLE_STYLE[r].roleKey)}
              </span>
            ))}
          </div>
        )}
        {scoreMissing && (
          <p role="alert" className="mt-3 text-sm text-red-700">{t("cat.scoreRequired")}</p>
        )}
      </section>

      {/* Endterm: the halvtid result for this category — collapsed by default and only opened by an explicit action.
          Colour scale first (who chose what), then the comments. */}
      {midterm && !templateMode && (
        <section aria-labelledby={`${cid}-mid-h`} className="bg-white rounded-lg border border-gray-300">
          <h2 id={`${cid}-mid-h`} className="text-base font-semibold text-gray-900">
            <button
              type="button"
              onClick={() => setMidOpen((v) => !v)}
              aria-expanded={midOpen}
              aria-controls={`${cid}-mid-body`}
              className="w-full min-h-11 flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg"
            >
              <span>{midOpen ? t("cat.midtermHide") : t("cat.midtermShow")}</span>
              {midOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0" aria-hidden="true" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" aria-hidden="true" />}
            </button>
          </h2>
          {midOpen && (
            <div id={`${cid}-mid-body`} className="px-4 pb-5 pt-5 border-t border-gray-200">
              {/* 1. the scale with every role's halvtid grade in its role colour (green where roles agree) */}
              <LikertScale
                display
                levels={levels}
                value={null}
                onChange={() => {}}
                readOnly
                ariaLabel={`${category.title} – ${t("tab.halvtid")}`}
                markers={ROLE_ORDER.filter((r) => midterm.response.scores[r]).map((r) => {
                  const sc = midterm.response.scores[r]!;
                  const who = personById(sc.by) ?? PEOPLE[r];
                  return {
                    value: sc.level,
                    text: who.initials,
                    title: `${who.name} (${t(ROLE_STYLE[r].roleKey)})`,
                    className: ROLE_STYLE[r].chip,
                    fill: `${ROLE_STYLE[r].selectedFill} ${ROLE_STYLE[r].selectedBorder}`,
                  };
                })}
              />
              {(() => {
                const counts = new Map<number, number>();
                ROLE_ORDER.forEach((r) => {
                  const sc = midterm.response.scores[r];
                  if (sc) counts.set(sc.level, (counts.get(sc.level) ?? 0) + 1);
                });
                return [...counts.values()].some((n) => n >= 2) ? (
                  <p className="mt-3 flex items-center gap-2 text-xs text-gray-700">
                    <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full bg-green-600" />
                    {t("cat.agreeLegend")}
                  </p>
                ) : null;
              })()}

              {/* 2. then the comments */}
              <div className="mt-6 space-y-5">
                {ROLE_ORDER.map((r) => {
                  const sc = midterm.response.scores[r];
                  const st = ROLE_STYLE[r];
                  const person = personById(midterm.response.textBy[r]) ?? PEOPLE[r];
                  const author = r === "teacher" && sc ? personById(sc.by) ?? person : person;
                  const comment = midterm.response[r];
                  return (
                    <div key={r} className="flex items-start gap-3">
                      <div className={`w-11 h-11 ${author.avatar} rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`} aria-hidden="true">
                        {author.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-gray-900">{author.name}</span>
                          <span className={`ml-3 font-medium ${st.badgeText}`}>{t(st.badgeKey)}</span>
                          {midterm.publishedAt[r] && <span className="ml-3 text-gray-500">- {formatShortDate(midterm.publishedAt[r])}</span>}
                          <span className={`ml-3 inline-block text-xs font-medium rounded border px-2 py-0.5 ${sc ? st.chip : "bg-gray-100 text-gray-700 border-gray-300"}`}>
                            {sc ? t(`lik.${sc.level + 1}.label`) : t("summary.none")}
                          </span>
                        </p>
                        <div className="mt-1 text-sm text-gray-700 leading-relaxed">
                          {plain(comment) ? <RichText html={comment} /> : <span className="italic text-gray-500">{t("cat.noComment")}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
