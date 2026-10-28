import { describe, expect, test, vi } from "vitest";
import { CompanionController } from "./companion-controller";

describe("CompanionController", () => {
  test("marks recording state unknown after a dropped connection and reconnects without starting recording", async () => {
    const client = {
      connect: vi.fn(async () => undefined),
      getSnapshot: vi.fn(async () => ({ recording: true, streaming: false, availableScenes: [], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "10 - Host Only" })),
      startRecord: vi.fn(async () => undefined),
      stopRecord: vi.fn(async () => undefined),
      setProgramScene: vi.fn(async () => undefined),
      subscribe: vi.fn(),
    };
    const scheduled: Array<() => void> = [];
    const controller = new CompanionController(client, (callback) => { scheduled.push(callback); return 1; });
    await controller.connect({ host: "127.0.0.1", port: 4455, password: "secret" });
    controller.handleDisconnect();
    expect(controller.status()).toMatchObject({ connection: "reconnecting", recordingState: "unknown" });
    await scheduled[0]();
    expect(client.connect).toHaveBeenCalledTimes(2);
    expect(client.startRecord).not.toHaveBeenCalled();
  });
});
