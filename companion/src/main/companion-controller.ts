import type { OBSConnectionConfig } from "../shared/contracts";
import type { OBSSnapshot } from "./obs-client";

type ControllerClient = {
  connect(config: OBSConnectionConfig): Promise<void>;
  getSnapshot(): Promise<OBSSnapshot>;
  startRecord(): Promise<void>;
  stopRecord(): Promise<void>;
  setProgramScene(scene: string): Promise<void>;
  subscribe(event: string, listener: (...args: any[]) => void): unknown;
};

type Scheduler = (callback: () => void | Promise<void>, delayMs: number) => unknown;

export class CompanionController {
  private config: OBSConnectionConfig | null = null;
  private current: Record<string, any> = {
    connection: "disconnected", recordingState: "inactive", recording: false,
    recordingStartedAt: null, obsVersion: null, profile: null, sceneCollection: null,
    programScene: null, availableScenes: [], readiness: [],
  };
  private reconnectAttempt = 0;

  constructor(private readonly client: ControllerClient, private readonly schedule: Scheduler = setTimeout) {}

  async connect(config: OBSConnectionConfig) {
    this.config = config;
    this.current = { ...this.current, connection: "connecting" };
    await this.client.connect(config);
    await this.refresh("connected");
    this.reconnectAttempt = 0;
  }

  status() { return { ...this.current }; }

  async refresh(connection = "connected") {
    const snapshot = await this.client.getSnapshot();
    this.current = {
      ...snapshot,
      connection,
      recordingState: snapshot.recording ? "active" : "inactive",
      recordingStartedAt: snapshot.recording ? this.current.recordingStartedAt ?? new Date().toISOString() : null,
    };
  }

  async setScene(scene: string) {
    await this.client.setProgramScene(scene);
    await this.refresh();
  }

  async startRecording() {
    await this.client.startRecord();
    await this.refresh();
  }

  async stopRecording() {
    await this.client.stopRecord();
    await this.refresh();
  }

  recordingEvent(active: boolean, startedAt?: string) {
    this.current = {
      ...this.current,
      recording: active,
      recordingState: active ? "active" : "inactive",
      recordingStartedAt: active ? startedAt ?? this.current.recordingStartedAt ?? new Date().toISOString() : null,
    };
  }

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
