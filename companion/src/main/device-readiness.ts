export type WindowsDevice = {
  id: string;
  kind: "microphone" | "camera" | "display";
  label: string;
  connected: boolean;
};

export type DeviceProof = { sourcePresent: boolean; proof: "none" | "level" | "preview" };

export function evaluateDeviceReadiness(input: {
  windowsDevices: WindowsDevice[];
  checks: Record<string, DeviceProof | undefined>;
}) {
  return input.windowsDevices.map((device) => {
    const check = input.checks[device.id];
    let reason: string | null = null;
    if (!device.connected) reason = "Not connected in Windows.";
    else if (!check?.sourcePresent) reason = "The required OBS source is missing.";
    else if (check.proof === "none") reason = device.kind === "microphone"
      ? "Complete the microphone level check."
      : `Complete the ${device.kind} preview check.`;
    return { id: device.id, kind: device.kind, label: device.label, ready: reason === null, reason };
  });
}
