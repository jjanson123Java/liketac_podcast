import type { ApprovedScene } from "../shared/contracts";
import type { CompanionController } from "./companion-controller";

type CredentialStore = { save(password: string): Promise<void>; load(): Promise<string | null> };
type Launcher = { discover(): Promise<string | null>; launch(executable: string): unknown; closeLaunched(): Promise<boolean> };

export class CompanionApplication {
  constructor(
    private readonly controller: CompanionController,
    private readonly credentials: CredentialStore,
    private readonly launcher: Launcher,
  ) {}

  async connect(password: string) {
    await this.controller.connect({ host: "127.0.0.1", port: 4455, password });
    await this.credentials.save(password);
    return this.status();
  }

  async connectSaved() {
    const password = await this.credentials.load();
    if (!password) return this.status();
    await this.controller.connect({ host: "127.0.0.1", port: 4455, password });
    return this.status();
  }

  status() { return this.controller.status(); }
  syncStatus() { return this.controller.syncSnapshot(); }
  getProgramPreview() { return this.controller.getProgramPreview(); }

  async launchOBS() {
    const executable = await this.launcher.discover();
    if (!executable) throw new Error("OBS was not found in a standard installation folder.");
    this.launcher.launch(executable);
    return { executable };
  }

  async disconnectOBS() {
    await this.controller.disconnect();
    return this.status();
  }

  async closeOBS(confirmed: boolean) {
    if (!confirmed) throw new Error("Administrator confirmation is required before closing OBS.");
    if (this.status().recording) await this.controller.stopRecording();
    const closed = await this.launcher.closeLaunched();
    await this.controller.disconnect();
    if (!closed) throw new Error("OBS was not launched by this Companion session, so it was disconnected but not closed.");
    return { closed: true, status: this.status() };
  }

  async setScene(scene: ApprovedScene) {
    await this.controller.setScene(scene);
    return this.status();
  }

  async startRecording() {
    await this.controller.startRecording();
    return this.status();
  }

  async stopRecording(confirmed: boolean) {
    if (!confirmed) throw new Error("Administrator confirmation is required before stopping the recording.");
    await this.controller.stopRecording();
    return this.status();
  }

  recordingEvent(active: boolean, startedAt?: string) { this.controller.recordingEvent(active, startedAt); }
  async refresh() { await this.controller.refresh(); return this.status(); }
  disconnected() { this.controller.handleDisconnect(); }
}
