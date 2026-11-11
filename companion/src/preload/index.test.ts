import { describe, expect, test, vi } from "vitest";
import { createCompanionAPI, installCompanionBridge } from "./index";

describe("sandboxed preload bridge", () => {
  test("exposes only approved Companion commands and never a credential reader", async () => {
    const invoke = vi.fn(async () => ({ ok: true }));
    const subscribe = vi.fn(() => () => undefined);
    const api = createCompanionAPI(invoke, subscribe);

    expect(Object.keys(api).sort()).toEqual([
      "cancelMediaUpload", "closeOBS", "connect", "disconnectOBS", "getProgramPreview", "getStatus", "launchOBS", "onStatus", "refresh", "requestClose", "retryMediaUpload", "setFullScreen",
      "setScene", "startMediaUpload", "startRecording", "stopRecording", "syncStatus",
    ]);
    expect(api).not.toHaveProperty("getPassword");
    await api.setScene("10 - Host Only");
    expect(invoke).toHaveBeenCalledWith("companion:set-scene", "10 - Host Only");
  });

  test("installs the bridge synchronously before renderer startup", () => {
    const expose = vi.fn();
    const ipc = { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn() };
    installCompanionBridge({ exposeInMainWorld: expose }, ipc);
    expect(expose).toHaveBeenCalledOnce();
    expect(expose.mock.calls[0][0]).toBe("likeTacCompanion");
  });
});
