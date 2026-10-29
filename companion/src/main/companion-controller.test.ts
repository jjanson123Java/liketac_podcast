import { describe, expect, test, vi } from "vitest";
import { CompanionController } from "./companion-controller";

describe("CompanionController", () => {
  test("does not let a slow refresh overwrite a newer OBS recording event", async () => {
    let releaseReadiness!: (value: any[]) => void;
    const readiness = new Promise<any[]>((resolve) => { releaseReadiness = resolve; });
    const client = {
      getSnapshot: vi.fn(async () => ({ recording: true, streaming: false, availableScenes: ["10 - Host Only"], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "10 - Host Only" })),
      getReadiness: vi.fn(() => readiness),
    };
    const controller = new CompanionController(client as any);

    const refresh = controller.refresh();
    controller.recordingEvent(false);
    releaseReadiness([]);
    await refresh;

    expect(controller.status().recording).toBe(false);
  });

  test("synchronizes scene and recording state from a lightweight OBS snapshot", async () => {
    const client = {
      getSnapshot: vi.fn(async () => ({ recording: true, streaming: false, availableScenes: ["50 - Host Presentation"], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "50 - Host Presentation" })),
      getReadiness: vi.fn(),
    };
    const controller = new CompanionController(client as any);

    await controller.syncSnapshot();

    expect(controller.status()).toMatchObject({ recording: true, programScene: "50 - Host Presentation" });
    expect(client.getReadiness).not.toHaveBeenCalled();
  });

  test("does not let snapshot polling cancel an authoritative readiness refresh", async () => {
    let releaseReadiness!: (value: any[]) => void;
    const readiness = new Promise<any[]>((resolve) => { releaseReadiness = resolve; });
    const client = {
      getSnapshot: vi.fn(async () => ({ recording: false, streaming: false, availableScenes: ["10 - Host Only"], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "10 - Host Only" })),
      getReadiness: vi.fn(() => readiness),
    };
    const controller = new CompanionController(client as any);

    const refresh = controller.refresh();
    await controller.syncSnapshot();
    releaseReadiness([{ id: "mic", label: "Microphone", ready: false, reason: "No live microphone level was detected." }]);
    await refresh;

    expect(controller.status().readiness).toEqual([
      { id: "mic", label: "Microphone", ready: false, reason: "No live microphone level was detected." },
    ]);
  });

  test("publishes live OBS source readiness after connecting", async () => {
    const client = {
      connect: vi.fn(async () => undefined),
      getSnapshot: vi.fn(async () => ({ recording: false, streaming: false, availableScenes: ["00 - Standby"], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "00 - Standby" })),
      getReadiness: vi.fn(async () => [{ id: "mic", label: "LCS host microphone", ready: true, reason: null }]),
      startRecord: vi.fn(), stopRecord: vi.fn(), setProgramScene: vi.fn(), subscribe: vi.fn(),
    };
    const controller = new CompanionController(client as any);
    await controller.connect({ host: "127.0.0.1", port: 4455, password: "secret" });
    expect(controller.status().readiness).toEqual([{ id: "mic", label: "LCS host microphone", ready: true, reason: null }]);
  });

  test("reports authentication failures instead of remaining in connecting state", async () => {
    const client = { connect: vi.fn(async () => { throw new Error("OBS rejected the WebSocket password."); }) };
    const controller = new CompanionController(client as any);
    await expect(controller.connect({ host: "127.0.0.1", port: 4455, password: "bad" })).rejects.toThrow();
    expect(controller.status()).toMatchObject({ connection: "authentication-failed", error: "OBS rejected the WebSocket password." });
  });

  test("refuses recording when a required source is not ready", async () => {
    const client = {
      connect: vi.fn(),
      getSnapshot: vi.fn(async () => ({ recording: false, streaming: false, availableScenes: [], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "00 - Standby" })),
      getReadiness: vi.fn(async () => [{ id: "display", label: "Presentation display", ready: false, reason: "Required OBS source is missing." }]),
      startRecord: vi.fn(), stopRecord: vi.fn(), setProgramScene: vi.fn(), subscribe: vi.fn(),
    };
    const controller = new CompanionController(client as any);
    await controller.connect({ host: "127.0.0.1", port: 4455, password: "secret" });
    await expect(controller.startRecording()).rejects.toThrow("Presentation display: Required OBS source is missing.");
    expect(client.startRecord).not.toHaveBeenCalled();
  });

  test("refreshes readiness immediately before starting a recording", async () => {
    const getReadiness = vi.fn()
      .mockResolvedValueOnce([{ id: "mic", label: "Microphone", ready: true, reason: null }])
      .mockResolvedValueOnce([{ id: "mic", label: "Microphone", ready: false, reason: "No live microphone level was detected." }]);
    const client = {
      connect: vi.fn(), getReadiness,
      getSnapshot: vi.fn(async () => ({ recording: false, streaming: false, availableScenes: [], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "00 - Standby" })),
      startRecord: vi.fn(), stopRecord: vi.fn(), setProgramScene: vi.fn(), subscribe: vi.fn(),
    };
    const controller = new CompanionController(client as any);
    await controller.connect({ host: "127.0.0.1", port: 4455, password: "secret" });
    await expect(controller.startRecording()).rejects.toThrow("No live microphone level was detected.");
    expect(getReadiness).toHaveBeenCalledTimes(2);
    expect(client.startRecord).not.toHaveBeenCalled();
  });

  test("marks recording state unknown after a dropped connection and reconnects without starting recording", async () => {
    const client = {
      connect: vi.fn(async () => undefined),
      getSnapshot: vi.fn(async () => ({ recording: true, streaming: false, availableScenes: [], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "10 - Host Only" })),
      getReadiness: vi.fn(async () => []),
      startRecord: vi.fn(async () => undefined),
      stopRecord: vi.fn(async () => undefined),
      setProgramScene: vi.fn(async () => undefined),
      subscribe: vi.fn(),
      getProgramPreview: vi.fn(async () => "data:image/jpeg;base64,test"),
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

  test("returns to disconnected after automatic reconnect attempts are exhausted", async () => {
    const client = {
      connect: vi.fn(async () => { throw new Error("connect ECONNREFUSED 127.0.0.1:4455"); }),
    };
    const scheduled: Array<() => void | Promise<void>> = [];
    const controller = new CompanionController(client as any, (callback) => { scheduled.push(callback); return 1; });

    await expect(controller.connect({ host: "127.0.0.1", port: 4455, password: "secret" })).rejects.toThrow();
    controller.handleDisconnect();
    while (scheduled.length) await scheduled.shift()!();

    expect(client.connect).toHaveBeenCalledTimes(6);
    expect(controller.status()).toMatchObject({ connection: "disconnected", recordingState: "unknown" });
  });

  test("preserves completed readiness when stopping a recording", async () => {
    const client = {
      connect: vi.fn(async () => undefined),
      getSnapshot: vi.fn(async () => ({ recording: false, streaming: false, availableScenes: ["10 - Host Only"], obsVersion: "33", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "10 - Host Only" })),
      getReadiness: vi.fn(async () => [{ id: "mic", label: "Microphone", ready: true, reason: null }]),
      stopRecord: vi.fn(async () => undefined),
    };
    const controller = new CompanionController(client as any);
    await controller.connect({ host: "127.0.0.1", port: 4455, password: "secret" });
    controller.recordingEvent(true);

    await controller.stopRecording();

    expect(client.getReadiness).toHaveBeenCalledTimes(1);
    expect(controller.status()).toMatchObject({ recording: false, readiness: [{ id: "mic", ready: true }] });
  });
});
