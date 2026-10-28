import { describe, expect, test, vi } from "vitest";
import { WindowsDeviceProbe } from "./windows-device-probe";

describe("WindowsDeviceProbe", () => {
  test("reports present Windows audio, camera, and monitor devices", async () => {
    const run = vi.fn(async () => JSON.stringify([
      { Class: "AudioEndpoint", FriendlyName: "LCS USB Microphone", InstanceId: "mic" },
      { Class: "Camera", FriendlyName: "Cisco DeskPro", InstanceId: "cam" },
      { Class: "Monitor", FriendlyName: "LEN P27h", InstanceId: "display" },
    ]));
    const checks = await new WindowsDeviceProbe(run).readiness();
    expect(checks.every((item) => item.ready)).toBe(true);
    expect(checks.map((item) => item.label)).toEqual(["Windows microphone", "Windows camera", "Windows display"]);
  });

  test("blocks when a required Windows device class is absent", async () => {
    const checks = await new WindowsDeviceProbe(async () => JSON.stringify({ Class: "Monitor", FriendlyName: "Display", InstanceId: "display" })).readiness();
    expect(checks.find((item) => item.id === "windows:microphone")).toMatchObject({ ready: false, reason: "No connected Windows microphone was detected." });
  });
});
