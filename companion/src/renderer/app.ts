import { APPROVED_SCENES, type CompanionStatus } from "../shared/contracts";
import type { CompanionWindowAPI } from "../shared/window-api";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character]!);

function elapsed(startedAt: string | null, now: Date) {
  if (!startedAt) return "00:00";
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function renderCompanion(root: Element, status: CompanionStatus, now = new Date()) {
  const profileReady = status.profile === "LikeTACLive";
  const collectionReady = status.sceneCollection === "LikeTACLive Studio";
  const checks = status.readiness ?? [];
  const allReady = status.connection === "connected" && profileReady && collectionReady && checks.length > 0 && checks.every((item) => item.ready);
  root.innerHTML = `
    <header class="topbar"><div><strong>Like TAC Companion</strong><span id="obs-profile" class="${status.recording ? "recordingPulse" : ""}">OBS - LikeTACLive</span></div><div class="liveState">${status.recording ? `<b>LIVE</b><time>${elapsed(status.recordingStartedAt, now)}</time>` : "Ready when you are"}</div></header>
    <div class="workspace">
      <aside class="controls" aria-label="Recording controls">
        <section><h2>OBS connection</h2><p class="state ${status.connection}">${escapeHtml(status.connection.replaceAll("-", " "))}</p>${status.error ? `<p class="connectionError" role="alert">${escapeHtml(status.error)}</p>` : ""}
          ${status.connection === "disconnected" ? '<button id="launch-obs">Launch OBS</button>' : ""}
          <label>OBS WebSocket password<input id="obs-password" type="password" autocomplete="off"></label><button id="connect-obs">Connect to OBS</button>
        </section>
        <section><h2>Configuration</h2>
          <p class="check ${profileReady ? "good" : "bad"}">${profileReady ? "Profile ready" : "Required profile: LikeTACLive"}</p>
          <p class="check ${collectionReady ? "good" : "bad"}">${collectionReady ? "Scene collection ready" : "Required scene collection: LikeTACLive Studio"}</p>
        </section>
        <section><h2>Devices and sources</h2>${checks.length ? checks.map((item) => `<div class="device ${item.ready ? "good" : "bad"}"><strong>${escapeHtml(item.label)}</strong><span>${item.ready ? "Ready" : escapeHtml(item.reason ?? "Check required")}</span></div>`).join("") : "<p>Run readiness checks after connecting.</p>"}</section>
        <button id="full-screen" class="quiet">Full screen</button>
      </aside>
      <main class="stage">
        <section class="preview"><div><span>Program preview</span><strong>${escapeHtml(status.programScene ?? "OBS not connected")}</strong><small>LIVE and device indicators are controls only and are not recorded.</small></div></section>
        <section class="scenes" aria-label="OBS scenes">${APPROVED_SCENES.map((scene) => `<button data-scene="${scene}" ${status.availableScenes.includes(scene) ? "" : "disabled"} class="${scene === status.programScene ? "active" : ""}">${scene}</button>`).join("")}</section>
        <section class="recordActions"><button disabled title="Safe delete-after-test arrives in a later phase">Test Recording - coming in a later phase</button><button id="start-recording" class="primary" ${allReady && !status.recording ? "" : "disabled"}>Start Live Recording</button><button id="stop-recording" class="danger" ${status.recording ? "" : "disabled"}>Stop</button></section>
        <section class="assets"><article><h2>Like TAC banner</h2><img src="assets/liketac-banner-hd.png" alt="Like TAC banner preview"></article><article><h2>Opening reel</h2><video muted playsinline src="assets/like-tac-podcast-opener.mp4" aria-label="Like TAC opening reel preview"></video><button id="toggle-reel-audio">Mute or unmute opening reel preview</button></article></section>
      </main>
    </div>`;
}

export function wireCompanion(root: Element, api: CompanionWindowAPI) {
  const safely = (operation: Promise<unknown>) => void operation.catch(() => undefined);
  root.querySelector("#launch-obs")?.addEventListener("click", () => safely(api.launchOBS()));
  root.querySelector("#connect-obs")?.addEventListener("click", () => {
    const input = root.querySelector<HTMLInputElement>("#obs-password")!;
    const password = input.value;
    input.value = "";
    safely(api.connect(password));
  });
  root.querySelector("#full-screen")?.addEventListener("click", () => safely(api.setFullScreen(true)));
  root.querySelector("#start-recording")?.addEventListener("click", () => safely(api.startRecording()));
  root.querySelector("#stop-recording")?.addEventListener("click", () => {
    if (window.confirm("Stop the current OBS recording?")) safely(api.stopRecording());
  });
  root.querySelectorAll<HTMLElement>("[data-scene]").forEach((button) => button.addEventListener("click", () => safely(api.setScene(button.dataset.scene as any))));
  root.querySelector("#toggle-reel-audio")?.addEventListener("click", () => {
    const video = root.querySelector<HTMLVideoElement>("video")!;
    video.muted = !video.muted;
  });
}

async function start() {
  const root = document.querySelector("#app");
  if (!root || !window.likeTacCompanion) return;
  const draw = (status: CompanionStatus) => { renderCompanion(root, status); wireCompanion(root, window.likeTacCompanion); };
  draw(await window.likeTacCompanion.getStatus());
  window.likeTacCompanion.onStatus(draw);
  setInterval(async () => draw(await window.likeTacCompanion.getStatus()), 1000);
}

if (typeof window !== "undefined" && "likeTacCompanion" in window) void start();
