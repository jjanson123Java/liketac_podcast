import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { allowedRendererNavigation, parseCompanionLaunch } from "./protocol";

let mainWindow: BrowserWindow | null = null;

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
  void app.whenReady().then(() => { mainWindow = createWindow(); });
}
