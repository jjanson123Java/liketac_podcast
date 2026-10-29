import type { ApprovedScene, CompanionStatus } from "../shared/contracts";
import type { CompanionWindowAPI } from "../shared/window-api";

type Invoke = (channel: string, ...arguments_: unknown[]) => Promise<unknown>;
type Subscribe = (channel: string, listener: (value: CompanionStatus) => void) => () => void;
type Bridge = { exposeInMainWorld(name: string, value: unknown): void };
type Ipc = {
  invoke(channel: string, ...arguments_: unknown[]): Promise<unknown>;
  on(channel: string, listener: (_event: unknown, value: CompanionStatus) => void): void;
  removeListener(channel: string, listener: (_event: unknown, value: CompanionStatus) => void): void;
};

export function createCompanionAPI(invoke: Invoke, subscribe: Subscribe): CompanionWindowAPI {
  return Object.freeze({
    connect: (password: string) => invoke("companion:connect", password),
    getStatus: () => invoke("companion:get-status") as Promise<CompanionStatus>,
    syncStatus: () => invoke("companion:sync-status") as Promise<CompanionStatus>,
    getProgramPreview: () => invoke("companion:get-program-preview") as Promise<string>,
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

export function installCompanionBridge(contextBridge: Bridge, ipcRenderer: Ipc) {
  const subscribe: Subscribe = (channel, listener) => {
    const handler = (_event: unknown, value: CompanionStatus) => listener(value);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  };
  contextBridge.exposeInMainWorld("likeTacCompanion", createCompanionAPI(
    (channel, ...arguments_) => ipcRenderer.invoke(channel, ...arguments_), subscribe,
  ));
}
