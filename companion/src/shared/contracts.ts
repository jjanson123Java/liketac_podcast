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
  availableScenes: ApprovedScene[];
};
