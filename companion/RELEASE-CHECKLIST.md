# Like TAC Companion release checklist

The phase-one installer is unsigned. Windows may display an Unknown Publisher warning until a trusted code-signing certificate is configured.

## Build verification

- [ ] `npm test` passes at the repository root.
- [ ] `npm run build` passes at the repository root.
- [ ] `npm run --prefix companion build` passes.
- [ ] `npx tsc -p companion/tsconfig.json --noEmit` passes.
- [ ] `npm run --prefix companion package:win` creates the expected NSIS installer in `companion/release/`.

## Installation and protocol

- [ ] Install on the administrator's Windows recording computer.
- [ ] Confirm **Like TAC Companion** appears in Installed Apps.
- [ ] From Win+R, run `liketac://recording` and confirm only one Companion window opens.
- [ ] From Admin Dashboard → Recording Studio, confirm **Launch Like TAC Companion** opens the same application.
- [ ] Confirm malformed or additional `liketac://` actions do not navigate or execute.

## Real OBS 33 acceptance

- [ ] With OBS closed, select **Launch OBS** and confirm OBS opens with profile `LikeTACLive`, scene collection `LikeTACLive Studio`, and scene `00 - Standby`.
- [ ] Confirm Companion connects only to `127.0.0.1:4455` with authentication.
- [ ] Restart Companion and confirm Windows-encrypted credential storage works without exposing the password in logs or UI.
- [ ] Confirm all four approved scenes display and unavailable scenes are disabled.
- [ ] Switch each scene from Companion and verify OBS Program changes to the same scene.
- [ ] Verify the LCS microphone level, host and DeskPro camera previews, presentation preview, banner PNG, and opening reel audio mute/unmute.
- [ ] Start recording, confirm the subtle pulse/LIVE timer, change scenes, and stop with confirmation.
- [ ] Play the recording in Microsoft Media Player and VLC; confirm Track 1 is the complete audible program mix and Track 2 is the optional isolated host microphone.
- [ ] Close Companion while recording and verify Cancel, Leave OBS Recording, and Stop Recording and Close behaviors independently.
- [ ] Disconnect/restart OBS and confirm Companion reports uncertainty, reconnects, and never starts a recording automatically.

## Network and removal

- [ ] Confirm no router forwarding or public Windows Firewall rule exposes port 4455.
- [ ] Confirm the Vercel website never receives the OBS password or local device inventory.
- [ ] Uninstall Companion and confirm the `liketac` protocol registration and installed application are removed.
- [ ] Confirm OBS profiles, scenes, and recordings remain untouched after uninstall.

