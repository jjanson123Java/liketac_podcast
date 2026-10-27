# Like TAC deployment runbook

## Production resources

- GitHub: `jjanson123Java/liketac_podcast`
- Vercel team/project: `like-tac/liketac-podcast`
- Vercel project ID: `prj_OoDepa84M97laJA0l0A9jQySeUM6`
- Identity Neon resource: `like-tac-identity` (`store_lqrpszFQ4uUSEPSZ`)
- Content Neon resource: `like-tac-content` (`store_fPx07Ue7n7DUQrZN`)
- Private Blob store: `like-tac-podcasts` (`store_6PItXXoc1Tq5dInZ`)
- Transactional email resource: `like-tac-email` (`ir_n9QQYFafyCcU8zmg`)
- Canonical domain: `liketac.live`; `www.liketac.live` redirects to the canonical host

Only resource names and IDs belong in source control. Secrets remain in Vercel environment variables.

## Required environment keys

`IDENTITY_DATABASE_URL`, `CONTENT_DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_USERNAME`, `ADMIN_SECURITY_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, and `NEXT_PUBLIC_SITE_URL`.

## Release sequence

1. Confirm the intended Vercel target with `vercel project inspect --non-interactive`.
2. Run `npm ci`, `npm test`, `npm run test:e2e`, `npm run build`, and `npm audit --omit=dev`.
3. Pull environment variables without printing values.
4. Apply identity and content migrations separately.
5. Run the idempotent administrator bootstrap and content seed scripts.
6. Deploy a preview and verify visitor, subscriber, administrator, media, Help, mobile, and theme journeys.
7. Stage a production deployment without assigning domains, repeat smoke tests, then promote that exact deployment.
8. Verify `liketac.live`, `www` redirect, DNS, TLS, and recent Vercel error logs.

## Database commands

```bash
npm run db:migrate:identity
npm run db:migrate:content
npm run db:bootstrap-admin
npm run db:seed-content
```

Drizzle does not automatically read `.env.local`; load the environment into the process before running these commands.

## Content operations

Full audio/video, teasers, captions, and transcripts are private Blob objects. Neon stores only catalog/security metadata and object paths. Subscriber-only archive episodes cannot publish without full media and a teaser.
