# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Start Vite dev server
pnpm build        # Production build
```

No test runner is configured.

## Architecture

**BeVut** is a fully client-side React + TypeScript + Vite application — an interactive student assessment form for nursing students on work-integrated learning placements (VFU) at Högskolan i Borås. There is no backend; all state lives in React component state.

### Key files

- `src/app/App.tsx` — the entire application (~1,300 lines). All form state and business logic lives here. It renders a multi-step wizard with 5 sections.
- `src/app/components/AssessmentQuestion.tsx` — reusable two-column selector (Pass / Fail) used for each assessment criterion.
- `src/app/components/AssessmentSummary.tsx` — summary table shown in the Oppsumering step.
- `src/app/components/ui/` — 40+ shadcn/ui components (Radix UI wrappers). Treat these as a local component library; prefer editing `App.tsx` over modifying them.

### Assessment form structure

The wizard has five steps, controlled by a `currentStep` state variable in `App.tsx`:
1. **Praksisinformasjon** — student info and placement details
2. **Planering** — scheduling dates
3. **Bedömningskriterier** — 4 emergency-nursing assessment criteria, each scored Pass/Fail
4. **Oppsumering** — midterm and end-term written summaries
5. **Signering** — digital signatures

Each criterion supports two separate passes: midterm (`halvtid`) and end-term (`slut`). The UI shows colored status badges (red = required/incomplete, yellow = optional, green = done).

A "Reading Mode" (`läsläge`) renders a print-friendly single-page view of the full assessment.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js` file. Theme variables are defined in `src/styles/theme.css`. The `@` path alias resolves to `src/`.

### Vite config note

`vite.config.ts` includes a custom plugin (`figmaAssetResolver`) that rewrites import paths for assets originally generated from a Figma "Make" export. Don't remove it.
