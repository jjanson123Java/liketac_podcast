import type { ApprovedScene, CompanionStatus } from "./contracts";

export type CompanionWindowAPI = {
  connect(password: string): Promise<unknown>;
  getStatus(): Promise<CompanionStatus>;
  syncStatus(): Promise<CompanionStatus>;
  getProgramPreview(): Promise<string>;
  refresh(): Promise<CompanionStatus>;
  launchOBS(): Promise<unknown>;
  disconnectOBS(): Promise<unknown>;
  closeOBS(): Promise<unknown>;
  setScene(scene: ApprovedScene): Promise<unknown>;
  startRecording(): Promise<unknown>;
  stopRecording(): Promise<unknown>;
  setFullScreen(enabled: boolean): Promise<unknown>;
  requestClose(choice: "cancel" | "leave-recording" | "stop-recording"): Promise<unknown>;
  onStatus(listener: (status: CompanionStatus) => void): () => void;
};

declare global { interface Window { likeTacCompanion: CompanionWindowAPI } }
