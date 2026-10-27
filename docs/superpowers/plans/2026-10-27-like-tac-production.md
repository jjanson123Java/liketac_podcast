# Like TAC Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, secure, version, and deploy the approved Like TAC podcast portal to Vercel at `liketac.live`, with two Neon databases and object storage for podcast media.

**Architecture:** A Next.js TypeScript application owns all browser pages and server routes. Identity/security state and podcast metadata use separate Neon Postgres databases; large media uses Vercel Blob with authorized delivery. GitHub is the source of truth and Vercel deploys from the repository.

**Tech Stack:** Next.js, TypeScript, React, Vitest, Playwright, Drizzle ORM, Neon Postgres, Vercel Blob, transactional email provider, GitHub, Vercel

**Spec:** `docs/superpowers/specs/2026-10-27-like-tac-production-design.md`

## Global Constraints

- Preserve the approved Like TAC teal/yellow branding, light/dark accessibility, and hook “Serious tech. For the rest of us.”
- Like TAC creates podcasts; subscribers only browse, play, and download.
- No credentials or connection strings may be committed.
- Full media files live in object storage, not Neon.
- Use two separate Neon databases: `like-tac-identity` and `like-tac-content`.
- Do not deploy demo authentication as production security.
- Treat delete operations as recoverable soft deletes in the first release.

## Review Focus

- Duplicate email/username registration must return a safe useful error without exposing account details.
- A disabled, cancelled, or signed-out account must never receive a private full-media URL.
- Expired/reused MFA and password-reset challenges must fail generically and remain rate-limited.
- Uploads with misleading extensions, invalid MIME types, oversized payloads, or unsafe object keys must be rejected.
- Light/dark mode, keyboard focus, modal/full-screen Escape behavior, and mobile navigation must remain usable.

---

### Task 1: Production Application Foundation

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/site-header.tsx`, `src/components/theme-toggle.tsx`, `src/styles/globals.css`
- Create: `public/brand/liketac-logo.png`
- Test: `src/app/page.test.tsx`, `tests/e2e/public-navigation.spec.ts`

**Interfaces:**
- Consumes: approved static prototype in `prototype/`
- Produces: route structure, shared theme tokens, `SiteHeader`, and public landing page used by all later tasks

- [ ] Write failing component and Playwright tests for the approved hook, public navigation, light/dark mode, mobile menu, and absence of “Start a Podcast.”
- [ ] Run `npm test -- src/app/page.test.tsx` and `npm run test:e2e -- tests/e2e/public-navigation.spec.ts`; expect failures before the app exists.
- [ ] Scaffold the minimal Next.js TypeScript app and migrate the approved prototype into focused components without copying demo-session behavior.
- [ ] Run the focused tests and `npm run build`; expect all to pass.
- [ ] Commit with `feat: create Like TAC production foundation`.

### Task 2: Database Boundaries and Migrations

**Files:**
- Create: `src/db/identity/client.ts`, `src/db/identity/schema.ts`, `src/db/content/client.ts`, `src/db/content/schema.ts`
- Create: `drizzle.identity.config.ts`, `drizzle.content.config.ts`, `migrations/identity/*`, `migrations/content/*`
- Test: `src/db/identity/schema.test.ts`, `src/db/content/schema.test.ts`

**Interfaces:**
- Consumes: `IDENTITY_DATABASE_URL`, `CONTENT_DATABASE_URL`
- Produces: `identityDb`, `contentDb`, identity tables, podcast/category tables, and committed migrations

- [ ] Write schema tests for unique usernames/emails, consent history, five password-history positions, MFA/reset expiry, audit records, categories, episodes, access flags, media variants, and soft-delete fields.
- [ ] Run the database tests; expect failures because schemas do not exist.
- [ ] Implement separate Drizzle clients and schemas with no cross-database foreign keys.
- [ ] Generate migrations and run tests against isolated test branches/databases.
- [ ] Commit with `feat: add identity and content database schemas`.

### Task 3: Subscriber Signup, Login, Sessions, and Recovery

**Files:**
- Create: `src/features/auth/password-policy.ts`, `password-hash.ts`, `session.ts`, `rate-limit.ts`
- Create: `src/app/signup/page.tsx`, `src/app/sign-in/page.tsx`, `src/app/account/forgot-username/page.tsx`, `src/app/account/reset/page.tsx`
- Create: `src/app/api/auth/*/route.ts`, `src/features/email/templates/subscriber-recovery.ts`
- Test: `src/features/auth/*.test.ts`, `tests/e2e/subscriber-auth.spec.ts`

**Interfaces:**
- Consumes: `identityDb`, transactional `sendEmail()` adapter
- Produces: `requireSubscriber()`, `getSession()`, signup/login/logout/recovery routes, and revocable secure sessions

- [ ] Write failing tests for password rules, parameterized special characters, generic recovery responses, one-time expiry, previous-five rejection, session rotation, disabled accounts, and rate limits.
- [ ] Implement adaptive hashing, constant-time verification, HTTP-only session cookies, consent capture, recovery challenges, and complete recovery email instructions.
- [ ] Run auth unit/integration tests and the subscriber browser journey.
- [ ] Commit with `feat: add secure subscriber authentication`.

### Task 4: Admin Authentication, MFA, Profile, and Audit

**Files:**
- Create: `src/features/admin/authorization.ts`, `mfa.ts`, `trusted-device.ts`, `audit.ts`
- Create: `src/app/admin/sign-in/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/profile/page.tsx`
- Create: `src/app/api/admin/*/route.ts`, `src/features/email/templates/admin-mfa.ts`
- Test: `src/features/admin/*.test.ts`, `tests/e2e/admin-auth.spec.ts`

**Interfaces:**
- Consumes: identity security tables and `sendEmail()`
- Produces: `requireAdmin()`, six-digit MFA, 30-day trusted-device token, protected admin shell, profile editor, audit events

- [ ] Write failing tests for admin-only authorization, six-digit codes, ten-minute expiry, newest-code-only behavior, resend/attempt limits, 30-day trust expiry, separate recovery, and sensitive profile changes.
- [ ] Implement admin password bootstrap from deployment secrets with forced first-login replacement; never use the conversation password.
- [ ] Implement the branded MFA modal, admin profile, security notifications, and audit trail.
- [ ] Run admin tests and browser journey; commit with `feat: add protected admin access`.

### Task 5: Catalog, Player, Gating, and Downloads

**Files:**
- Create: `src/app/shows/page.tsx`, `src/app/shows/[slug]/page.tsx`, `src/components/media-player.tsx`, `src/components/episode-card.tsx`
- Create: `src/features/media/access.ts`, `src/app/api/media/[id]/route.ts`
- Test: `src/features/media/access.test.ts`, `tests/e2e/catalog-and-player.spec.ts`

**Interfaces:**
- Consumes: `contentDb`, `getSession()`, private/public Blob references
- Produces: subject/date catalog, 45-second teaser behavior, accessible player, authorized short-lived stream/download responses

- [ ] Write failing tests for free/current access, teaser gating, signup return target, disabled-member denial, signed URL expiry, audio/video download, captions, full screen, and Escape exit.
- [ ] Implement catalog search/filter/sort, Coming Soon categories, gated cards, and the media player.
- [ ] Run media tests and browser journeys; commit with `feat: add gated podcast catalog and player`.

### Task 6: Admin Podcast and Category Management

**Files:**
- Create: `src/app/admin/podcasts/*`, `src/app/admin/categories/*`, `src/app/api/admin/podcasts/*`, `src/app/api/admin/categories/*`
- Create: `src/features/media/upload.ts`
- Test: `src/features/media/upload.test.ts`, `tests/e2e/admin-content.spec.ts`

**Interfaces:**
- Consumes: `requireAdmin()`, `contentDb`, Blob server client
- Produces: draft/publish workflow, validated uploads, category ordering, access flags, captions/transcripts, soft-delete/restore, audit records

- [ ] Write failing tests for authorization, MIME/size/key validation, draft preview, teaser requirements, publish/unpublish, empty categories, soft deletion, and audit logging.
- [ ] Implement admin content forms and direct-to-Blob upload flow using server-issued authorization.
- [ ] Run upload/content tests; commit with `feat: add admin podcast management`.

### Task 7: Role-Aware Help and Policy Pages

**Files:**
- Create: `src/app/help/page.tsx`, `src/components/help/subscriber-help.tsx`, `src/components/help/admin-help.tsx`
- Create: `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`
- Test: `src/app/help/page.test.tsx`, `tests/e2e/help-routing.spec.ts`

**Interfaces:**
- Consumes: `getSession()` and approved help content
- Produces: one Help route with visitor/subscriber or admin content and initial policy pages

- [ ] Write failing tests for role-based Help, listener downloads/playback apps, admin podcast/category/subscriber guidance, and accurate Vercel/Neon boundaries.
- [ ] Implement accessible help navigation and policy outlines reviewed for the actual data flows.
- [ ] Run tests; commit with `feat: add role-aware help and policies`.

### Task 8: Repository, Vercel, Neon, Blob, Email, and Domain

**Files:**
- Create: `.env.example`, `vercel.json` only if required, `docs/operations/deployment.md`, `docs/operations/recovery.md`
- Modify: `README.md`
- Test: `tests/smoke/production.spec.ts`

**Interfaces:**
- Consumes: verified production build, GitHub credentials, Vercel account, Neon integrations, Blob store, email provider, domain ownership
- Produces: GitHub repository, Vercel project linked to Git, two Neon databases, Blob store, environment variables, migrations, `liketac.live`, runbooks

- [ ] Run secret scanning, full unit/integration/e2e suite, and production build; stop on any failure.
- [ ] Create the GitHub repository, push the reviewed source, and attach the repository to the Vercel project.
- [ ] Provision two Neon databases and Blob; record only non-secret resource names in documentation and inject secrets through Vercel environment variables.
- [ ] Configure and verify the transactional email sending domain before enabling real MFA/recovery.
- [ ] Apply production migrations, create the forced-change admin bootstrap secret, and deploy a preview.
- [ ] Verify preview signup, login, admin MFA, upload, teaser, full playback, download, Help, light/dark mode, and mobile behavior.
- [ ] Attach `liketac.live`, configure the canonical `www` redirect, verify DNS/TLS, then promote the verified deployment.
- [ ] Run `tests/smoke/production.spec.ts` against the literal production URL and document Passed/Failed/Not tested results.
- [ ] Commit operational documentation with `docs: add Like TAC deployment runbook`.

## Self-Review Result

- Spec coverage: all approved public, subscriber, admin, media, Help, infrastructure, and domain requirements map to Tasks 1–8.
- Type consistency: database clients, session guards, email adapter, media authorization, and admin guards are defined before consumers.
- Review focus: each listed failure mode has an owning task and explicit test requirement.
- Proportion: implementation bodies are intentionally omitted; exact boundaries, files, interfaces, tests, and verification gates are specified.

