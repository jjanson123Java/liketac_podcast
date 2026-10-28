import { describe, expect, test, vi } from "vitest";
import { createCompanionAPI } from "./index";

describe("sandboxed preload bridge", () => {
  test("exposes only approved Companion commands and never a credential reader", async () => {
    const invoke = vi.fn(async () => ({ ok: true }));
    const subscribe = vi.fn(() => () => undefined);
    const api = createCompanionAPI(invoke, subscribe);

    expect(Object.keys(api).sort()).toEqual([
      "connect", "getStatus", "launchOBS", "onStatus", "requestClose", "setFullScreen",
      "setScene", "startRecording", "stopRecording",
    ]);
    expect(api).not.toHaveProperty("getPassword");
    await api.setScene("10 - Host Only");
    expect(invoke).toHaveBeenCalledWith("companion:set-scene", "10 - Host Only");
  });
});
