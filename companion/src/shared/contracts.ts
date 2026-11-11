export const APPROVED_SCENES = [
  "00 - Standby",
  "10 - Host Only",
  "50 - Host Presentation",
  "70 - Audio Only",
] as const;

export type ApprovedScene = (typeof APPROVED_SCENES)[number];
export type OBSConnectionConfig = { host: "127.0.0.1" | "localhost"; port: number; password: string };
export type CompanionConnectionState = "disconnected" | "connecting" | "connected" | "authentication-failed" | "reconnecting";
export type CompanionStatus = {
  connection: CompanionConnectionState;
  obsVersion: string | null;
  profile: string | null;
  sceneCollection: string | null;
  programScene: string | null;
  recording: boolean;
  recordingState?: "inactive" | "active" | "unknown";
  recordingStartedAt: string | null;
  availableScenes: readonly ApprovedScene[];
  error?: string | null;
  readiness?: Array<{ id: string; label: string; ready: boolean; reason: string | null }>;
  mediaUpload?: MediaUploadStatus | null;
};

export type MediaProbe = {
  sourcePath: string;
  kind: "video" | "audio";
  durationSeconds: number;
  hasVideo: boolean;
  hasAudio: boolean;
  formatName: string | null;
};

export type GeneratedPreview = {
  outputPath: string;
  kind: "video" | "audio";
  durationSeconds: number;
  encoder: "nvenc" | "cpu" | "aac";
};

export type MediaUploadStatus = {
  phase: "idle" | "selecting" | "preparing" | "uploading-full" | "uploading-preview" | "complete" | "failed" | "cancelled";
  preparationProgress: number;
  fullProgress: number;
  previewProgress: number;
  sourceName: string | null;
  error: string | null;
};
