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

## Backup and restore

Keep the private OBS profile and scene-collection exports outside GitHub. After a damaging OBS change, import the saved `LikeTACLive` profile and `LikeTACLive Studio` collection, restart OBS, and rerun Companion readiness.

## Troubleshooting

- **Companion does not open:** reinstall or repair the Windows installer so the `liketac` protocol is registered.
- **OBS does not open:** browse to the administrator-approved `obs64.exe` path.
- **Authentication failed:** copy the password from OBS WebSocket Server Settings into Companion; do not send it to the website.
- **Wrong configuration:** stop any active recording/stream, then use the controlled relaunch.
- **Missing device:** reconnect it in Windows, confirm its driver, then rerun the explicit device check.

