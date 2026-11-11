import { describe, expect, test, vi } from "vitest";
import { CompanionApplication } from "./application";

describe("CompanionApplication", () => {
  test("reconnects using the encrypted stored credential without exposing it", async () => {
    const controller = { connect: vi.fn(async () => undefined), status: vi.fn(() => ({ connection: "connected" })) };
    const credentials = { load: vi.fn(async () => "saved-secret"), save: vi.fn() };
    const app = new CompanionApplication(controller as any, credentials, {} as any);
    await expect(app.connectSaved()).resolves.toEqual({ connection: "connected" });
    expect(controller.connect).toHaveBeenCalledWith({ host: "127.0.0.1", port: 4455, password: "saved-secret" });
  });

  test("disconnects without closing OBS", async () => {
    const controller = { disconnect: vi.fn(async () => undefined), status: vi.fn(() => ({ connection: "disconnected" })) };
    const app = new CompanionApplication(controller as any, {} as any, {} as any);
    await expect(app.disconnectOBS()).resolves.toEqual({ connection: "disconnected" });
    expect(controller.disconnect).toHaveBeenCalledOnce();
  });

  test("stops recording before closing only the OBS process launched by Companion", async () => {
    const controller = {
      status: vi.fn(() => ({ connection: "connected", recording: true })),
      stopRecording: vi.fn(async () => undefined), disconnect: vi.fn(async () => undefined),
    };
    const launcher = { closeLaunched: vi.fn(async () => true) };
    const app = new CompanionApplication(controller as any, {} as any, launcher as any);
    await expect(app.closeOBS(true)).resolves.toMatchObject({ closed: true });
    expect(controller.stopRecording).toHaveBeenCalledOnce();
    expect(launcher.closeLaunched).toHaveBeenCalledOnce();
    expect(controller.disconnect).toHaveBeenCalledOnce();
  });

  test("keeps media upload status separate from OBS and delegates start, retry, and cancel", async () => {
    const controller = { status: vi.fn(() => ({ connection: "disconnected" })) };
    const uploadJob = {
      publicStatus: vi.fn(() => ({ phase: "idle" })),
      start: vi.fn(async () => undefined), retry: vi.fn(async () => undefined), cancel: vi.fn(async () => undefined),
    };
    const app = new CompanionApplication(controller as any, {} as any, {} as any);
    app.setMediaUploadJob(uploadJob as any);
    expect(app.status()).toMatchObject({ connection: "disconnected", mediaUpload: { phase: "idle" } });
    await app.startMediaUpload(); await app.retryMediaUpload(); await app.cancelMediaUpload();
    expect(uploadJob.start).toHaveBeenCalledOnce();
    expect(uploadJob.retry).toHaveBeenCalledOnce();
    expect(uploadJob.cancel).toHaveBeenCalledOnce();
  });
});
