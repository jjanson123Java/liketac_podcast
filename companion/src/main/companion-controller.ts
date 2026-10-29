import type { OBSConnectionConfig } from "../shared/contracts";
import type { OBSSnapshot } from "./obs-client";

type ControllerClient = {
  connect(config: OBSConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  getSnapshot(): Promise<OBSSnapshot>;
  getReadiness(): Promise<Array<{ id: string; label: string; ready: boolean; reason: string | null }>>;
  startRecord(): Promise<void>;
  stopRecord(): Promise<void>;
  setProgramScene(scene: string): Promise<void>;
  subscribe(event: string, listener: (...args: any[]) => void): unknown;
  getProgramPreview(): Promise<string>;
};

type Scheduler = (callback: () => void | Promise<void>, delayMs: number) => unknown;

export class CompanionController {
  private config: OBSConnectionConfig | null = null;
  private current: Record<string, any> = {
    connection: "disconnected", recordingState: "inactive", recording: false,
    recordingStartedAt: null, obsVersion: null, profile: null, sceneCollection: null,
    programScene: null, availableScenes: [], readiness: [], error: null,
  };
  private reconnectAttempt = 0;
  private stateRevision = 0;
  private snapshotRequest = 0;

  constructor(
    private readonly client: ControllerClient,
    private readonly schedule: Scheduler = setTimeout,
    private readonly additionalReadiness: () => Promise<Array<{ id: string; label: string; ready: boolean; reason: string | null }>> = async () => [],
  ) {}

  async connect(config: OBSConnectionConfig) {
    this.config = config;
    this.current = { ...this.current, connection: "connecting" };
    try {
      await this.client.connect(config);
      await this.refresh("connected");
      this.reconnectAttempt = 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : "OBS is unavailable.";
      this.current = { ...this.current, connection: /password|authentication/i.test(message) ? "authentication-failed" : "disconnected", error: message };
      throw error;
    }
  }

  async disconnect() {
    this.config = null;
    this.reconnectAttempt = 0;
    this.stateRevision += 1;
    this.snapshotRequest += 1;
    await this.client.disconnect();
    this.current = {
      ...this.current, connection: "disconnected", recordingState: "unknown",
      programScene: null, availableScenes: [], readiness: [], error: null,
    };
  }

  status() { return { ...this.current }; }

  async refresh(connection = "connected") {
    const revision = ++this.stateRevision;
    const snapshotRequest = ++this.snapshotRequest;
    const [snapshot, obsReadiness, otherReadiness] = await Promise.all([
      this.client.getSnapshot(), this.client.getReadiness(), this.additionalReadiness(),
    ]);
    if (revision !== this.stateRevision) return;
    const snapshotState = snapshotRequest === this.snapshotRequest ? {
      ...snapshot,
      recordingState: snapshot.recording ? "active" : "inactive",
      recordingStartedAt: snapshot.recording ? this.current.recordingStartedAt ?? new Date().toISOString() : null,
    } : {};
    this.current = {
      ...this.current,
      ...snapshotState,
      connection,
      readiness: [...obsReadiness, ...otherReadiness],
      error: null,
    };
  }

  async syncSnapshot() {
    const revision = this.stateRevision;
    const snapshotRequest = ++this.snapshotRequest;
    const snapshot = await this.client.getSnapshot();
    if (revision !== this.stateRevision || snapshotRequest !== this.snapshotRequest) return this.status();
    this.current = {
      ...this.current,
      ...snapshot,
      connection: "connected",
      recordingState: snapshot.recording ? "active" : "inactive",
      recordingStartedAt: snapshot.recording ? this.current.recordingStartedAt ?? new Date().toISOString() : null,
      error: null,
    };
    return this.status();
  }

  getProgramPreview() { return this.client.getProgramPreview(); }

  async setScene(scene: string) {
    await this.client.setProgramScene(scene);
    await this.syncSnapshot();
  }

  async startRecording() {
    await this.refresh("connected");
    if (this.current.connection !== "connected") throw new Error("Connect to OBS before recording.");
    if (this.current.profile !== "LikeTACLive") throw new Error("Select the LikeTACLive OBS profile before recording.");
    if (this.current.sceneCollection !== "LikeTACLive Studio") throw new Error("Select the LikeTACLive Studio scene collection before recording.");
    const blocked = (this.current.readiness ?? []).find((item: { ready: boolean }) => !item.ready);
    if (blocked) throw new Error(`${blocked.label}: ${blocked.reason ?? "Readiness check failed."}`);
    if (!(this.current.readiness ?? []).length) throw new Error("Readiness checks have not completed.");
    await this.client.startRecord();
    await this.refresh();
  }

  async stopRecording() {
    await this.client.stopRecord();
    await this.syncSnapshot();
  }

  recordingEvent(active: boolean, startedAt?: string) {
    this.stateRevision += 1;
    this.snapshotRequest += 1;
    this.current = {
      ...this.current,
      recording: active,
      recordingState: active ? "active" : "inactive",
      recordingStartedAt: active ? startedAt ?? this.current.recordingStartedAt ?? new Date().toISOString() : null,
    };
  }

  handleDisconnect() {
    this.stateRevision += 1;
    this.snapshotRequest += 1;
    if (!this.config || this.reconnectAttempt >= 5) {
      this.current = { ...this.current, connection: "disconnected", recordingState: "unknown" };
      return;
    }
    this.current = { ...this.current, connection: "reconnecting", recordingState: "unknown" };
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt++, 16000);
    this.schedule(async () => {
      if (!this.config) return;
      try { await this.connect(this.config); } catch { this.handleDisconnect(); }
    }, delay);
  }
}
