# Like TAC Frontend Refresh Implementation Plan

**Goal:** Apply the approved teal, yellow, editorial mockup to the existing public portal and administrator workspace.

**Architecture:** Keep all authentication, data queries, forms, media components and routes. Add an administrator presentation shell and a separate visual stylesheet. Keep the existing catchphrase and copy.

**Tech stack:** Existing Next.js, React, TypeScript, CSS. No added dependencies.

## Global constraints
- Preserve “Serious tech. For the rest of us.” and existing site context.
- No backend, API, database, authorization or media-playback behavior changes.
- Preserve the password visibility controls and light/dark themes.
- Responsive public and admin screens with visible keyboard focus and reduced-motion support.

## Review focus
- Narrow mobile viewports must not hide controls or overflow forms.
- Native video controls, preview timing and full-screen behavior must remain unchanged.
- Admin form actions and input names must be identical before and after.
- Sidebar navigation must indicate the current destination without duplicate accessible names in existing tests.
- No fabricated dashboard metrics, no episode artwork replacing actual video previews.

## Tasks
- [ ] Add the public visual stylesheet and editorial hero cover; preserve the existing homepage text and destinations.
- [ ] Add an admin navigation shell to overview, episodes, subjects, profile and studio pages; preserve existing session checks and form bodies.
- [ ] Verify source diff, run the existing tests and production build, inspect responsive public/admin views, and deploy the checked change.

## Execution notes
User approved the displayed direction and extended it to the admin area. The implementation is performed inline. Network access for installing existing dependencies has been requested twice but both tool calls were interrupted; do not claim tests passed until they actually run.

Ruling: existing production build logs show Electron and obs-websocket-js module errors from the separate Companion application. Exclude companion from website TypeScript and Vitest discovery; its own build and tests remain separate and unchanged.
