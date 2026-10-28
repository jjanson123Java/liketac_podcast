# Like TAC Podcast Portal

Production Next.js portal for [liketac.live](https://liketac.live): relaxed, plain-language technical podcasts for beginners and experienced listeners learning a new technology.

## Podcast opening reel

The approved seven-second Like TAC opener and all editable components live in
`public/media/podcast-opener/`. The bundle contains the composed MP4, a visual-only MP4, the original
WAV soundtrack, the closing Like TAC visual, provenance documentation, and regeneration instructions.

Regenerate the reel after editing `scripts/create-podcast-opener.mjs` or replacing a component:

```powershell
node scripts/create-podcast-opener.mjs
```

The Browse Shows page uses the composed reel wherever a subject or listed episode is waiting for its
finished recording. Replace that placeholder with the finished `intro + podcast + credits` media when
the episode is published.

Catalog previews have no native player controls. They begin muted and cycle through the 7-second opener,
a 3-second excerpt at `0:17`, and a 3-second excerpt at `0:27`. After that single cycle, the preview
returns to `0:00`, shows the opening frame, and stops to avoid continuous bandwidth use. The catalog
offers only Mute/Unmute, honors reduced-motion preferences, supports audio-only previews with branded
artwork, and uses teaser media for protected archive episodes. Opening an episode provides the normal
media controls.

## Features

- Free visitor access to Start Here and the current New Episode
- Subject/date catalog with 45-second teasers for the member archive
- Free subscriber accounts with playback and downloads
- Username recovery, password reset instructions, suggested passwords by email, and five-password history
- Separate administrator login with emailed MFA and optional 30-day trusted devices
- Administrator category, episode, upload, publish, unpublish, and recoverable-delete workflows
- Private Vercel Blob media storage
- Separate Neon identity/security and content/metadata databases
- Role-aware Help, accessible light/dark themes, and responsive navigation

## Local verification

```bash
npm install
npm test
npm run build
npm run test:e2e
```

Copy `.env.example` to `.env.local` only for local development. Never commit connection strings, email keys, Blob tokens, bootstrap credentials, or downloaded Vercel environment files.

## Deployment

See [deployment.md](docs/operations/deployment.md) and [recovery.md](docs/operations/recovery.md).
