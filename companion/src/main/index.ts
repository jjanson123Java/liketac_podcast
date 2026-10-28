import { app, BrowserWindow, dialog, ipcMain, safeStorage } from "electron";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { CompanionApplication } from "./application";
import { CompanionController } from "./companion-controller";
import { AssetReadinessService } from "./asset-readiness";
import { CredentialStore } from "./credential-store";
import { createOBSClient } from "./obs-client";
import { OBSLauncher } from "./obs-launcher";
import { WindowsDeviceProbe } from "./windows-device-probe";
import { allowedRendererNavigation, parseCompanionLaunch, resolveCloseAction } from "./protocol";
import type { ApprovedScene } from "../shared/contracts";

let mainWindow: BrowserWindow | null = null;
let service: CompanionApplication;
let allowClose = false;

function broadcastStatus() {
  mainWindow?.webContents.send("companion:status", service.status());
}

function registerHandlers() {
  ipcMain.handle("companion:get-status", () => service.status());
  ipcMain.handle("companion:refresh", async () => {
    try { return await service.refresh(); } finally { broadcastStatus(); }
  });
  ipcMain.handle("companion:connect", async (_event, password: string) => {
    try { return await service.connect(password); } finally { broadcastStatus(); }
  });
  ipcMain.handle("companion:launch-obs", () => service.launchOBS());
  ipcMain.handle("companion:set-scene", async (_event, scene: ApprovedScene) => {
    const result = await service.setScene(scene); broadcastStatus(); return result;
  });
  ipcMain.handle("companion:start-recording", async () => {
    const result = await service.startRecording(); broadcastStatus(); return result;
  });
  ipcMain.handle("companion:stop-recording", async () => {
    const result = await service.stopRecording(true); broadcastStatus(); return result;
  });
  ipcMain.handle("companion:set-full-screen", (_event, enabled: boolean) => mainWindow?.setFullScreen(enabled));
  ipcMain.handle("companion:request-close", async (_event, choice: "cancel" | "leave-recording" | "stop-recording") => {
    const action = resolveCloseAction({ recording: Boolean(service.status().recording), choice });
    if (action === "cancel") return { closed: false };
    if (action === "stop-and-close") await service.stopRecording(true);
    allowClose = true;
    mainWindow?.close();
    return { closed: true };
  });
}

function createWindow() {
  const rendererPath = join(__dirname, "../renderer/index.html");
  const rendererUrl = pathToFileURL(rendererPath).toString();
  const window = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 700,
    backgroundColor: "#063c45", title: "Like TAC Companion",
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"), contextIsolation: true,
      sandbox: true, nodeIntegration: false,
    },
  });
  window.webContents.on("will-navigate", (event, target) => {
    if (!allowedRendererNavigation(target, rendererUrl)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  void window.loadFile(rendererPath);
  window.on("close", (event) => {
    if (allowClose || !service?.status().recording) return;
    event.preventDefault();
    void dialog.showMessageBox(window, {
      type: "warning",
      title: "OBS is recording",
      message: "OBS is still recording. What would you like to do?",
      buttons: ["Cancel", "Leave OBS Recording", "Stop Recording and Close"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    }).then(async ({ response }) => {
      if (response === 0) return;
      if (response === 2) await service.stopRecording(true);
      allowClose = true;
      window.close();
    });
  });
  window.on("closed", () => { if (mainWindow === window) mainWindow = null; });
  return window;
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.setAsDefaultProtocolClient("liketac");
  app.on("second-instance", (_event, argv) => {
    if (!argv.some((value) => parseCompanionLaunch(value) === "recording")) return;
    if (!mainWindow) mainWindow = createWindow();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  void app.whenReady().then(() => {
    const protocolArguments = process.argv.filter((value) => value.toLowerCase().startsWith("liketac:"));
    if (protocolArguments.length && !protocolArguments.some((value) => parseCompanionLaunch(value) === "recording")) {
      app.quit();
      return;
    }
    const client = createOBSClient();
    const assetReadiness = new AssetReadinessService();
    const executeFile = promisify(execFile);
    const windowsDevices = new WindowsDeviceProbe(async () => {
      const { stdout } = await executeFile("powershell.exe", [
        "-NoProfile", "-NonInteractive", "-Command",
        "Get-PnpDevice -PresentOnly | Where-Object { $_.Class -in @('AudioEndpoint','Camera','Image','Monitor') } | Select-Object Class,FriendlyName,InstanceId | ConvertTo-Json -Compress",
      ], { windowsHide: true, timeout: 10000 });
      return stdout;
    });
    const assetChecks = [
      ["liketac-banner-hd.png", "Like TAC banner", "ed5a5c0a58b0cb05e17f3df9285ae2681cd995274ab62259bb4e46200731e420"],
      ["like-tac-podcast-opener.mp4", "Opening reel", "48b1cb5343e07d19c7871cce4174487a40b0214fa2c23db1b740ed462e7237d1"],
      ["like-tac-podcast-opener-visual-only.mp4", "Visual-only opening reel", "5aa916f7ffc4e4618580a5f39e50a5897e736acb687665e8e5ae67875a28f41d"],
      ["like-tac-podcast-opener-original.wav", "Opening reel audio", "62281608b16d6705246b31f98b3360bc0d3034553c544b4e89f12bd8285eceb1"],
    ] as const;
    const controller = new CompanionController(client, setTimeout, async () => {
      const [deviceChecks, mediaChecks] = await Promise.all([
        windowsDevices.readiness(),
        Promise.all(assetChecks.map(async ([file, label, hash]) => {
          const result = await assetReadiness.verify(join(__dirname, "../renderer/assets", file), hash);
          return { id: `asset:${file}`, label, ...result };
        })),
      ]);
      return [...deviceChecks, ...mediaChecks];
    });
    const credentials = new CredentialStore(join(app.getPath("userData"), "obs-credential.json"), {
      isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
      encryptString: (value) => safeStorage.encryptString(value),
      decryptString: (value) => safeStorage.decryptString(value),
    });
    const launcher = new OBSLauncher({
      exists: async (path) => { try { await access(path); return true; } catch { return false; } },
      spawn: (executable, arguments_, options) => spawn(executable, arguments_, { cwd: options.cwd, windowsHide: options.windowsHide, detached: false }),
    });
    service = new CompanionApplication(controller, credentials, launcher);
    client.subscribe("RecordStateChanged", (event: { outputActive?: boolean }) => {
      service.recordingEvent(Boolean(event.outputActive), event.outputActive ? new Date().toISOString() : undefined);
      broadcastStatus();
    });
    client.subscribe("CurrentProgramSceneChanged", () => void service.refresh().then(broadcastStatus));
    client.subscribe("ConnectionClosed", () => { service.disconnected(); broadcastStatus(); });
    registerHandlers();
    mainWindow = createWindow();
    void service.connectSaved().then(broadcastStatus).catch(broadcastStatus);
  });
}
