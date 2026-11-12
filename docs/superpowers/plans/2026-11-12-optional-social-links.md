# Optional Social Links Implementation Plan

**Spec:** `docs/superpowers/specs/2026-11-12-optional-social-links-design.md`

## Task 1: Typed social-link rendering

1. Add a failing component test proving valid configured links render, blank entries are omitted, and unsafe protocols are omitted.
2. Run the focused test and confirm the expected missing-module failure.
3. Add the typed empty-by-default configuration and `SocialLinks` component.
4. Run the focused test and confirm it passes.

## Task 2: Footer integration and responsive layout

1. Add a failing layout-level source test for the branded footer group and social-link component.
2. Integrate `SocialLinks` in the root layout.
3. Add wrapping desktop styles and stacked mobile styles.
4. Run the focused tests.

## Task 3: Adopter guide

1. Update the version and discovery questions in `Make_A_Podcast.md`.
2. Document that each platform is optional and blank answers are not rendered.
3. Require verified full URLs and prohibit invented placeholders.
4. Verify the guide contains the supported services and behavior.

## Verification

- Run the complete Vitest suite.
- Run the production build.
- Inspect the diff and confirm the default configuration contains no social URLs.
- Do not deploy, merge, or push a production branch.
