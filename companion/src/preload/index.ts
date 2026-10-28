import type { ApprovedScene, CompanionStatus } from "../shared/contracts";
import type { CompanionWindowAPI } from "../shared/window-api";

type Invoke = (channel: string, ...arguments_: unknown[]) => Promise<unknown>;
type Subscribe = (channel: string, listener: (value: CompanionStatus) => void) => () => void;

export function createCompanionAPI(invoke: Invoke, subscribe: Subscribe): CompanionWindowAPI {
  return Object.freeze({
    connect: (password: string) => invoke("companion:connect", password),
    getStatus: () => invoke("companion:get-status") as Promise<CompanionStatus>,
    refresh: () => invoke("companion:refresh") as Promise<CompanionStatus>,
    launchOBS: () => invoke("companion:launch-obs"),
    setScene: (scene: ApprovedScene) => invoke("companion:set-scene", scene),
    startRecording: () => invoke("companion:start-recording"),
    stopRecording: () => invoke("companion:stop-recording"),
    setFullScreen: (enabled: boolean) => invoke("companion:set-full-screen", enabled),
    requestClose: (choice) => invoke("companion:request-close", choice),
    onStatus: (listener) => subscribe("companion:status", listener),
  });
}

if (process.versions.electron) {
  void import("electron").then(({ contextBridge, ipcRenderer }) => {
    const subscribe: Subscribe = (channel, listener) => {
      const handler = (_event: unknown, value: CompanionStatus) => listener(value);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    };
    contextBridge.exposeInMainWorld("likeTacCompanion", createCompanionAPI(
      (channel, ...arguments_) => ipcRenderer.invoke(channel, ...arguments_), subscribe,
    ));
  });
}
