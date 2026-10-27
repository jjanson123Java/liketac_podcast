# Like TAC Podcast Portal

Production Next.js portal for [liketac.live](https://liketac.live): relaxed, plain-language technical podcasts for beginners and experienced listeners learning a new technology.

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
