# Like TAC Production Website Design

## Intent

Like TAC at `liketac.live` is a podcast portal for people who want technical subjects explained in relaxed, simple language. The audience includes technical users who are new to a particular technology and nontechnical or beginner listeners learning subjects such as AI. Like TAC creates and publishes the podcast content; subscribers do not create podcasts.

The approved hook is **“Serious tech. For the rest of us.”** The visual direction uses dark Like TAC teal, energetic yellow, playful headlines, and readable light and dark modes. The tone is welcoming and clever, not corporate, stiff, or condescending.

## Visitor and Subscriber Experience

- Visitors may play the current episode, the designated Start Here episode, and the designated New Episode without an account.
- Visitors may browse the full catalog by subject and publication date.
- Locked archive cards show a muted 45-second looping video teaser with a separate mute/unmute control.
- Clicking a locked teaser or Watch Full Episode sends the visitor to the free signup page.
- The signup page also prominently offers Sign In for an existing subscriber.
- Successful signup or sign-in returns the listener to the episode they selected.
- Subscribers may play full archive episodes and download available audio or video.
- The media player provides play/pause, volume, captions when supplied, progress, and full screen. Escape exits full screen.
- Cancelled or disabled subscribers return to visitor access but may still browse the catalog.
- New empty podcast categories remain visible with a branded Coming Soon message.

## Subscriber Accounts

Signup fields are first name, last name, optional pronouns, email, username, password, password confirmation, and an unchecked communication-consent checkbox. Email and username are unique. Consent time, source, policy version, and revocation time are retained.

Passwords require at least eight characters, one uppercase letter, one lowercase letter, one number, and at least one of `! @ * #`. The interface recommends twelve or more characters. Passwords and password history are never stored or emailed in readable form. Parameterized queries prevent special characters from changing SQL meaning.

Forgot Username sends the username to the verified email while the webpage returns a generic response. Forgot Password sends a short-lived reset link and one-time temporary password to the verified email. The email spells out every step, expiration, one-time use, and password rule. The reset page requires the temporary password, a new password, and confirmation. The new password cannot match the previous five password hashes. A successful reset invalidates existing sessions.

## Administrator

There is one initial admin role. Only an authenticated admin may upload, edit, categorize, publish, unpublish, or remove podcast content; manage subscriber access and consent state; manage categories; and edit the private admin profile.

The private admin profile includes name, address, phone, email, pronouns, and username. Its security email is `jjanson10@gmail.com`. Sensitive profile changes require recent password confirmation and send a security notification.

Admin authentication and recovery are separate from subscriber recovery. After a correct admin username and password, the site emails a random six-digit MFA code to the profile email. The Like TAC modal accepts the code, supports resend, expires codes after ten minutes, invalidates prior codes, rate-limits attempts, and offers Trust This Private Device for 30 Days. After 30 days, the next login requires MFA. Admin actions produce an audit trail.

No password supplied during design conversations will be committed, deployed, or stored. The production admin bootstrap secret is generated and stored only as a deployment secret; first login forces a replacement meeting the policy.

## Help

There is one Help button. Logged-out visitors and subscribers receive listener Help: navigation, streaming, download locations, common MP3/MP4 players, captions/transcripts, account recovery, and light/dark display help. Admin sessions receive protected Help: uploading and publishing, drafts, teaser and caption requirements, category creation and Coming Soon behavior, subscriber management, profile/security, audit history, and infrastructure boundaries.

Vercel manages deployments, domain settings, environment variables, logs, observability, and rollback. Subscriber records are managed in the protected Like TAC dashboard and stored in Neon; they are not managed as Vercel users.

## Data and Media Architecture

- `like-tac-identity`: Neon Postgres database for subscriber/admin identities, profiles, credentials, password history, consent records, sessions, reset/MFA challenges, trusted devices, and security audit records.
- `like-tac-content`: separate Neon Postgres database for podcast metadata, subjects, episode variants, publication state, access rules, teaser references, captions/transcripts, and content audit records.
- Large audio, video, teaser, caption, and transcript objects live in Vercel Blob (or an equivalent Vercel-connected object store), not inside Neon.
- Private full episodes use time-limited authorized download/stream URLs. Public/current episodes and teaser delivery follow explicit access flags.
- Database migrations are committed; secrets and connection strings are Vercel environment variables and never enter Git.

## Production Platform

- GitHub repository owned by the user and connected to one Vercel project.
- Next.js with TypeScript on Vercel for server-rendered pages, route handlers, protected actions, and responsive client interactions.
- `liketac.live` and `www.liketac.live` point to the production deployment with one canonical redirect.
- Preview deployments use separate preview environment variables and non-production data where practical.
- Email delivery uses a transactional provider configured through Vercel secrets; provider selection and verified sending domain must be completed before real recovery or MFA email is enabled.

## Safety and Quality Gates

- No demo credentials, placeholder passwords, or personal profile data are committed.
- Passwords use an adaptive password hash and constant-time verification.
- Sessions use secure, HTTP-only, same-site cookies with rotation and revocation.
- Signup, login, recovery, MFA, upload, and download authorization are rate-limited and tested.
- Every server mutation validates authorization; hiding a button is never the authorization boundary.
- Uploads validate MIME type, size, ownership, and safe object keys.
- Deletes are recoverable soft deletes until an explicit retention purge.
- Light/dark contrast, keyboard navigation, labels, focus behavior, mobile layouts, and full-screen exit are verified.
- Production is not declared complete until repository sync, database migrations, Vercel deployment, domain attachment, and live smoke tests all pass.

## Non-Goals for the First Production Release

- Paid subscriptions or billing.
- Subscriber comments or public profiles.
- Subscriber-created podcasts.
- Live broadcasting.
- Native mobile applications.

