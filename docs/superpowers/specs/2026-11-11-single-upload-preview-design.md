# Single-Upload Subscriber Preview Design

## Intent

Make the first action on `liketac.live` obvious for both new visitors and returning subscribers while keeping subscriber recordings protected. An administrator selects one completed episode file. Like TAC Companion creates the first 45 seconds locally with FFmpeg and uploads the full recording plus its protected preview as one guided operation. RunPod and its A40 GPU are not used.

## Listener behavior

- A signed-out visitor sees **Start Here — Watch Free** as the landing-page primary action and **Browse All Shows** as the secondary action.
- A signed-in subscriber sees **Play Latest Episode** as the landing-page primary action and **Browse All Shows** as the secondary action.
- Start Here episodes and episodes explicitly marked public play in full without signing in.
- Marking an episode Current/New does not make it public.
- Every protected episode remains visible in the catalog. A visitor can play its generated 45-second preview and is then invited to subscribe free or sign in.
- If a protected episode was uploaded directly through the website and has no preview, visitors see branded locked artwork and **Subscribe Free to Watch**; the full Blob object is never exposed to them.
- Signed-in subscribers can play and download the full recording.

## Administrator behavior

- The existing website upload remains available as a full-media-only fallback.
- The preferred admin action is **Prepare and upload with Like TAC Companion**.
- The website creates a short-lived, single-episode handoff and opens Companion through the existing `liketac://` protocol without placing an OBS password or permanent Blob credential in the URL.
- Companion prompts for one completed audio or video file, validates it, and extracts the first `00:45` locally. The Like TAC opening reel is therefore included.
- Companion uploads the original as full media and the generated derivative as the teaser while showing separate preparation and upload progress.
- The handoff expires, is bound to the administrator and episode, accepts only one full-media role plus one matching teaser role, and becomes unusable when completed or revoked.
- A protected episode may be published without a teaser only through the direct-upload fallback, but visitors see it locked until a generated teaser exists.

## Local preview generation

- Use the installed FFmpeg/FFprobe tools; never call RunPod.
- For video, output browser-compatible H.264/AAC MP4 with `+faststart`, using local NVENC when available and CPU H.264 as a fallback.
- For audio, output a browser-compatible 45-second audio derivative.
- Never overwrite the source recording. Temporary derivatives live in a Companion-managed temporary directory and are removed after verified upload or explicit cancellation.
- Reject files shorter than one second, unsupported formats, missing FFmpeg, expired handoffs, and mismatched episode jobs with a clear recovery message.

## Security and data boundaries

- Full and preview media remain private Vercel Blob objects; Neon stores metadata and handoff state only.
- Non-subscribers never receive the full protected object URL or a route capable of streaming it.
- Companion receives only a short-lived one-time handoff secret, not database credentials, `BLOB_READ_WRITE_TOKEN`, web session cookies, or the OBS WebSocket password.
- Audit creation, completion, expiry, cancellation, and rejected reuse of a handoff.

## Acceptance

- One admin file selection produces one full media record and one 45-second preview record without RunPod usage.
- A visitor can fully play Start Here, preview protected episodes for no more than 45 seconds, and cannot request protected full media.
- A subscriber lands on the latest playable subscriber episode and can play/download it completely.
- Direct website uploads remain usable and safely locked for visitors when no preview exists.
