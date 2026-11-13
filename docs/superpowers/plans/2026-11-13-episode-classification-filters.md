# Episode Classification Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add administrator-managed episode classifications and accessible multi-filter discovery on the Shows page without changing playback authorization.

**Architecture:** Add four boolean classification fields to the existing `episodes` record and propagate them through the catalog. A focused client component owns OR-filter state, category-preserving rendering, and the visitor signup notice; the server page continues to load catalog and session data.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Drizzle ORM/PostgreSQL, Vitest, Testing Library, CSS.

**Spec:** `docs/superpowers/specs/2026-11-13-episode-classification-filters-design.md`

## Global Constraints

- Public labels are exactly: `Free Episodes`, `Non-Technical Episodes`, `Beginner Episodes`, `Seriously Episodes`.
- Multiple active filters use OR matching; no active filters show all episodes.
- Every category remains visible even when zero episodes match.
- Classification never changes `accessLevel` or media authorization.
- Visitors activating subscriber-only full playback receive an accessible signup notice linking to `/signup`.
- Preserve the shared header, dark-mode control, catalog ordering, and responsive styling.

## Review Focus

- Existing episode rows with all four defaults false migrate and render without errors; pin in the schema/migration test.
- Selecting and deselecting several filters returns correct OR results and restores all episodes; pin in the filter-component test.
- A category with zero matching episodes remains visible with its own no-match message; pin in the filter-component test.
- A visitor cannot turn a classification into playback access, while a subscriber keeps normal navigation; pin in the episode-action tests.
- Updating classifications on an existing episode changes only the four booleans and `updatedAt`; pin in the API route test.

---

### Task 1: Persist Episode Classifications

**Files:**
- Modify: `src/db/content/schema.ts`
- Modify: `src/db/content/schema.test.ts`
- Create: `migrations/content/0003_<generated_name>.sql`
- Create/Modify: `migrations/content/meta/0003_snapshot.json`
- Modify: `migrations/content/meta/_journal.json`

**Interfaces:**
- Produces: episode fields `isFreeClassification`, `isNonTechnical`, `isBeginner`, and `isSeriously`, each `boolean`, non-null, default `false`.

- [ ] **Step 1: Write the failing schema test** asserting the four exact database column names (`is_free_classification`, `is_non_technical`, `is_beginner`, `is_seriously`) and non-null false defaults.
- [ ] **Step 2: Run `npm test -- src/db/content/schema.test.ts`** and verify it fails because the columns are absent.
- [ ] **Step 3: Add the four fields to `episodes`** using Drizzle `boolean(...).notNull().default(false)`.
- [ ] **Step 4: Generate the content migration** with `npx drizzle-kit generate --config=drizzle.content.config.ts`; inspect that it only adds the four safe defaulted columns and metadata.
- [ ] **Step 5: Run `npm test -- src/db/content/schema.test.ts`** and verify it passes.
- [ ] **Step 6: Commit** with `git commit -m "feat: store episode classifications"`.

### Task 2: Create and Update Classifications in Admin

**Files:**
- Modify: `src/app/admin/podcasts/page.tsx`
- Modify: `src/app/admin/podcasts/page.test.tsx`
- Modify: `src/app/api/admin/podcasts/route.ts`
- Modify: `src/app/api/admin/podcasts/route.test.ts`

**Interfaces:**
- Consumes: four episode boolean fields from Task 1.
- Produces: form action `classify`; form names identical to the four TypeScript field names; helper `episodeClassifications(form: FormData)` returning the four booleans.

- [ ] **Step 1: Write failing page tests** proving the create form has all four checkboxes and an existing episode card renders current checked values plus an `Update classifications` control.
- [ ] **Step 2: Run `npm test -- src/app/admin/podcasts/page.test.tsx`** and verify the controls are missing.
- [ ] **Step 3: Render the classification fieldset** in both create and existing-episode forms, using accessible legends and checkbox labels `Free`, `Non-Technical`, `Beginner`, and `Seriously`.
- [ ] **Step 4: Run the page test** and verify it passes.
- [ ] **Step 5: Write failing route tests** proving create persists all submitted classifications, `classify` supports arbitrary combinations including none, and the update payload contains only four booleans plus `updatedAt`.
- [ ] **Step 6: Run `npm test -- src/app/api/admin/podcasts/route.test.ts`** and verify the new expectations fail.
- [ ] **Step 7: Implement `episodeClassifications(form: FormData)` and the `classify` action**, leaving `accessLevel`, category, status, and media untouched.
- [ ] **Step 8: Run both admin test files** and verify they pass.
- [ ] **Step 9: Commit** with `git commit -m "feat: manage episode classifications"`.

### Task 3: Build the Category-Preserving OR Filter

**Files:**
- Create: `src/components/shows-catalog.tsx`
- Create: `src/components/shows-catalog.test.tsx`
- Modify: `src/app/shows/page.tsx`
- Modify: `src/features/media/catalog.ts`

**Interfaces:**
- Consumes: catalog categories whose episodes carry the four Task 1 booleans and computed `access`.
- Produces: client component `ShowsCatalog({ catalog, isSubscriber }: ShowsCatalogProps)` and filter key union `"free" | "nonTechnical" | "beginner" | "seriously"`.

- [ ] **Step 1: Write failing component tests** for exact button order, `aria-pressed`, no-filter behavior, single selection, multi-select OR behavior, deselection restoration, and preserved categories with category-specific no-match text.
- [ ] **Step 2: Run `npm test -- src/components/shows-catalog.test.tsx`** and verify it fails because the component is absent.
- [ ] **Step 3: Implement the client filter state and pure matching helper** mapping public keys to the four episode booleans; keep all category sections mounted and replace only their episode grid when no episode matches.
- [ ] **Step 4: Pass the loaded catalog and subscriber state from `src/app/shows/page.tsx`**, preserving the existing introduction above the filter buttons.
- [ ] **Step 5: Update catalog fallback fixtures** so every sample episode has explicit classification fields.
- [ ] **Step 6: Run the component and Shows-page tests** and verify they pass.
- [ ] **Step 7: Commit** with `git commit -m "feat: filter shows by learning classification"`.

### Task 4: Add Visitor-Locked Playback Notice

**Files:**
- Modify: `src/components/episode-card.tsx`
- Modify: `src/components/episode-card.test.tsx`
- Create: `src/components/visitor-playback-notice.tsx`
- Create: `src/components/visitor-playback-notice.test.tsx`
- Modify: `src/components/shows-catalog.tsx`
- Modify: `src/components/shows-catalog.test.tsx`

**Interfaces:**
- Consumes: `isSubscriber` from Task 3 and the existing resolved episode `access`.
- Produces: `VisitorPlaybackNotice` dialog with `open`, `episodeTitle`, and `onClose` props; `EpisodeCard` visitor action callback for subscriber-only full playback.

- [ ] **Step 1: Write failing tests** proving visitor-accessible playback still links normally, subscriber-only visitor action is grey/locked, activation opens a dialog naming the episode, `/signup` is offered, Escape/Keep Browsing closes it, and subscriber rendering keeps the normal episode link.
- [ ] **Step 2: Run the two focused component test files** and verify the missing behavior fails.
- [ ] **Step 3: Implement the locked action and accessible dialog** using a real button for visitor activation, focus placement/return, `role="dialog"`, `aria-modal="true"`, and the exact actions `Sign Up Free` and `Keep Browsing`.
- [ ] **Step 4: Preserve existing teaser media presentation and backend authorization**; classifications do not participate in access decisions.
- [ ] **Step 5: Run the focused component tests** and verify they pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: explain subscriber playback to visitors"`.

### Task 5: Style, Verify, Migrate, and Deploy

**Files:**
- Modify: `src/styles/editorial.css`
- Modify as required: `playwright.smoke.config.ts` or existing smoke specification

**Interfaces:**
- Consumes: Tasks 1-4 complete.
- Produces: responsive filter controls, selected/focus states, locked action, dialog, and empty-category presentation consistent with Like TAC.

- [ ] **Step 1: Add responsive styles** for the four-button row, selected states, locked button, no-match state, and dialog; retain visible focus and reduced-motion behavior.
- [ ] **Step 2: Run `npm test`** and require every test file to pass with zero failures.
- [ ] **Step 3: Run `npm run build`** and require successful TypeScript, route generation, and `/shows` compilation.
- [ ] **Step 4: Apply `npm run db:migrate:content` to the configured production content database before promoting code**, and verify Drizzle reports migration success; do not deploy code first because it selects the new columns.
- [ ] **Step 5: Push the verified branch to GitHub `master`**, wait for the Vercel deployment to reach `READY`, and confirm `https://liketac.live/shows` returns HTTP 200.
- [ ] **Step 6: Perform live acceptance** as a visitor and subscriber: filter OR combinations, confirm every category persists, verify free playback, verify the locked signup notice, verify subscriber playback, check dark mode, and test desktop/mobile widths.
- [ ] **Step 7: Commit any final presentation-only adjustment** with `git commit -m "style: polish show classification filters"`, rerun Steps 2-3, and redeploy if needed.

