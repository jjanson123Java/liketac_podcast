export type CommandRunner = () => Promise<string>;

type PnpDevice = { Class?: string; FriendlyName?: string; InstanceId?: string };

export class WindowsDeviceProbe {
  constructor(private readonly run: CommandRunner) {}

  async readiness() {
    let devices: PnpDevice[] = [];
    try {
      const parsed = JSON.parse(await this.run()) as PnpDevice | PnpDevice[] | null;
      devices = parsed ? (Array.isArray(parsed) ? parsed : [parsed]) : [];
    } catch {
      return ["microphone", "camera", "display"].map((kind) => ({
        id: `windows:${kind}`, label: `Windows ${kind}`, ready: false,
        reason: "Windows device detection failed. Run readiness checks again.",
      }));
    }
    const definitions = [
      { kind: "microphone", classes: ["AudioEndpoint"], namePattern: /microphone|\bmic\b|audio input/i },
      { kind: "camera", classes: ["Camera", "Image"] },
      { kind: "display", classes: ["Monitor"] },
    ];
    return definitions.map(({ kind, classes, namePattern }) => {
      const present = devices.filter((device) => classes.includes(device.Class ?? "") && (!namePattern || namePattern.test(device.FriendlyName ?? "")));
      const ready = present.length > 0;
      return {
        id: `windows:${kind}`, label: `Windows ${kind}`, ready,
        reason: ready ? null : `No connected Windows ${kind} was detected.`,
        details: present.map((device) => device.FriendlyName).filter(Boolean).join(", "),
      };
    });
  }
}
