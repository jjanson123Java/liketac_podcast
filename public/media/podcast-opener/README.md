# Like TAC podcast opening reel

This folder is the editable source bundle for the approved seven-second Like TAC podcast opener.

## Ready-to-use reel

- `like-tac-podcast-opener.mp4` — the complete 1920×1080 reel with stereo audio. Use this at the beginning of each finished podcast.

## Separate components

- `visual/like-tac-podcast-opener-visual-only.mp4` — the complete animation without audio.
- `visual/liketac-banner-hd.png` — the Like TAC visual used in the closing shot.
- `audio/like-tac-podcast-opener-original.wav` — the lossless 48 kHz stereo soundtrack.
- `../../../scripts/create-podcast-opener.mjs` — the editable animation, wording, timing, colors, and synthesized-audio source.
- `ORIGINAL-CONTENT-NOTICE.md` — provenance and commercial-use record.

## Rebuild after an edit

Install FFmpeg, then run this command from the repository root:

```powershell
node scripts/create-podcast-opener.mjs
```

The command regenerates the composed MP4, visual-only MP4, and WAV in place. Replace the banner PNG before rebuilding if the closing artwork changes. Edit the script to change wording, colors, timing, motion, or sound synthesis.

## Planned finished-podcast structure

1. This Like TAC opening reel
2. The full subject podcast
3. A Like TAC credits reel

Until a subject podcast is produced, the Browse Shows page uses the complete opening reel as its clearly labeled placeholder.
