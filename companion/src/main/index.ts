import { app, BrowserWindow, dialog, ipcMain, safeStorage } from "electron";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { CompanionApplication } from "./application";
import { CompanionController } from "./companion-controller";
import { CredentialStore } from "./credential-store";
import { createOBSClient } from "./obs-client";
import { OBSLauncher } from "./obs-launcher";
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
  ipcMain.handle("companion:connect", async (_event, password: string) => {
    const result = await service.connect(password); broadcastStatus(); return result;
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
    const client = createOBSClient();
    const controller = new CompanionController(client);
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
  });
}
