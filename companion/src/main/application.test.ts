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
});
