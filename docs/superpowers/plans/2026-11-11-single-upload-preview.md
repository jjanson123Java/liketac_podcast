# Single-Upload Subscriber Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administrator select one completed recording, have Companion locally create its first 45 seconds, and securely upload full and preview media while giving visitors and subscribers clear landing-page paths.

**Architecture:** The admin site issues a hashed, short-lived episode handoff. Companion receives the one-time secret through `liketac://`, generates a local FFmpeg derivative, and performs two client uploads through handoff-aware website endpoints; no permanent infrastructure credential leaves Vercel. Website access resolution selects full media for authorized viewers, a teaser for visitors, or a locked card when no teaser exists.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle/Neon Postgres, Vercel Blob, Electron, FFmpeg/FFprobe, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-11-11-single-upload-preview-design.md`

## Global Constraints

- The preview is exactly the first `00:45`, including the Like TAC opening reel.
- RunPod and the A40 are never used for preview generation.
- The administrator selects one source file and never manually produces a second reel.
- Full protected media must never be delivered to a signed-out visitor.
- Never expose permanent Blob, Neon, web-session, or OBS credentials to Companion.
- Preserve direct website full-media upload as a locked fallback.

## Review Focus

- Source shorter than 45 seconds produces a valid derivative ending at source EOF and does not stall.
- Interrupted generation or upload leaves the source untouched, cleans temporary output, and permits a deliberate retry.
- Expired, reused, wrong-episode, and wrong-role handoffs are rejected without leaking whether another episode exists.
- Audio-only and video inputs produce a matching teaser kind that all supported browsers can play.
- Multiple active media rows select the newest valid full/teaser pair deterministically rather than an arbitrary database row.

---

### Task 1: Access Policy and Deterministic Media Selection

**Files:**
- Modify: `src/features/media/access.ts`
- Modify: `src/features/media/access.test.ts`
- Modify: `src/features/media/catalog-preview.ts`
- Modify: `src/features/media/catalog-preview.test.ts`
- Modify: `src/features/media/catalog.ts`
- Test: `src/features/media/catalog.test.ts`

**Interfaces:**
- Produces: `resolveEpisodeAccess()` where only Start Here, explicitly public, or an active subscriber receives `"full"`; `selectNewestMediaPair()` choosing newest nondeleted media by `createdAt`.

- [ ] **Step 1: Write failing tests** proving Current/New alone is protected, Start Here is public, explicit public remains public, subscribers receive full access, protected visitors receive only the newest teaser, and missing teaser returns locked/no preview even when full media exists.
- [ ] **Step 2: Run** `npm test -- src/features/media/access.test.ts src/features/media/catalog-preview.test.ts src/features/media/catalog.test.ts` and verify the new cases fail for the current access and unordered-selection behavior.
- [ ] **Step 3: Implement** the minimal access and deterministic-selection changes; include `createdAt` in catalog media queries and never fall back from protected teaser to full media.
- [ ] **Step 4: Run the focused tests** and verify PASS.
- [ ] **Step 5: Commit** as `fix: enforce subscriber preview access`.

### Task 2: Role-Aware Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `src/features/media/catalog.ts`

**Interfaces:**
- Consumes: access rules from Task 1 and `getSession()`.
- Produces: `getLandingDestination(session)` returning the published Start Here episode for visitors and newest playable full episode for subscribers, with safe catalog fallbacks.

- [ ] **Step 1: Write failing tests** for visitor **Start Here — Watch Free**, subscriber **Play Latest Episode**, admin dashboard action, visitor sign-in cue, and missing-destination fallbacks.
- [ ] **Step 2: Run** `npm test -- src/app/page.test.tsx` and verify failures reflect the static current homepage.
- [ ] **Step 3: Implement** the dynamic server-rendered actions without hardcoded episode slugs.
- [ ] **Step 4: Run the focused test** and verify PASS.
- [ ] **Step 5: Commit** as `feat: personalize landing episode actions`.

### Task 3: Short-Lived Companion Upload Handoffs

**Files:**
- Modify: `src/db/content/schema.ts`
- Create: `drizzle/content/0004_companion_upload_handoffs.sql`
- Create: `src/features/media/upload-handoff.ts`
- Create: `src/features/media/upload-handoff.test.ts`
- Create: `src/app/api/admin/podcasts/handoff/route.ts`
- Create: `src/app/api/admin/podcasts/handoff/route.test.ts`

**Interfaces:**
- Produces: `createUploadHandoff({ episodeId, adminUserId })`, `claimUploadRole({ secret, episodeId, role })`, and `completeUploadRole(...)`; ten-minute expiry; allowed roles `video|audio` plus matching `teaser`; hashed secret storage.

- [ ] **Step 1: Write failing tests** for creation, ten-minute expiry, hash-only persistence, correct episode/admin binding, one full role, one teaser role, role mismatch, replay rejection, cancellation, and concurrent duplicate claims.
- [ ] **Step 2: Run** `npm test -- src/features/media/upload-handoff.test.ts src/app/api/admin/podcasts/handoff/route.test.ts` and verify failure because the handoff does not exist.
- [ ] **Step 3: Implement** the schema, migration, service, and authenticated creation/status/revocation route; return the secret only once.
- [ ] **Step 4: Run the focused tests** and verify PASS.
- [ ] **Step 5: Commit** as `feat: issue companion media handoffs`.

### Task 4: Handoff-Aware Private Blob Upload

**Files:**
- Modify: `src/app/api/admin/podcasts/upload/route.ts`
- Modify: `src/features/media/upload.ts`
- Modify: `src/features/media/upload.test.ts`
- Create: `src/app/api/admin/podcasts/upload/route.test.ts`

**Interfaces:**
- Consumes: handoff claims from Task 3.
- Produces: upload authorization accepting either an authenticated web admin or a valid handoff secret, recording exactly one full object and one generated teaser for the bound episode.

- [ ] **Step 1: Write failing tests** for browser-admin upload, Companion full upload, Companion teaser upload, expired/reused/mismatched handoff, MIME mismatch, oversized file, duplicate callback, and callback completion state.
- [ ] **Step 2: Run** the focused route and policy tests and verify the Companion authorization cases fail.
- [ ] **Step 3: Implement** the minimal dual authorization path while retaining private Blob access and callback validation.
- [ ] **Step 4: Run the focused tests** and verify PASS.
- [ ] **Step 5: Commit** as `feat: accept companion episode uploads`.

### Task 5: Local FFmpeg Preview Generator

**Files:**
- Create: `companion/src/main/media-probe.ts`
- Create: `companion/src/main/media-probe.test.ts`
- Create: `companion/src/main/preview-generator.ts`
- Create: `companion/src/main/preview-generator.test.ts`
- Modify: `companion/src/shared/contracts.ts`

**Interfaces:**
- Produces: `probeMedia(path): Promise<MediaProbe>` and `generatePreview({ sourcePath, outputDirectory, onProgress }): Promise<GeneratedPreview>`; video MP4 H.264/AAC `+faststart`; audio derivative; NVENC-first with CPU fallback; duration `min(45, sourceDuration)`.

- [ ] **Step 1: Write failing tests** using generated fixture media for 45-second cutoff, short-source EOF, video/audio output, missing FFmpeg, unsupported input, NVENC failure fallback, progress, cancellation, source preservation, and temporary cleanup.
- [ ] **Step 2: Run** `npm test -- companion/src/main/media-probe.test.ts companion/src/main/preview-generator.test.ts` and verify failure because the services do not exist.
- [ ] **Step 3: Implement** process execution with argument arrays (never shell-built commands), FFprobe JSON parsing, NVENC capability detection, CPU fallback, and deterministic temporary paths.
- [ ] **Step 4: Run the focused tests** and inspect generated fixture duration with FFprobe; verify PASS and duration `<=45.1` seconds.
- [ ] **Step 5: Commit** as `feat: generate local episode previews`.

### Task 6: Companion Handoff, File Selection, and Two-Part Upload

**Files:**
- Modify: `companion/src/main/application.ts`
- Modify: `companion/src/main/application.test.ts`
- Create: `companion/src/main/media-upload-job.ts`
- Create: `companion/src/main/media-upload-job.test.ts`
- Modify: `companion/src/main/index.ts`
- Modify: `companion/src/preload/index.ts`
- Modify: `companion/src/shared/window-api.ts`
- Modify: `companion/src/renderer/app.ts`
- Modify: `companion/src/renderer/app.test.ts`
- Modify: `companion/src/renderer/styles.css`

**Interfaces:**
- Consumes: handoff URL/secret from Task 3, upload endpoint from Task 4, generator from Task 5.
- Produces: `liketac://prepare-upload` handling; one source picker; preparation/full/preview progress; cancel/retry; verified completion and cleanup.

- [ ] **Step 1: Write failing tests** for strict protocol parsing, no secret rendering/logging, one file selection, video/audio role pairing, generation progress, upload progress, cancel, retry, expired handoff, partial completion recovery, and temporary cleanup.
- [ ] **Step 2: Run** the Companion focused tests and verify failure because upload jobs are absent.
- [ ] **Step 3: Implement** the narrow IPC/API surface and media job; keep OBS controls independent and never start/stop OBS for an upload job.
- [ ] **Step 4: Run the focused Companion tests** and verify PASS.
- [ ] **Step 5: Commit** as `feat: upload episode with automatic preview`.

### Task 7: Admin Launch and Locked Fallback UX

**Files:**
- Modify: `src/app/admin/podcasts/page.tsx`
- Modify: `src/components/admin-media-upload.tsx`
- Modify: `src/components/admin-media-upload.test.tsx`
- Create: `src/components/companion-media-upload.tsx`
- Create: `src/components/companion-media-upload.test.tsx`
- Modify: `src/components/episode-card.tsx`
- Modify: `src/components/episode-card.test.tsx`
- Modify: `src/app/api/admin/podcasts/route.ts`

**Interfaces:**
- Consumes: handoff creation/status route and media availability.
- Produces: **Prepare and upload with Like TAC Companion**, full/preview readiness, direct-upload fallback explanation, and visitor locked card when teaser is absent.

- [ ] **Step 1: Write failing tests** for launch URL creation, handoff progress/status, no secret in visible copy, direct upload marked as locked fallback, publish with full-only media, protected visitor teaser CTA, and protected visitor locked CTA.
- [ ] **Step 2: Run the focused component/route tests** and verify the new workflow fails.
- [ ] **Step 3: Implement** the admin and catalog UI; remove the manual teaser role from ordinary upload choices and remove the publish-time requirement for a manually uploaded teaser.
- [ ] **Step 4: Run the focused tests** and verify PASS.
- [ ] **Step 5: Commit** as `feat: guide single-file podcast publishing`.

### Task 8: Help, Operations, and End-to-End Verification

**Files:**
- Modify: `src/components/help/admin-help.tsx`
- Modify: `src/components/help/subscriber-help.tsx`
- Modify: `docs/operations/companion.md`
- Modify: `docs/operations/deployment.md`
- Modify: `companion/RELEASE-CHECKLIST.md`
- Modify: `tests/e2e/catalog-and-player.spec.ts`
- Modify: `tests/e2e/admin-auth.spec.ts`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: documented recovery and complete browser-to-Companion-to-Blob acceptance evidence.

- [ ] **Step 1: Add failing end-to-end tests** for visitor landing → Start Here full playback, visitor protected preview/locked fallback, subscriber latest full playback/download, and admin handoff creation/status.
- [ ] **Step 2: Update Help and operations** with one-file preparation, no RunPod charge, FFmpeg requirements, expiry/retry, locked fallback, and cleanup behavior.
- [ ] **Step 3: Run** `npm test`, `npm run build`, Companion tests/build, and the relevant Playwright suites; all must PASS.
- [ ] **Step 4: Build the unsigned Companion installer** and manually verify a real 3:18 MP4 produces a playable first-45-second derivative, uploads both objects, and leaves the source unchanged.
- [ ] **Step 5: Verify production only after deployment**: inspect Vercel runtime errors/logs, Neon handoff/media rows, Blob sizes/types, visitor media-route denial, subscriber full playback, and landing-page destinations.
- [ ] **Step 6: Commit** as `test: verify automatic subscriber previews`.
