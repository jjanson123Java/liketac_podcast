# Like TAC Companion operations

Like TAC Companion is installed on the administrator's Windows recording computer. It is not hosted by Vercel and its OBS password must never be copied into Vercel, Neon, GitHub, or support messages.

## Required local configuration

- OBS Studio 33 or newer in the standard 64-bit installation directory
- Profile `LikeTACLive`
- Scene collection `LikeTACLive Studio`
- WebSocket server at `127.0.0.1:4455` with authentication
- Approved scenes `00 - Standby`, `10 - Host Only`, `50 - Host Presentation`, and `70 - Audio Only`

## Launch

Sign in as the administrator at `liketac.live`, open **Admin Dashboard → Recording Studio**, and select **Launch Like TAC Companion**. The `liketac://recording` action opens the local application. If OBS is not running, Companion starts it with the required profile, collection, and Standby scene; it never starts recording automatically.

## Readiness

Before recording, confirm the required profile and collection, microphone level, camera previews, presentation preview, and Like TAC media previews. Disconnected devices remain disabled. A missing media path can be repaired from the bundled assets only after explicit confirmation.

## One-file episode upload

From **Admin Dashboard → Podcast Content**, select **Prepare and upload with Like TAC Companion** for the intended draft. The website creates a hashed, one-time handoff that expires after ten minutes; no Blob, Neon, web-session, or OBS credential is sent to Companion.

Choose the completed recording once. Companion uses the Windows FFmpeg and FFprobe installation to inspect it and create exactly the first 45 seconds, including the Like TAC opener. Video uses NVIDIA NVENC when available and falls back to CPU H.264; audio-only input produces an audio preview. RunPod and the A40 are not used and incur no credits.

Companion uploads the full private recording first and then the generated preview. The original remains untouched. Cancel removes temporary output. If preview upload fails after the full upload succeeds, Retry regenerates and sends only the preview. An expired handoff requires a new launch from the administrator page.

## Backup and restore

Keep the private OBS profile and scene-collection exports outside GitHub. After a damaging OBS change, import the saved `LikeTACLive` profile and `LikeTACLive Studio` collection, restart OBS, and rerun Companion readiness.

## Troubleshooting

- **Companion does not open:** reinstall or repair the Windows installer so the `liketac` protocol is registered.
- **OBS does not open:** browse to the administrator-approved `obs64.exe` path.
- **Authentication failed:** copy the password from OBS WebSocket Server Settings into Companion; do not send it to the website.
- **Wrong configuration:** stop any active recording/stream, then use the controlled relaunch.
- **Missing device:** reconnect it in Windows, confirm its driver, then rerun the explicit device check.
- **Upload handoff expired:** return to Podcast Content and prepare a new ten-minute handoff.
- **FFmpeg unavailable:** confirm `ffmpeg` and `ffprobe` launch from a new Windows terminal, then restart Companion.
- **Website-only upload:** the full episode may publish, but protected visitors see a locked branded card until Companion adds the preview.

