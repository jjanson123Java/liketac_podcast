import { describe, expect, test, vi } from "vitest";
import { CompanionApplication } from "../src/main/application";
import { CompanionController } from "../src/main/companion-controller";

describe("Like TAC Companion control flow", () => {
  test("connects, switches scenes, records, stops, and reconnects without restarting recording", async () => {
    let snapshot = {
      recording: false, streaming: false, availableScenes: ["00 - Standby", "10 - Host Only"] as const,
      obsVersion: "33.0.0", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio", programScene: "00 - Standby",
    };
    const client = {
      connect: vi.fn(async () => undefined),
      disconnect: vi.fn(async () => undefined),
      getSnapshot: vi.fn(async () => snapshot),
      getReadiness: vi.fn(async () => [{ id: "mic", label: "LCS host microphone", ready: true, reason: null }]),
      setProgramScene: vi.fn(async (scene: string) => { snapshot = { ...snapshot, programScene: scene }; }),
      startRecord: vi.fn(async () => { snapshot = { ...snapshot, recording: true }; }),
      stopRecord: vi.fn(async () => { snapshot = { ...snapshot, recording: false }; }),
      subscribe: vi.fn(),
      getProgramPreview: vi.fn(async () => "data:image/jpeg;base64,test"),
    };
    const scheduled: Array<() => void | Promise<void>> = [];
    const controller = new CompanionController(client, (callback) => { scheduled.push(callback); return 1; });
    const credentials = { save: vi.fn(async () => undefined), load: vi.fn(async () => null) };
    const launcher = { discover: vi.fn(async () => "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe"), launch: vi.fn(), closeLaunched: vi.fn(async () => true) };
    const application = new CompanionApplication(controller, credentials, launcher);

    await application.connect("secret-not-returned");
    expect(credentials.save).toHaveBeenCalledWith("secret-not-returned");
    expect(application.status()).toMatchObject({ connection: "connected", programScene: "00 - Standby", recordingState: "inactive" });

    await application.setScene("10 - Host Only");
    expect(application.status()).toMatchObject({ programScene: "10 - Host Only" });
    await application.startRecording();
    application.recordingEvent(true, "2026-10-28T22:00:00.000Z");
    expect(application.status()).toMatchObject({ recording: true, recordingState: "active", recordingStartedAt: "2026-10-28T22:00:00.000Z" });
    await application.stopRecording(true);
    application.recordingEvent(false);
    expect(application.status()).toMatchObject({ recording: false, recordingState: "inactive" });

    application.disconnected();
    expect(application.status()).toMatchObject({ connection: "reconnecting", recordingState: "unknown" });
    await scheduled[0]();
    expect(client.connect).toHaveBeenCalledTimes(2);
    expect(client.startRecord).toHaveBeenCalledTimes(1);
  });

  test("requires explicit confirmation before stopping", async () => {
    const application = new CompanionApplication({} as CompanionController, { save: vi.fn(), load: vi.fn() }, { discover: vi.fn(), launch: vi.fn(), closeLaunched: vi.fn() });
    await expect(application.stopRecording(false)).rejects.toThrow("confirmation");
  });
});
