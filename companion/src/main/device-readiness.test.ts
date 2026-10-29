import { describe, expect, test } from "vitest";
import { evaluateDeviceReadiness } from "./device-readiness";

describe("evaluateDeviceReadiness", () => {
  test("enables connected devices only after their OBS checks pass", () => {
    const result = evaluateDeviceReadiness({
      windowsDevices: [
        { id: "mic-1", kind: "microphone", label: "LCS USB Audio", connected: true },
        { id: "cam-1", kind: "camera", label: "Desk Pro Camera", connected: true },
        { id: "display-1", kind: "display", label: "Cisco DeskPro 3840x2160", connected: false },
      ],
      checks: {
        "mic-1": { sourcePresent: true, proof: "level" },
        "cam-1": { sourcePresent: true, proof: "preview" },
        "display-1": { sourcePresent: true, proof: "preview" },
      },
    });

    expect(result).toEqual([
      { id: "mic-1", kind: "microphone", label: "LCS USB Audio", ready: true, reason: null },
      { id: "cam-1", kind: "camera", label: "Desk Pro Camera", ready: true, reason: null },
      { id: "display-1", kind: "display", label: "Cisco DeskPro 3840x2160", ready: false, reason: "Not connected in Windows." },
    ]);
  });

  test("explains an OBS source or guided proof failure", () => {
    expect(evaluateDeviceReadiness({
      windowsDevices: [{ id: "mic-1", kind: "microphone", label: "LCS USB Audio", connected: true }],
      checks: { "mic-1": { sourcePresent: true, proof: "none" } },
    })[0]).toMatchObject({ ready: false, reason: "Complete the microphone level check." });
  });
});
