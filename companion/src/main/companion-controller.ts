import type { OBSConnectionConfig } from "../shared/contracts";
import type { OBSSnapshot } from "./obs-client";

type ControllerClient = {
  connect(config: OBSConnectionConfig): Promise<void>;
  getSnapshot(): Promise<OBSSnapshot>;
  startRecord(): Promise<void>;
  subscribe(event: string, listener: (...args: any[]) => void): unknown;
};

type Scheduler = (callback: () => void | Promise<void>, delayMs: number) => unknown;

export class CompanionController {
  private config: OBSConnectionConfig | null = null;
  private current: Record<string, unknown> = { connection: "disconnected", recordingState: "inactive" };
  private reconnectAttempt = 0;

  constructor(private readonly client: ControllerClient, private readonly schedule: Scheduler = setTimeout) {}

  async connect(config: OBSConnectionConfig) {
    this.config = config;
    this.current = { ...this.current, connection: "connecting" };
    await this.client.connect(config);
    const snapshot = await this.client.getSnapshot();
    this.current = { ...snapshot, connection: "connected", recordingState: snapshot.recording ? "active" : "inactive" };
    this.reconnectAttempt = 0;
  }

  status() { return { ...this.current }; }

  handleDisconnect() {
    this.current = { ...this.current, connection: "reconnecting", recordingState: "unknown" };
    if (!this.config || this.reconnectAttempt >= 5) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt++, 16000);
    this.schedule(async () => {
      if (!this.config) return;
      try { await this.connect(this.config); } catch { this.handleDisconnect(); }
    }, delay);
  }
}
