# Like TAC Companion Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the secure phase-one Like TAC Companion Windows application and protected website launch page for controlling the administrator's local OBS recording session.

**Architecture:** A standalone Electron application lives under `companion/`; its sandboxed renderer calls a narrow preload API, while the main process owns encrypted credentials and the `obs-websocket-js` connection to loopback OBS. The existing Next.js application adds only a protected launch/help page using the `liketac://recording` protocol and never handles OBS credentials.

**Tech Stack:** Electron, TypeScript, `obs-websocket-js`, Vitest, plain HTML/CSS renderer, Next.js App Router

**Spec:** `docs/superpowers/specs/2026-10-28-like-tac-companion-foundation.md`

## Global Constraints

- Use **Like TAC Companion** consistently; do not use the former Windows Companion name.
- OBS host defaults to and remains restricted to `127.0.0.1`; port defaults to `4455`; authentication is mandatory.
- Store the OBS password only through Electron `safeStorage`; never log, render after save, send to Vercel, or commit it.
- Keep `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`.
- Companion indicators must never become OBS sources or appear in recorded output.
- Do not represent out-of-scope features as working.
- Read relevant Next.js guidance from `node_modules/next/dist/docs/` before changing website pages.

## Review Focus

- A malicious `liketac://` URL must not reach arbitrary renderer navigation or OBS requests; Task 3 tests the exact-action allowlist.
- A dropped OBS connection during recording must not reset the UI to an idle lie or automatically restart recording; Task 2 tests event reconciliation.
- A close request during active recording must preserve the recording unless the administrator explicitly confirms Stop Recording; Task 3 tests both choices.
- A missing approved scene must disable only that scene and explain the missing OBS configuration; Task 4 tests partial scene availability.
- A compromised renderer must not retrieve the saved plaintext password or issue arbitrary OBS requests; Tasks 1 and 3 test the narrow bridges.

---

### Task 1: Companion Core State and Security Boundaries

**Files:**
- Create: `companion/package.json`
- Create: `companion/tsconfig.json`
- Create: `companion/src/shared/contracts.ts`
- Create: `companion/src/main/connection-config.ts`
- Create: `companion/src/main/credential-store.ts`
- Test: `companion/src/main/connection-config.test.ts`
- Test: `companion/src/main/credential-store.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `OBSConnectionConfig`, `CompanionStatus`, `ApprovedScene`, `validateConnectionConfig(input)`, and `CredentialStore` with `save(password)`, `load()`, and `clear()`.
- Consumes: Electron `safeStorage` through an injected encryption interface so tests never need Electron.

- [ ] Write failing tests proving only loopback host and ports 1-65535 are accepted, authentication cannot be blank, encrypted storage never writes plaintext, and load fails closed when encryption is unavailable.
- [ ] Run `npm test -- companion/src/main/connection-config.test.ts companion/src/main/credential-store.test.ts` and verify failures are caused by missing production modules.
- [ ] Add the companion package, typed contracts, validators, credential store, and ignore rules with the minimum implementation needed for the tests.
- [ ] Run the focused tests and the root `npm test`; expect all tests green.
- [ ] Commit as `feat: add secure Like TAC Companion core`.

### Task 2: OBS Adapter and Recording State Reconciliation

**Files:**
- Create: `companion/src/main/obs-client.ts`
- Create: `companion/src/main/companion-controller.ts`
- Test: `companion/src/main/obs-client.test.ts`
- Test: `companion/src/main/companion-controller.test.ts`

**Interfaces:**
- Consumes: `OBSConnectionConfig`, `CompanionStatus`, and `ApprovedScene` from Task 1.
- Produces: `OBSClient` with `connect`, `disconnect`, `getSnapshot`, `setProgramScene`, `startRecord`, `stopRecord`, and event subscription; `CompanionController` with reconciled status and bounded reconnect behavior.

- [ ] Write failing adapter/controller tests for successful connection, wrong password, unavailable OBS, scene discovery, approved scene switching, duplicate start, confirmed stop, dropped connection while recording, reconnect without automatic recording, and bounded retry.
- [ ] Run the focused tests and verify expected missing-module failures.
- [ ] Implement the typed `obs-websocket-js` adapter and controller with injected timers and client factory.
- [ ] Run focused tests and the root suite; expect green.
- [ ] Commit as `feat: control OBS from Like TAC Companion`.

### Task 3: Sandboxed Electron Application and Windows Protocol

**Files:**
- Create: `companion/src/main/index.ts`
- Create: `companion/src/main/protocol.ts`
- Create: `companion/src/preload/index.ts`
- Create: `companion/src/shared/window-api.ts`
- Create: `companion/electron-builder.yml`
- Test: `companion/src/main/protocol.test.ts`
- Test: `companion/src/preload/index.test.ts`
- Modify: `companion/package.json`

**Interfaces:**
- Consumes: `CompanionController` and `CredentialStore` from Tasks 1-2.
- Produces: registered `liketac://` protocol handling that accepts only `liketac://recording`; `window.likeTacCompanion` narrow API for connect, status, approved scene selection, record start/stop, full-screen, and close decision.

- [ ] Write failing tests proving exact protocol allowlisting, blocked external navigation/new windows, bridge method allowlisting, no credential-read method, and safe close behavior during active recording.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement hardened BrowserWindow, single-instance protocol handling, preload bridge, packaging configuration, and explicit close choices.
- [ ] Run focused tests and the root suite; expect green.
- [ ] Commit as `feat: package secure Like TAC Companion shell`.

### Task 4: Branded Companion Recording Workspace

**Files:**
- Create: `companion/src/renderer/index.html`
- Create: `companion/src/renderer/styles.css`
- Create: `companion/src/renderer/app.ts`
- Test: `companion/src/renderer/app.test.ts`

**Interfaces:**
- Consumes: `window.likeTacCompanion` from Task 3 and status/contracts from Task 1.
- Produces: accessible branded UI for connection, diagnostics, approved scenes, Start Live Recording, confirmed Stop, disabled Test Recording explanation, LIVE timer, pulse, missing-scene notices, reconnect, and full-screen.

- [ ] Write failing DOM tests for disconnected/auth-failed/connected states, partial scene availability, actual recording-state controls, LIVE timer/pulse, disabled Test Recording copy, full-screen control, and no secret echo.
- [ ] Run the renderer test and verify it fails for missing UI.
- [ ] Implement the minimum accessible renderer and Like TAC styling.
- [ ] Run the focused test, root suite, companion build, and a static security scan for remote renderer URLs; expect green and no remote content.
- [ ] Commit as `feat: add Like TAC Companion recording workspace`.

### Task 5: Protected Website Launcher and Operator Documentation

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/app/admin/recording/page.tsx`
- Create: `src/app/admin/recording/page.test.tsx`
- Modify: `src/components/help/admin-help.tsx`
- Modify: `src/app/help/page.test.tsx`
- Create: `docs/operations/companion.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `liketac://recording` registered by Task 3.
- Produces: admin-only navigation and launch/help content; install, configure, backup, connect, troubleshoot, and restore documentation.

- [ ] Read the current Next.js App Router page/navigation documentation under `node_modules/next/dist/docs/`.
- [ ] Write failing tests proving the admin dashboard links to Recording Studio, the launcher uses exactly `liketac://recording`, the page states local-only security boundaries and required OBS names, and admin Help uses the approved Companion name.
- [ ] Run focused tests and verify expected missing-content failures.
- [ ] Implement the protected page, dashboard/help links, and operator documentation without exposing a public or subscriber launcher.
- [ ] Run focused tests, `npm test`, `npm run build`, and companion tests/build; expect green.
- [ ] Commit as `feat: integrate Like TAC Companion launcher`.

### Task 6: End-to-End Verification and Release Artifact Check

**Files:**
- Create: `companion/tests/controller-flow.test.ts`
- Create: `companion/RELEASE-CHECKLIST.md`

**Interfaces:**
- Consumes: all phase-one interfaces.
- Produces: mocked end-to-end controller proof and a manual Windows acceptance checklist for real OBS 33, `LikeTACLive`, and `LikeTACLive Studio`.

- [ ] Write the failing controller-flow test covering connect, snapshot, scene change, start, live event, stop confirmation, stop event, disconnect, and reconnect.
- [ ] Run it and verify the first missing integration behavior.
- [ ] Complete integration wiring and document manual checks including installer/protocol registration, password persistence, real scene switching, recording output, close-during-recording, firewall boundary, and uninstall.
- [ ] Run all website and Companion tests/builds and build the unsigned Windows installer locally; record exact results without claiming code signing.
- [ ] Commit as `test: verify Like TAC Companion foundation`.

