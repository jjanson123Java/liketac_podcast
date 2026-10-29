# Like TAC Companion Foundation Design

## Purpose

Like TAC Companion is a private Windows desktop application used only by an authenticated Like TAC administrator. It connects the administrator's local OBS Studio instance to a branded recording workspace without exposing OBS WebSocket to the internet. The public podcast website never receives, stores, or transmits the OBS WebSocket password.

This first phase establishes a reliable local recording controller for the OBS scenes already configured and tested by the administrator. Remote Studio WebRTC transport, dynamic remote guest sources, Audacity/FFmpeg post-production, archive automation, and device switching are separate phases built on this foundation.

## Approved name and branding

- The product name is **Like TAC Companion** everywhere.
- The interface uses Like TAC dark teal, energetic yellow, Segoe UI, rounded controls, and plain-language status messages.
- The workspace must remain professional, relaxed, and visually consistent with `liketac.live`.
- Recording and device indicators are application controls and are never embedded into the OBS program output.

## Security boundary

- Companion connects to OBS only through `ws://127.0.0.1:4455` by default.
- The default host is fixed to loopback. Phase one does not accept remote OBS hosts.
- OBS authentication is mandatory.
- The password is entered only into Companion, encrypted with Electron `safeStorage`, and saved under the current Windows user's application-data directory.
- The password is never logged, rendered after save, sent to Like TAC servers, placed in environment variables, or committed to Git.
- The renderer has no Node.js access. Electron context isolation and sandboxing remain enabled, and the preload bridge exposes only the approved typed commands.
- Companion allows navigation only to its packaged local interface. New windows, arbitrary URLs, and remote content are blocked.

## Phase-one behavior

### OBS launch and readiness

The Recording Studio page launches Companion through `liketac://recording`. Companion then performs a visible readiness sequence before enabling recording controls.

If OBS is not running, Companion locates the standard 64-bit Windows installation and starts OBS with the working directory set to the OBS binary directory and these arguments:

```text
--profile "LikeTACLive" --collection "LikeTACLive Studio" --scene "00 - Standby"
```

Companion never adds `--startrecording`. It waits for the authenticated WebSocket connection and reports startup progress. If OBS is not installed in a standard location, Companion provides a Browse for OBS action and remembers the administrator-approved executable path locally.

If OBS is already running, Companion reads the current profile and scene collection. A mismatch blocks recording and offers a controlled relaunch using the required Like TAC configuration. Companion never changes or restarts a running OBS instance while recording or streaming.

The readiness screen verifies all of the following before enabling Start Live Recording:

- Current profile is exactly `LikeTACLive`.
- Current scene collection is exactly `LikeTACLive Studio`.
- All approved scenes and their required sources exist.
- Windows reports the expected cameras, microphones, and displays as currently connected.
- OBS reports the configured inputs and capture sources as active.
- `LCS_MIC_Host_Primary` produces a live level during a guided microphone check.
- Camera and presentation sources can produce a current preview frame.
- The Like TAC banner PNG and opening reel are present, readable, and visible in Companion's asset preview.
- The `00 - Standby` and `70 - Audio Only` sources reference readable Like TAC assets.

Device readiness uses friendly Windows names, including manufacturer/model information where Windows exposes it. Disconnected devices remain visible but disabled with a plain-language reason. Companion may preview a camera or display only after the administrator selects the test; it does not silently activate unrelated devices.

The installer bundles these approved assets so readiness does not depend on the Git checkout or OneDrive path:

- `liketac-banner-hd.png`
- `like-tac-podcast-opener.mp4`
- `like-tac-podcast-opener-visual-only.mp4`
- `like-tac-podcast-opener-original.wav`

Companion verifies bundled assets against committed SHA-256 checksums and displays the PNG and plays the reel with mute/unmute controls. If an OBS asset source points to a missing path, Companion offers an explicit Repair Asset Path action using the bundled copy; it never rewrites source settings without administrator confirmation.

### Connection

On first launch, Companion shows the fixed host `127.0.0.1`, port `4455`, a password field, and a Connect button. A successful connection displays the OBS version, current profile, current scene collection, active program scene, and recording state. Failed authentication, unavailable OBS, and dropped connections produce distinct plain-language messages with a Retry action.

Companion reconnects with bounded backoff after an unexpected disconnect. It never starts recording merely because it reconnects.

### Scene controls

Companion discovers OBS scenes but exposes the approved Like TAC scenes in numeric order:

- `00 - Standby`
- `10 - Host Only`
- `50 - Host Presentation`
- `70 - Audio Only`

Selecting a scene changes the OBS program scene. If an approved scene is missing, its control is disabled and explains that the scene must be restored in OBS. Unknown scenes remain visible in diagnostic information but are not promoted as Like TAC controls.

### Recording controls

The workspace provides Test Recording, Start Live Recording, and Stop controls. Phase one implements Start Live Recording and Stop against OBS and reports OBS's actual recording state rather than assuming a button succeeded. Test Recording is visibly marked as unavailable until the safe delete-after-test workflow is implemented in its own phase; it must not pretend to delete recordings.

While recording:

- `OBS - LikeTACLive` displays a subtle pulse.
- A compact `LIVE` badge and elapsed time appear in Companion.
- The state remains visible in normal and full-screen Companion modes.
- No Companion status element is added as an OBS source.

Stop requires confirmation when OBS reports an active recording. Closing Companion while recording warns the administrator and leaves OBS recording unless the administrator explicitly chooses Stop Recording.

### Website entry point

The protected administrator dashboard includes a Recording Studio card leading to `/admin/recording`. That page explains that controls run locally, provides a button using the registered `liketac://recording` protocol, lists the required OBS profile and scene collection, and provides troubleshooting guidance. Subscriber and public pages never show the Companion launcher.

The website does not attempt to call the OBS WebSocket, detect local devices, or store the Companion password.

## Installation and protocol

The Windows installer registers the `liketac://` protocol for the current machine. Companion accepts only the exact `liketac://recording` launch action in phase one. Other protocol paths and parameters are ignored and shown as invalid requests.

The packaged application and installer are build artifacts and are not committed. Source code, build scripts, tests, and operator documentation are committed.

## Out of scope for phase one

- Remote participant invitations and WebRTC media transport
- Guest mute/privacy enforcement
- Dynamic browser sources for guests or demo laptops
- Automatic camera, microphone, or monitor switching (phase one performs enumeration and readiness checks only)
- Starting or controlling Audacity
- Test-recording deletion
- FFmpeg mastering and version comparison
- Publishing drafts, archive scheduling, checksum verification, or Blob deletion

These capabilities require independent security and failure-mode designs. Phase one must not show controls that falsely imply they are operational, except the explicitly disabled Test Recording control with its explanation.

## Acceptance criteria

- A Windows administrator can install Companion, launch or reconnect to OBS with the required Like TAC profile and collection, complete device and asset readiness checks, see the actual OBS state, switch among available approved scenes, start recording, and stop with confirmation.
- A wrong password, stopped OBS, missing scene, dropped connection, duplicate start, and application close during recording all produce safe and understandable behavior.
- The OBS password does not cross into the Next.js application or logs.
- Existing website tests remain green and Companion has automated tests for its state machine, allowlists, connection adapter, and renderer behavior.
- The admin website offers the protected launch page and clearly distinguishes implemented controls from later phases.

