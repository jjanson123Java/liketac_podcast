# LikeTAC Podcast Platform — import, rebrand & hosting handoff
**Version:** 2026-11-12.4 (optional social profiles revision)
**Source project:** https://github.com/jjanson123Java/liketac_podcast
**Example running site:** https://liketac.live
**Purpose:** Give this entire prompt to a LOCAL AI coding assistant with access to the adopter's filesystem, terminal, Git, and approved provider accounts—such as Codex desktop opened on a local project or Claude Code. The assistant will import the LikeTAC source into a new repository owned by the adopter, then customize and deploy only that independent copy. A browser-only LLM can explain the guide but must not claim it cloned, built, configured OBS, inspected hardware, or deployed anything.

## Important before starting
The source owner has offered the software as a starting point for your independent podcast website. The intended workflow is **source repository → complete permitted import into the adopter's new GitHub repository → rebrand and deploy from the adopter's repository**. The adopter is not expected to work in, modify, deploy from, or submit changes to the source repository. The source repository must be accessible to the adopter's assistant long enough to perform the import. Record the exact source release/tag or commit SHA used so the adoption can be reproduced even after the source changes. The source software is published with an [Apache License 2.0 scope statement](https://github.com/jjanson123Java/liketac_podcast/blob/master/LICENSE) and a [NOTICE](https://github.com/jjanson123Java/liketac_podcast/blob/master/NOTICE) reserving the Like TAC name, logos, branded artwork, podcast opening reel, and other creative media. **Import and reuse the licensed software only under its terms; preserve required notices, replace all excluded branded assets, and use the adopter's own independent hosting accounts.** Verify any third-party licenses before publishing the imported copy.

## Simple kickoff command for the adopter
Upload this entire Markdown file to an LLM that can access files and repositories, then send this one command:

```text
Use the attached podcast-platform guide as the complete instruction set for creating my independent podcast website. Begin with its “First response” section now. First verify that you are a local coding agent with filesystem, terminal, and Git access; if you are browser-only, tell me to continue in Codex desktop, Claude Code, or another capable local agent. Ask whether my recording computer is Windows or Mac and wait for my answer. Follow only that operating system's OBS and dependency path. Treat the current Companion as Windows-only; a Mac adopter may launch the complete website and an OBS-only workflow without building a Companion. Verify the LikeTAC source repository before making claims. After I approve the plan, import the complete permitted source application into a new repository in my GitHub account and make all changes only in my imported repository. When a tested Companion exists for my platform, verify its required executables and devices from inside the installed Companion. Ask me the remaining brand, hosting, administrator, subscriber, and recording questions, and do not import, modify, purchase, or deploy anything until I approve the plan.
```

The adopter should keep this Markdown file attached for the project conversation. The LLM still needs read access to the source repository for the import and, later, authorized access to create or populate the adopter's own GitHub repository and hosting resources. The file does not contain or grant credentials. A repository URL identifies the source but does not bypass a private-repository access restriction.

---

## Copy everything in the following instructions into your LLM


### Role
Act as my senior Next.js engineer, podcast-platform architect, UI/UX brand designer, security reviewer, and deployment engineer. Help me turn an existing podcast portal into my own completely independent, branded, secure podcast website and deploy it using my own accounts.

### Mandatory agent-capability gate
Before doing anything else, state whether you can actually use a local filesystem, terminal, Git, and the adopter-approved GitHub/Vercel tools. If you cannot, stop after guidance and tell me to reopen this project in Codex desktop with a local project folder, Claude Code, or another capable local coding agent. Never turn instructions you could not execute into claims that work was completed. Provider access never grants permission to buy, delete, publish, transfer, or expose resources without the approval required below.

For a local agent, produce a beginner workstation-readiness table before source import with: **Tool or access**, **Required for**, **Detected version/account**, **Resolved location or scope**, **Status**, and **Action needed**. Check Git, GitHub authentication, repository read access, Node.js LTS, npm, available local disk space, a writable project directory, and—when Vercel is selected—the Vercel account/team, CLI or provider connection, and GitHub integration. Use the repository lockfile with `npm ci`; do not discard it or replace pinned dependency resolution with an unreviewed `npm install` upgrade.

#### Platform-specific Git and GitHub readiness
Do not assume that signing in to Codex also installed Git, installed GitHub CLI, or selected the correct GitHub account. Git is required for the local repository. GitHub CLI is optional when a working Codex GitHub connection or browser workflow can provide the same authorized operations.

For **Windows**:
1. Run `git --version`, `gh --version`, `gh auth status`, and `git config --show-origin --get-regexp "^user\.(name|email)$"`, handling a missing command without treating it as a fatal shell error.
2. If Git is missing, explain why it is needed and, only after my approval, install the official Git for Windows package using `winget install --exact --id Git.Git` when WinGet is available, or guide me through the official installer. Open a new terminal and verify `git --version` again.
3. If GitHub CLI is missing and no usable Codex GitHub connection is available, offer either browser-based GitHub repository creation or, with my approval, `winget install --exact --id GitHub.cli`. Open a new terminal and verify `gh --version`.
4. If GitHub CLI is selected but not authenticated, run `gh auth login --web`; let me complete the browser authorization, then run `gh auth status`. Never ask me to paste a GitHub password, personal access token, recovery code, or browser device code into LLM chat.
5. Use Windows Credential Manager/Git Credential Manager for GitHub credentials. Do not store credentials in the repository, `.env` files, command history, screenshots, or documentation.

For **Mac**:
1. Run `uname -m`, `xcode-select -p`, `git --version`, `gh --version`, `gh auth status`, and `git config --show-origin --get-regexp "^user\.(name|email)$"`, handling a missing command without treating it as a fatal shell error.
2. If Git or Apple Command Line Tools are missing, explain why they are needed and, only after my approval, start the Apple installation with `xcode-select --install`. Wait for me to complete the macOS dialog, open a new terminal, and verify `xcode-select -p` and `git --version` again.
3. If GitHub CLI is missing and no usable Codex GitHub connection is available, offer browser-based GitHub repository creation first. If I prefer GitHub CLI and Homebrew is already approved and available, install it with `brew install gh`; otherwise guide me to an official GitHub CLI installation method. Verify `gh --version` afterward.
4. If GitHub CLI is selected but not authenticated, run `gh auth login --web`; let me complete the browser authorization, then run `gh auth status`. Never ask me to paste a GitHub password, personal access token, recovery code, or browser device code into LLM chat.
5. Use macOS Keychain/Git Credential Manager or the approved Codex connection for credentials. Do not store credentials in the repository, shell profiles, `.env` files, screenshots, or documentation.

For **both platforms**, if the adopter does not yet have a GitHub account, guide them to create and verify their own account in a browser and recommend enabling MFA or a passkey before continuing. After detection or sign-in, show the authenticated GitHub username and ask: **“Is this the GitHub account that should own your new podcast repository?”** Wait for confirmation; never infer ownership from the last login. Then ask for and confirm the new repository name and whether it should initially be private or public. Test read access to the LikeTAC source repository separately from write/create access in the adopter's account. Do not create the repository until the plan and repository name/visibility are approved. Do not overwrite an existing global Git author name or email without permission; use repository-local Git identity when appropriate.

### Source repository
https://github.com/jjanson123Java/liketac_podcast

### Reference website
https://liketac.live

### My outcome
I want the permitted LikeTAC source application imported into a new GitHub repository that I own. All customization and deployment must use my imported repository, NOT the LikeTAC repository, LikeTAC accounts, or LikeTAC's live production website. I need my own brand, domain or temporary URL, admin login, deployment, email sender, databases, and private podcast-media storage. I should be able to operate my website without any dependency on the source owner's live accounts, secrets, databases, credentials, services, or domain.

### Mandatory first question — choose the recording computer
Before asking the other customization questions, ask me exactly:

```text
Will the computer used to record and manage your podcast be Windows or Mac?
```

Wait for my answer. Record the answer as a project requirement and follow only the matching path below. Do not give me a Windows `.exe`, PowerShell, WinGet, NSIS, Windows device, or Windows path instruction when I answer Mac. Do not give me a macOS `.dmg`, Homebrew, Keychain, Apple signing, notarization, or macOS permission instruction when I answer Windows. If I will use both, treat them as two separately tested Companion releases sharing the same secure website API.

### Start with discovery — do not guess
1. Retrieve the source repository in full for inspection. Resolve the selected release/tag or current default-branch commit to an exact commit SHA, record that SHA in the adoption notes, and do all import work from that immutable baseline. Read its README, AGENTS.md instructions if applicable, package.json and lockfile, application source, authentication code, database models and migrations, media pipeline, scripts, configuration, tests, and docs/operations/*.md. Do not modify or deploy the source repository.
2. If the repository is private/inaccessible or you cannot browse GitHub, tell me exactly what access or zip download you need. NEVER claim you ingested or audited files you did not actually inspect.
3. Summarize the CURRENT architecture and distinguish working features from assumptions.
4. Identify exact dependencies on Vercel, Neon, Vercel Blob, email services, OBS/Windows Companion, and any LikeTAC-specific resources or workflows.
5. Identify code or features that are unnecessary for my requirements. Preserve secure working functionality unless I approve a change.

### Ask me these questions before customizing
- **Recording operating system — ask first and wait:** Will the administrator's recording computer be Windows or Mac?
- **Brand:** What is your podcast name, tagline, description, genre, and target audience?
- **Visual identity:** What visual branding do you want (logo, colors, fonts, artwork, style)? Do you already have media assets, or do you want original replacements designed?
- **Optional social profiles:** Ask separately whether I want to publish a YouTube channel, Twitch channel, X / Twitter profile, Instagram profile, or Discord community. For every service I choose, ask for both the exact public URL and the handle/community name that should be displayed. Every service is optional. If I skip it or leave either value blank, do not add that service to the website. Never invent a placeholder account, handle, invite, or URL.
- **GitHub:** Do you already have your OWN GitHub account and a repository name? If not, guide me to make one.
- **Hosting:** WHERE WILL YOU HOST THE SITE? RECOMMEND VERCEL as the default complete platform because the source is a Next.js application designed for Vercel server routes, Git deployments, custom domains, private Blob media, and Marketplace-connected Neon databases. The recommended Vercel design preserves subscriber signup, authentication, protected playback/downloads, administrator workflows, MFA, and email notices. Let me choose (1) recommended Vercel, (2) a different managed host, or (3) my own VPS/server. If not Vercel, ask for the exact provider, plan, JavaScript/Node runtime, PostgreSQL service, private object storage, and email provider before designing a provider-specific deployment.
- **Domain — ask which path applies:** (1) I already own a domain, (2) I want to buy one directly through Vercel, (3) I want to buy one from another registrar and connect it to Vercel, or (4) I am not ready to buy one and want to launch first on the temporary `*.vercel.app` address. If I already own or later purchase a domain, ask for the exact domain and registrar. Do not confuse buying/registration, DNS connection, transfer of registration, and assignment to a Vercel project; they are separate actions.
- **Format:** Will episodes be audio, video, or both? Will the archive be free, subscriber-only, or mixed? Do I need subscriber accounts, email notices, MFA, uploads, previews, and a recording assistant?
- **Administrator:** Which private email address will receive administrator MFA and recovery messages? What administrator username do I want? Do not ask me to paste the password into chat.
- **Recording computer:** After I answer Windows or Mac, ask what computer model, processor architecture, cameras, microphones, presentation displays, and available video encoder/GPU I will use. Ask whether I want the matching Companion or an OBS-only workflow.

Do not ask me to paste real passwords, API keys, database URLs, admin recovery codes, or access tokens into LLM chat. Use provider dashboards, secret managers, or local environment settings for sensitive values.

### Optional social-link footer behavior
When I provide one or more confirmed social profiles, configure only those profiles in the imported website's social-link configuration. Place the links beside the footer logo/brand on wide screens. Let them wrap onto another line when needed, and place them below the logo/brand on small screens. Use labels such as **YouTube: @ChannelName**, **Twitch: ChannelName**, **X / Twitter: @Handle**, **Instagram: @Handle**, and **Discord: CommunityName**. Open external profiles in a new tab with safe external-link attributes. Reject malformed or non-HTTPS URLs and ask me to correct them. Do not publish a service when its URL or display name is blank, and do not retain sample values such as `@NextLevelCast` in the completed adopter site.

The source Like TAC configuration may intentionally contain an empty social-link list. An empty list is valid and must render no social navigation or empty heading. Social-profile configuration is part of the adopter's rebrand, not a reason to modify or deploy the source owner's live website.

### Import the application into my repository and separate it from LikeTAC
1. After I approve the plan, create a new repository under MY GitHub account with a name I approve. Import the complete permitted and sanitized source tree—including the website, server routes, database migrations, Companion source when selected, tests, scripts, documentation, and permitted assets—so my repository is a functional independent starting point rather than an empty shell or a collection of links back to LikeTAC.
2. Before editing, rename the cloned source remote to `source` and disable its push URL, or remove it entirely after recording the source URL and commit SHA. Prove with `git remote -v` that the LikeTAC repository is not writable from the adopter checkout. Never force-push, open a pull request, or configure deployment against the LikeTAC repository.
3. Use a clean import commit in my repository rather than carrying private legacy Git history unless the source owner explicitly authorizes the history and it passes the secret and privacy audit. Preserve all required license, copyright, attribution, and NOTICE files. Make the adopter's repository the only writable deployment source.
4. Comply with the repository’s Apache-2.0 software license and its scope statement, preserve upstream attribution and notices, and do not reuse excluded Like TAC branding or media without separate permission.
5. Treat these as excluded unless the source owner supplies separate written permission: Like TAC/LikeTAC names and marks; `prototype/assets/liketac-logo.png`; `public/brand/liketac-logo.png`; everything under `public/media/podcast-opener/`; Like TAC episode recordings, scripts, transcripts, thumbnails, music, promotional material, sample content, and other branded creative media. Create an adopter asset-exclusion checklist, replace or remove every excluded asset and reference, and do not deploy until a repository-wide search confirms none remain in served pages, metadata, email, Companion bundles, or generated output.
6. Replace LikeTAC title, domain, logo, artwork, labels, colors, email identity, metadata, Open Graph images, favicons, app strings, help pages, sample episodes, and closing/intro materials with my own original brand. Do not misrepresent LikeTAC materials as mine.
7. Replace all production-specific email addresses, personal profile data, project/resource IDs, team names, service names, database URLs, Blob paths, analytics IDs, callback URLs, deployment references, custom protocols, and trusted origins. Treat `.env.example` and public operations documentation as adopter-facing templates containing placeholders only. Never connect my installation to LikeTAC production resources.
8. Before the first preview deployment, run a repository-wide adopter-readiness scan for excluded assets, `liketac.live`, source-owner emails, Like TAC resource IDs, source Git remotes, credentials, private media, and unresolved branding. A finding blocks deployment until I explicitly resolve it; masking the finding is not resolution.
9. Preserve or safely adapt the podcast catalog, episode pages, media playback, preview/teaser behavior, admin workflows, subscriber authentication, MFA, recovery flows, accessibility, and responsive layouts according to my decisions.
10. If a Companion is requested, select the Windows implementation or a separately verified Mac implementation from my recorded operating-system answer. Explain whether it actually exists and works on my computer. A Mac adopter may select **OBS-only now, Companion later** and continue the entire website launch. Do not assume a desktop Companion is part of a web-only host deployment and do not claim the Windows Companion runs on Mac.

### Administrator portal — required setup and validation
The source has a completely separate administrator security flow. Do not treat a normal subscriber account as an administrator and do not invent or preserve a source-owner password.

1. Preserve and rebrand the administrator routes unless I explicitly remove administration:
   - `/admin/sign-in` — administrator username/password entry
   - `/admin/verify` — emailed six-digit MFA code
   - `/admin/recover` and `/admin/reset` — administrator-only recovery, separate from subscriber recovery
   - `/admin/change-password` — mandatory replacement of the one-time bootstrap password
   - `/admin` — protected dashboard
   - `/admin/recording` — local Companion launch and OBS readiness guidance
   - `/admin/podcasts`, `/admin/categories`, and `/admin/profile` — content, category, and administrator-profile management
2. Configure my own `ADMIN_USERNAME`, `ADMIN_SECURITY_EMAIL`, and a unique one-time `ADMIN_BOOTSTRAP_PASSWORD` in the deployment secret manager. Never commit or paste their real values into chat, source, logs, screenshots, or documentation.
3. Before any migration or bootstrap, show a non-secret target table for **Identity** and **Content** containing the selected Vercel account/team, project, environment, Neon resource name/ID, database host, and database name. Confirm the two connection strings are non-empty, point to different intended databases, and do not reference any Like TAC production resource. Do not print connection strings or passwords. Stop on any mismatch. Drizzle does not automatically load `.env.local`; use a deliberate, documented environment-loading method and verify the target again from the same process context that will execute the commands.
4. Apply the identity migration only to the verified identity database and the content migration only to the verified content database. Generate a unique one-time bootstrap password locally, store it in my password manager, and add it only to the intended deployment environment without exposing it in chat or logs. Run `npm run db:bootstrap-admin` against the verified identity database and record the non-secret result.
5. Complete the bootstrap ceremony in order: sign in with the one-time password; replace it with my permanent password; complete emailed MFA; verify the admin session and protected dashboard; remove `ADMIN_BOOTSTRAP_PASSWORD` from every Vercel environment; redeploy; verify the removed variable; and prove the one-time password no longer signs in. It is not the daily administrator password and must not remain available to the running website.
6. Configure and verify transactional email before testing administrator login. Correct administrator credentials must send a six-digit MFA code to the profile security email; the code expires after ten minutes. The optional trusted-device choice lasts 30 days.
7. Confirm the first administrator login forces password replacement, MFA succeeds, the admin dashboard is protected server-side, subscriber login cannot open admin routes, and `/admin/recover` sends only to the administrator security email.
8. Preserve rate limiting, cryptographic password hashing, five-password history, secure cookies, session revocation, trusted-device revocation, and audit records. Do not add a documented default password or hard-coded bypass.

### OBS Studio and platform-specific Companion — optional but required for integrated recording
The current Companion is a local Windows Electron application; a Mac version requires the separate port described below. Vercel does not run either Companion, OBS, cameras, microphones, FFmpeg, or recordings. If I want the integrated recording/upload workflow, perform all matching platform steps; otherwise remove or clearly disable the Companion launch controls without weakening private-media access.

#### Operating-system decision and beginner installation flow
Before configuring recording, detect or ask which operating system will be used and report what is already installed. Do not claim OBS or Companion works until the actual local application is launched and tested.

- **Windows 10 or 11 — recommended full integration:** OBS Studio and the current Companion architecture are supported. Use the official OBS download page at `https://obsproject.com/download` or, with my approval, the official Windows package command `winget install -e --id OBSProject.OBSStudio`. Prefer the standard OBS installation folder because the Companion launcher searches it. After installation, ask me to reply **OBS installed**, then verify `obs64.exe`, the installed OBS version, cameras, microphones, displays, WebSocket, and FFmpeg/FFprobe before creating the profile and scenes.
- **macOS — OBS-only launch is supported; Companion is a separate optional project:** First verify the current macOS minimum supported by the official OBS release, then install the correct official Intel or Apple Silicon `.dmg` from `https://obsproject.com/download`, or use `brew install --cask obs` with my approval. Never use the Windows Companion executable. Look for a separately maintained, signed, and verified macOS Companion release. If none exists, say so plainly, mark Companion recording/upload automation as deferred, and continue the website, GitHub, Vercel, database, domain, email, subscriber, administrator, and OBS-only launch. Do not stop the overall podcast project and do not change the podcast website's main branch merely to invent a Mac port.
- **Linux — web portal and OBS may be adapted, but the current Companion is unsupported:** verify the distribution and official OBS package first. Treat a Linux Companion as a new port, not a configuration change.

If OBS is absent, stop the OBS configuration phase, give me the official installation choice, and wait until I confirm installation. If OBS is present, inspect its version and standard path before continuing. Installing OBS alone does not configure the podcast studio.

For a macOS or Linux Companion port, first present a separate design, cost/signing requirements, and obtain separate approval. Create the port in a separate Companion repository or isolated port branch; do not modify the source podcast website's main branch merely to add desktop-platform support. The port must replace Windows-only OBS discovery paths, PowerShell/PnP device discovery, Windows credential-storage assumptions, NSIS packaging, protocol registration, process control, FFmpeg discovery, and platform-specific tests. It must then pass the same real recording, reconnect, preview, upload, and media-quality acceptance tests as Windows. Until that acceptance passes, the website must label Companion launch controls unavailable on Mac and provide the OBS-only recording/upload instructions instead.

#### Mandatory dependency discovery, installation, and reachability gate
Before creating OBS profiles or building a Companion, produce a readiness table with these columns: **Dependency**, **Required for**, **Detected version**, **Resolved executable or service**, **Reachable from Companion**, **Status**, and **Action needed**. Do not proceed to recording acceptance while a required row is unresolved.

Check all of the following:

- OBS Studio and its exact executable/application path
- OBS WebSocket server enabled, authentication required, local port `4455` reachable only on loopback
- FFmpeg and FFprobe as two separately executable tools
- selected cameras, microphones, audio sample rate, and presentation displays
- an actual monitor selected in every presentation-capture source
- recording output directory and Companion temporary directory are writable
- sufficient free disk space for the selected recording resolution and duration
- custom Companion URL protocol registered and opening the intended installed application
- administrator website origin, Companion trusted origin, and upload handoff route agree
- platform permissions required by OBS or Companion

**Windows dependency rules**

1. Detect OBS in the standard 64-bit Program Files location before asking for a custom path.
2. Resolve `ffmpeg.exe` and `ffprobe.exe` independently with `Get-Command` or `where.exe`, record their absolute paths and versions, and run a harmless probe from the same user context that launches Companion.
3. When external FFmpeg is used, add its directory to a persistent user or system `PATH`, open a new process, and verify both commands again. Do not assume a PATH change reaches an already-running Companion; restart Companion after the change.
4. Prefer storing the verified absolute FFmpeg and FFprobe paths in Companion settings or safely bundling compatible binaries so operation does not depend only on PATH.
5. Verify Windows camera, microphone, monitor, audio, and storage readiness from the packaged Companion as well as OBS.

**Mac dependency rules**

1. Install FFmpeg through an approved package source such as Homebrew with `brew install ffmpeg`, which supplies both `ffmpeg` and `ffprobe`, or use verified bundled binaries.
2. Do not rely only on an interactive Terminal `PATH`. A Mac application launched by Finder or a custom URL protocol may not inherit `.zshrc`, `.zprofile`, or the same Homebrew environment.
3. The Mac Companion must discover and verify absolute tool paths in `/opt/homebrew/bin` for Apple Silicon and `/usr/local/bin` for Intel, allow an administrator-selected path, or ship verified bundled tools. Test the resolved paths from inside the packaged Companion, not only from Terminal.
4. Require the appropriate macOS privacy permissions for OBS, including Camera, Microphone, and Screen & System Audio Recording when those sources are used. Fully relaunch OBS after a permission change.
5. Use the current `macOS Screen Capture` and macOS audio-capture sources supported by the installed OBS version. Do not copy Windows display-capture source types blindly into the Mac collection.
6. Detect Apple Silicon versus Intel and ensure OBS, Companion, FFmpeg, and FFprobe architectures are compatible. Avoid requiring Rosetta when a native or Universal release is available.

**End-user versus build-only dependencies**

- End users need the website/browser, OBS, the installed platform-specific Companion when selected, FFmpeg/FFprobe unless safely bundled, local devices, permissions, writable recording/temp folders, and adequate storage.
- Node.js, npm, TypeScript, Electron build tooling, source code, Xcode, and signing credentials are build/release dependencies. They should not be required on an ordinary podcast administrator's computer when a finished installer is supplied.
- A Mac release builder needs macOS/Xcode plus Apple signing and notarization credentials. Keep certificates, API keys, and passwords in the CI or local secret store, never in the repository or adopter prompt.

The Companion must block preview generation and explain the missing dependency when FFmpeg or FFprobe is unavailable. It must never upload the full protected episode and then silently omit the promised visitor preview without showing the administrator the locked-fallback state and recovery action.

#### Windows prerequisites
- Windows recording computer with OBS Studio 33 or newer installed in a standard 64-bit location such as `C:\Program Files\obs-studio\bin\64bit\obs64.exe`.
- OBS WebSocket enabled on local address `127.0.0.1`, port `4455`, with a unique password. Do not expose or forward port 4455 through the router or a public firewall rule.
- FFmpeg and FFprobe installed and callable from a new Windows terminal. They create the local 45-second subscriber preview; RunPod is not required.
- Working Windows drivers for every selected camera, microphone, and presentation display.

#### Current source contract
The unmodified Companion requires OBS profile `LikeTACLive`, scene collection `LikeTACLive Studio`, and these scenes:
- `00 - Standby`
- `10 - Host Only`
- `50 - Host Presentation`
- `70 - Audio Only`

Its readiness checks currently require these exact OBS source names:
- `LCS_MIC_Host_Primary`
- `CAM_Host_Primary`
- `CAM_DeskPro_Presentation`
- `DISPLAY_Presentation`

Build the OBS scenes deliberately. In `50 - Host Presentation`, select a real monitor in the `DISPLAY_Presentation` Properties dialog, fit it to the canvas, and keep the presentation camera above it as picture-in-picture. A source object with no active monitor selection is not a working presentation source.

My hardware will probably differ from the source owner's DeskPro/LCS setup. Ask me to choose between:
1. keeping the internal profile/scene/source contract exactly as written while mapping my hardware to those names; or
2. renaming the contract and updating every matching constant, readiness check, launcher argument, UI label, test, Help page, and operations document.

#### Companion rebranding and secure integration
Do not merely change the website logo. If the Companion is retained, replace or deliberately configure all source-specific desktop integration values:
- Electron `appId`, `productName`, installer name, icons, and publisher metadata
- custom URL scheme currently named `liketac`
- website links currently using `liketac://recording` and `liketac://prepare-upload`
- Companion labels, bundled banner/reel assets, hashes, Help text, and release checklist
- hard-coded production origin currently restricted to `https://liketac.live`
- OBS launch profile, collection, scene, and required source names if I chose to rename them

Keep the security boundary: the OBS password and device inventory remain local and must never be sent to the website, Vercel, Neon, Blob, GitHub, analytics, or support logs. The Companion connects only to local OBS WebSocket and stores the password with operating-system-protected storage: Windows protection on Windows or Keychain-backed Electron `safeStorage` on macOS.

#### Build, install, and acceptance test
1. Install locked dependencies and run the root website tests/build.
2. **Windows answer:** in `companion/`, run its tests, build, strict TypeScript check, and `npm run package:win`. Install the generated NSIS package. The current upstream installer is unsigned, so explain the Unknown Publisher warning and recommend code signing before broad distribution.
3. **Mac answer:** use only the separate macOS Companion source. Replace OBS discovery with `/Applications/OBS.app/Contents/MacOS/OBS`, replace Windows PnP discovery with tested macOS device/display discovery, locate FFmpeg in Apple Silicon and Intel Homebrew paths or bundle it, use Keychain-backed secure storage, and package Apple Silicon/Intel or Universal builds as appropriate. Produce a signed, hardened, notarized `.dmg`; do not call an unsigned development build a public release.
4. From the protected Recording Studio page, launch the custom protocol. With OBS closed, Companion must start OBS with the required profile, collection, and `00 - Standby`; it must never start recording automatically.
5. Enter the local OBS WebSocket password and run readiness. Verify the microphone produces a live level, each camera produces a preview, `DISPLAY_Presentation` has an active monitor, all required scenes exist, and the branded media assets resolve.
6. Record a real test while switching through all scenes. Stop it, inspect the saved file with FFprobe, and play it in at least Windows Media Player or VLC. Confirm video, audible audio, scene transitions, presentation capture, picture-in-picture, and expected resolution.
7. Verify disconnect/reconnect restores the live preview; Full Screen exits with Esc; Close OBS affects only the OBS process launched by Companion and does not delete profiles, scenes, or recordings.
8. From a draft episode in `/admin/podcasts`, launch **Prepare and upload with Companion**. Confirm the ten-minute one-time handoff, one-file selection, local first-45-second preview generation, independent full/preview progress, cancellation, retry, private Blob upload, and protected visitor playback.

The adopter should not install the upstream Like TAC-branded Companion package as their permanent application. After the website and desktop identifiers are rebranded, build a new installer from their selected Windows or Mac Companion repository, install that package, and test its own protocol scheme and production origin. The Companion installer is local software; it is not deployed to Vercel or downloaded automatically by subscriber browsers.

### Hosting decision tree — recommend Vercel first
### If I select Vercel
- Recommend GitHub + Vercel as the supported, lowest-friction configuration for the Next.js frontend and server-side JavaScript/TypeScript routes. Explain that Vercel hosts the application, while Neon and Blob are separately provisioned services connected to the Vercel project; do not incorrectly describe podcast files as stored inside a SQL database.
- Before creating or changing anything, show and confirm the selected Vercel account/team, billing owner, project name, imported GitHub repository, Preview/Production target, and expected region. Never infer the correct team from the last CLI login or browser tab. Repeat this non-secret scope check before a billable purchase, production promotion, domain assignment, database migration, or destructive operation.
- Create a NEW Vercel project in MY Vercel account linked to MY GitHub repository, not the source owner's Vercel team/project.
- Provision MY OWN separate Neon identity and content databases (or equivalent supported PostgreSQL resources). Apply migrations only to my new databases.
- Provision MY OWN Vercel Blob storage (or confirm a compatible private-media setup), and my own transactional email provider and verified sender domain.
- Preserve and verify the complete subscriber model: free signup with communication consent, member sign-in, username/password recovery, password history, sessions, subscriber-only full playback and downloads, public Start Here episodes, protected 45-second previews, cancellation/disabled-account enforcement, and role-aware Help.
- Preserve and verify the complete administrator model: separate admin sign-in, emailed six-digit MFA, optional 30-day trusted device, independent recovery, protected content/category/profile pages, private uploads, and secure Companion handoffs.
- Keep identity/security records in the identity Neon database; podcast catalog, categories, media metadata, and upload-handoff hashes in the content Neon database; full recordings and generated previews in private Blob storage; and actual credentials only in Vercel environment secrets.
- Explain which features require paid tiers and identify cost drivers before committing to services.
- Add environment variables only through MY Vercel project settings/secret manager. Never commit real values to Git.
- Before either database migration or administrator bootstrap, present a non-secret target table containing **Purpose**, **Vercel environment**, **Neon resource name**, **database host**, and **database name**. Confirm identity and content URLs are both present, point to two different adopter-owned databases, and do not contain any Like TAC production host/resource. Drizzle does not automatically load `.env.local`; use an approved environment-loading method without printing values. Stop on a missing, placeholder, stale, or ambiguous URL rather than running a migration.
- Deploy to the project's temporary `*.vercel.app` URL first and verify the complete website before purchasing or connecting a custom domain. A custom domain must never block initial build and acceptance testing.
- Perform the following domain decision flow and stop for my choice before any billable registration, renewal, or transfer:
  1. **I already own the domain:** Add it to the correct Vercel project under **Settings → Domains**. Read the exact ownership-verification and DNS records Vercel returns for this project, then guide me to enter those records at my current registrar. Do not invent or reuse old A, CNAME, TXT, or nameserver values. Confirm DNS resolution, Vercel's **Valid Configuration** status, HTTPS certificate issuance, and the preferred apex/`www` redirect. Registration can remain with the current registrar; a transfer to Vercel is optional and must not be implied.
  2. **I want to buy through Vercel:** Search the requested exact names, show the initial registration price, renewal price, term, and premium status, and obtain my approval before purchase. Complete the registrant-contact and verification requirements, confirm automatic-renewal preference, assign the purchased domain to the correct project, then verify DNS, HTTPS, and the primary-domain redirect.
  3. **I want to buy from another registrar:** Let me choose the registrar and complete the purchase there. Do not require a transfer into Vercel. After I confirm the exact purchased domain and registrar, add the domain to the correct Vercel project, obtain the current records from Vercel, guide me to place them at the registrar, and verify ownership, DNS, HTTPS, and redirects.
  4. **I am not ready to buy:** Complete and test the launch on `*.vercel.app`. Give me a short return procedure: purchase the domain from my chosen registrar, tell the LLM the exact purchased domain and registrar, open the existing Vercel project, add it under **Settings → Domains**, follow the newly displayed verification/DNS records, verify HTTPS, and set the primary-domain redirect. Adding the domain later must not require rebuilding or redesigning the application.
- Explain that domain registration does not include an email mailbox. If I want addresses at that domain, configure a separate email provider and preserve its MX, SPF, DKIM, and DMARC records while changing website DNS.
- Before accepting real subscribers, verify a Privacy Policy, Terms or acceptable-use notice, communication-consent wording, consent timestamp and policy version, unsubscribe link, consent withdrawal, suppression of unsubscribed/canceled recipients, account deletion, data export, and email bounce/complaint handling. Do not send newsletters merely because an address exists; require the recorded consent state.
- Before publishing production media, test a representative episode at my intended maximum duration, resolution, bitrate, and file size—not only a short clip. Report local recording space, FFmpeg temporary-space need, Blob storage and transfer cost drivers, upload/runtime limits, retry behavior, browser range playback, 4K/1080p delivery when selected, mobile playback, and archive/checksum behavior. Obtain approval for any paid tier or capacity increase.
- Confirm preview and production deployments, and how future commits in my GitHub repository deploy automatically.

### If I select another host
- Ask for the exact provider and determine whether it supports the application's Next.js version, Node/runtime requirements, API/server functions, authentication sessions, media streaming, and background operations.
- Do not remove subscriber or administrator functionality merely because I selected another provider. Require equivalent PostgreSQL databases, private object storage, transactional email, secure environment variables, server-side sessions/authorization, scheduled retention support where used, and sufficient upload/runtime limits—or clearly explain which feature cannot be supported before proceeding.
- Explain which Vercel-specific interfaces must change (especially @vercel/blob), with equivalent providers and migration costs.
- Keep private media behind authorized server-side access; do not expose subscribers' media through public storage URLs.
- Use MY OWN database, email, object storage, and domain/DNS settings.
- Adapt build/start scripts, deployment configuration, environment settings, and CI/CD to that provider. Supply a rollback procedure.
- If the host cannot support key features securely, explain the incompatibility and offer the least disruptive supported alternative instead of claiming a working deployment.

### Security and privacy requirements
- Audit all tracked files AND available Git history for committed secrets, live URLs/tokens, personal emails, production IDs, customer data, credentials, and private media before publishing my new repo.
- Do not copy real credentials, admin account information, production records, or any source owner's private data.
- Never share or log real secret values.
- Do not weaken role checks, server-side permissions, MFA, password hashing, reset tokens, protected media, or account recovery simply to make the app deploy.
- Sanitize `.env.example` with placeholders before the first push to my repository. It must not contain Like TAC email addresses, personal emails, usernames, domains, resource IDs, or credentials. Keep `.env.local` and actual provider environment settings secret.
- Sanitize public operations documents and tests so source-owner project IDs, Neon/Blob/email resource IDs, team names, personal profile values, and production-only URLs are either adopter placeholders or clearly isolated non-runtime test fixtures. A repository-wide search must prove the adopter copy does not instruct me to use Like TAC resources.
- Never execute destructive migration or data deletion against any original LikeTAC system.
- Generate my own administrator credentials and configure MFA and recovery.
- Ensure branding changes do not invalidate security or licensing requirements.

### Backup, archive, and restoration acceptance
Before production handoff, document the backup owner, schedule, retention, encryption, storage location, and recovery objective for the identity database, content database, private media inventory, environment-variable name inventory, OBS profile/scene collection, Companion configuration, and domain/email DNS records. Do not put secret values in the runbook.

Perform at least one non-destructive restoration drill into isolated test resources. Verify subscriber/admin row counts and authentication behavior, podcast/category/media-reference integrity, representative Blob playback, OBS profile/scene import, and Companion readiness. A backup job reporting success is not sufficient acceptance. Record the drill date, source backup identifier, isolated restore target, checks performed, result, and cleanup status. Never restore a test backup over production.

### Implementation workflow
- **Phase 1 — Source audit:** give me an accurate feature/architecture inventory, a security and licensing checklist, and a list of source-specific dependencies.
- **Phase 2 — My choices:** collect only the decisions needed for brand, content model, GitHub destination, hosting provider, domain, and optional features.
- **Phase 3 — Build plan:** propose a short prioritized plan and explain the changes, risks, estimated hosting cost categories, and rollback. Request approval before destructive or billable changes.
- **Phase 4 — Independent codebase:** create my new GitHub repository, copy/adapt only authorized source material, update branding and configuration, implement any provider adapters, and retain attribution where required.
- **Phase 5 — Verification:** install locked dependencies; run tests, type checks/build, and representative end-to-end tests for visiting, signup/login, admin MFA, password recovery, consent/unsubscribe, private media access, upload, publish/unpublish, teaser playback, realistic maximum media capacity, mobile layout, and accessibility. For Companion, automated tests and a successful build do not replace live OBS process, preview, reconnect, recording, saved-file, audio/video playback, and upload acceptance. Show failures honestly.
- **Phase 6 — Deployment:** provision my services, apply migrations, create the admin account, deploy a preview, verify it, then deploy production with my approval.
- **Phase 7 — Handoff:** supply the live site URL, GitHub repository URL, full runbook, a sanitized variable-name list, backup/restore steps, estimated recurring cost categories, publishing guide, and simple procedure to change hosting later.

### Required final deliverables
- My own independent GitHub repository URL
- My branded podcast website and responsive mobile presentation
- My own production/preview hosting accounts and URLs
- My own databases, media storage, email service, domain configuration
- Working admin and media workflows (tested, with results)
- A functioning separate administrator portal with bootstrap, forced password replacement, emailed MFA, 30-day trusted-device option, recovery, and server-side authorization
- If selected, a rebranded Companion installer for my declared operating system, a documented OBS profile/scene/source contract, and real acceptance results on that exact Windows or Mac computer and architecture
- A deployment and recovery runbook
- A completed isolated restoration-drill record
- A safe example environment file with NO real secrets
- An adopter-readiness report proving excluded assets, source-owner identifiers, writable source remotes, and production connections were removed from my copy
- A description of what I changed, what I chose not to change, and any limitations
- An estimate of current third-party monthly costs or usage drivers (verify provider pricing at deployment time)

### First response
Start by saying whether you can access and inspect the source repo. Give a concise explanation of the app's confirmed architecture, including the separate administrator portal and the platform-specific optional OBS Companion. Then ask only this gating question and wait: **“Will the computer used to record and manage your podcast be Windows or Mac?”** After I answer, ask the remaining brand, hosting, administrator-security-email, subscriber, hardware, and matching recording-workflow questions. Suggest Vercel as the easiest default, but allow me to select any compatible host. Do not mix operating-system instructions and do not claim the app is deployed, migrated, authenticated, Companion-ready, or OBS-integrated until you actually verify those steps on the chosen platform.

---

**End of copy-and-paste prompt.**

## For the person sharing this file
- The source repository is intended to be publicly readable for adoption, but the recipient must still verify access and record the exact imported commit SHA. If its visibility changes later, the prompt cannot bypass GitHub permissions.
- Public visibility permits inspection and cloning; it does not grant rights to excluded Like TAC names, artwork, media, recordings, or other reserved creative material.
- The source owner should continue auditing public history, tracked files, logs, license, production identifiers, personal data, and branding/media rights before each adopter release.
- Only the owner can authorize the code and artwork reuse terms.
- If a future source release is private, the recipient needs collaborator access or a separately prepared, sanitized source archive/template.
