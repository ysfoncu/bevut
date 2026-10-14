# BeVut – evaluation of the new assessment form (walkthrough 12 Oct 2026)

**Team:** driver (Claude – ran the flow in Safari and captured the screens), UX expert (interaction design + WCAG 2.2), product owner (college view).
**Scope:** the full flow, student → supervisor → teacher → all sign → final assessment, plus preview, template mode and a 390 px viewport.
**Screenshots:** `screenshots/01 … 18` (numbers are referenced below).
**Scope note:** this is a prototype. Backend, persistence, authentication, e-mail code signing and audit log are planned for the real app and are deliberately not listed as findings; the language mix (originally W1) has since been fixed and is also removed.

## 1. What was walked

| Step | Screens |
|---|---|
| Student writes comments, sets Måloppnåelse in all 6 categories, presses **Send inn** (confirm dialog) | 01–05 |
| Supervisor opens the form (sees lock/awaiting chips), fills in, submits | 06–07 |
| Teacher reviews, comments, sets final Måloppnåelse | 08–09 |
| Teacher on Signering page: blocked → completion date + consent → sign | 10–12 |
| Student and supervisor sign → final assessment (Sluttvurdering) opens | 13–15 |
| Preview (reading mode), Template mode, 390 px width | 16–18 |

Result of the walkthrough: **the process runs end to end with no dead ends** – all three roles could complete their part, the signing timestamps were recorded, and Sluttvurdering opened automatically after the third signature.

**Evidence quality.** The UX expert opened 8 of the 18 screenshots, the product owner 10; the rest of their findings are marked *unverified* by them. The driver cross-checked the disputed claims (see section 6).

---

## 2. Strong points

1. **Structure follows the commissioned spec.** Six fixed categories, LUB always visible, description box, three named text fields in the specified order, scoring line last (01, 02, 06). Field names are exact.
2. **Text before score** supports the formative-dialogue goal in the spec.
3. **Clear role separation and state.** Role colours (student #76157C, supervisor #8786F7, teacher #173348), role dots, and chips with icon + text ("Vises etter at du har sendt inn", "Venter på lærer") so state is not conveyed by colour alone (01, 06).
4. **Scoring line is understandable.** Definition under every step, other roles' scores as initials (AA/VT/LK) on the line, and a "Vurdert av" list with name, role, date and a "Du" tag – the person who made a selection is always identifiable (09).
5. **Summary table** (Hovedkategori × Student / Praksisveileder / Lærer) shows disagreement at a glance and who saved each score (10, 15).
6. **Signing flow is explicit and guarded.** Next-step bar with a readiness message, specific errors (missing completion date, missing consent) both inline and in a panel, consent checkbox in the form, a plain confirmation dialog, silent system timestamps and a separate teacher completion date (10–12, 15).
7. **Per-person status cards** show Innsendt / Signert · timestamp, with the teacher's reopen action (10, 15).
8. **Template mode** separates fixed structure from editable course content, which fits "six courses, one template" (17).
9. **Workflow hygiene:** read-only after submit, teacher can reopen, other roles' content is hidden until the viewer has submitted (reduces anchoring).

## 3. Weak points

| # | Finding | Severity | Evidence | Raised by |
|---|---|---|---|---|
| W1 | **Not usable at 390 px.** Header clipped (role switch hidden), double horizontal scrollbar, sidebar and "Innhold" panel consume the width, tab bar truncated. | High (students/supervisors use phones on placement) | 18 | UX, PO |
| W2 | **Next step is easy to miss.** The status banner is at the top of the page but the sign bar is at the bottom and not sticky; sidebar dots have no legend/text alternative and everything is red until done. | High | 03, 10, 11 | UX |
| W3 | **Completion date** is a raw locale date field (shows `10/12/2026` – ambiguous), accepts any date incl. before the placement period; the error panel text "Velg fullføringsdato. (+1)" is cryptic. | Medium | 11, 15 | UX, PO |
| W4 | **Progress bar** ("Skjemaframdrift 6/7 – 86%") counts the Signering page as an item and doesn't say what is missing. | Medium | 10 | UX, PO |
| W5 | **Supervisor colour contrast.** #8786F7 on white ≈ 3:1 for the small "Veileder" label and avatar initials (below 4.5:1). Small grey captions and the scale descriptions are borderline. | Medium | 03, 09 | UX |
| W6 | **Summary table repeats long badges** ("Delvis måloppnåelse" wraps) and does not highlight rows where roles diverge. | Medium | 10 | UX |
| W7 | **Teacher's final score is unexplained** when it differs from supervisor/student (e.g. category 5: student Delvis, supervisor God, teacher God); no justification required. | Medium (assessment validity) | 10 | PO |
| W8 | **Multi-supervisor rule** (one shared answer, last save wins) hides disagreement; no version history or "someone is editing" signal. | Medium | 09 | PO |
| W9 | **Controls outside the spec** – "Avbryt vurderingsprosess" and "Aktiver handlingsplan" sit next to the sign flow, unexplained and without confirmation. | Medium | 10, 15 | PO |
| W10 | **Rich-text field** – "Ikke lagret" is small orange text, "Avbryt" looks like plain text; the Lagre/Avbryt step is a second layer before Send inn. | Low–Medium | 01 | UX, PO |
| W11 | **Template mode** shows the real student answer inside the template, uses dashed outlines on every label (noisy), has unlabelled ⋮ menus. | Low | 17 | UX, driver |
| W12 | **Header role switcher + user dropdown** are demo controls living in the production header. | Low | 06, 14 | UX, driver |
| W13 | **Long text is untested** – LUB/description are placeholders, so the expand/collapse behaviour was not exercised in this walkthrough. | Low | 02 | PO |

## 4. Risks (product owner)

- **Assessment validity:** the teacher can reopen a student's or supervisor's submitted text; without a record this can change content after the fact. Reopening after the teacher has signed is currently **not possible** (button disappears), so an error found after signing has no path.
- **Deadlocks:** a role that never submits blocks the teacher; a role that never signs blocks Sluttvurdering. No reminder, deadline or "sign on behalf" exists.

## 5. Improvement backlog

**Must**



**Should**
4. Responsive layout ≤ 768 px: sidebar as drawer/select, table of contents collapsed, header wrapped.
5. Make the next step unmissable: sticky next-step bar (or a link from the banner), progress text that names what is missing, legend + text alternatives for the sidebar dots.
6. Completion date: unambiguous format ("12. okt. 2026"), validated against the placement period, clearer error text.
7. Darken the supervisor text colour to ≥ 4.5:1 (keep #8786F7 for fills); raise caption contrast.
8. Require a short justification when the teacher's score differs from the supervisor's by two or more steps.
9. Autosave drafts (or warn on leaving), real secondary button for Avbryt, more visible "ikke lagret" state.
10. Explain or remove "Avbryt vurderingsprosess" / "Aktiver handlingsplan" and add a confirmation if kept.
11. Summary table: short labels or numbers with full text on hover/accessible name; highlight diverging rows.

**Could**
12. PDF/print export of the signed assessment; template versioning so a signed form keeps its template; hide demo controls outside demo mode; template mode: editable regions on hover only and no user data.

## 6. Verification notes (driver cross-check)

Claims by the experts that were checked against the running app / screenshots:

- **Confirmed:** 390 px layout broken (18); template mode shows the real student answer (17); long summary badges wrap (10); no legend on sidebar dots. (Language-related findings were fixed afterwards and removed.)
- **Not confirmed / corrected:**
  - *"Student view has no status banner" (UX):* there **is** a role-aware banner at the top of every page (e.g. "Læreren har signert. Gjennomgå og signer skjemaet." for the student, seen in the flow). The real problem is that it is out of view when the user is at the sign bar → W2 reworded.
  - *"Easy to lose text by navigating away" (PO):* an open, changed draft is **kept** when leaving the page; it is only discarded by pressing Avbryt. The unsaved-state visibility concern (W10) still stands.
  - *"God (forventet nivå) missing from the label" (PO):* in the commissioned text "forventet nivå" belongs to the *description under* the step, which is how it is implemented (02, 09). If the college wants it in the label itself, that is a content decision – listed as an open question.
- **Not assessed by the experts** (assessed by the driver only): confirmation dialogs (04, 12), final-assessment popup (14), published comment cards (05), supervisor filled view (07), teacher first view (08), reading mode (16). They behaved as designed during the walkthrough; no visual defects were noted by the driver beyond the weak points listed above.

## 7. Open questions for the college

1. What counts as a valid signature – e-mail code, BankID, Feide? Is a qualified e-signature required?
2. Retention period, record ownership, data-processor agreement?
3. Which supervisor is authoritative when several exist? Can a "responsible" one be assigned?
4. May the teacher finalise without a student's/supervisor's submission after a deadline?
5. Can a signed assessment be corrected, and by whom?
6. How are failing/at-risk results handled – is "Aktiver handlingsplan" in scope?
7. Must students see the teacher's final score before they sign (today they do)?
8. Should "forventet nivå" appear in the God label, and do the six courses need different scale definitions?
9. Should the completion date be limited to the placement period or to dates not in the future?
