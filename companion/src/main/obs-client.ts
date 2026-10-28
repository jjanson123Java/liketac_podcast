import { APPROVED_SCENES, type ApprovedScene, type OBSConnectionConfig } from "../shared/contracts";
import OBSWebSocket from "obs-websocket-js";

type RawTransport = {
  connect(url: string, password: string, options: { rpcVersion: number }): Promise<unknown>;
  disconnect(): Promise<void>;
  call(request: string, data?: Record<string, unknown>): Promise<any>;
  on(event: string, listener: (...args: any[]) => void): unknown;
  off(event: string, listener: (...args: any[]) => void): unknown;
};

export type OBSSnapshot = {
  obsVersion: string;
  profile: string;
  sceneCollection: string;
  programScene: string;
  recording: boolean;
  streaming: boolean;
  availableScenes: readonly ApprovedScene[];
};

const REQUIRED_SOURCES = [
  { name: "LCS_MIC_Host_Primary", label: "LCS host microphone", kind: "audio" },
  { name: "CAM_Host_Primary", label: "Host primary camera", kind: "video" },
  { name: "CAM_DeskPro_PNP", label: "DeskPro presentation camera", kind: "video" },
  { name: "DISPLAY_Presentation", label: "Presentation display", kind: "video" },
] as const;

export class OBSAuthenticationError extends Error {}

export class OBSClient {
  constructor(private readonly transport: RawTransport) {}

  async connect(config: OBSConnectionConfig) {
    try {
      await this.transport.connect(`ws://${config.host}:${config.port}`, config.password, { rpcVersion: 1 });
    } catch (error) {
      if ((error as { code?: number }).code === 4009 || /authentication/i.test((error as Error).message)) {
        throw new OBSAuthenticationError("OBS rejected the WebSocket password.");
      }
      throw error;
    }
  }

  disconnect() { return this.transport.disconnect(); }

  async getSnapshot(): Promise<OBSSnapshot> {
    const [version, profiles, collections, scenes, record, stream] = await Promise.all([
      this.transport.call("GetVersion"), this.transport.call("GetProfileList"),
      this.transport.call("GetSceneCollectionList"), this.transport.call("GetSceneList"),
      this.transport.call("GetRecordStatus"), this.transport.call("GetStreamStatus"),
    ]);
    const discovered = new Set((scenes.scenes ?? []).map((scene: { sceneName: string }) => scene.sceneName));
    return {
      obsVersion: version.obsVersion,
      profile: profiles.currentProfileName,
      sceneCollection: collections.currentSceneCollectionName,
      programScene: scenes.currentProgramSceneName,
      recording: Boolean(record.outputActive),
      streaming: Boolean(stream.outputActive),
      availableScenes: APPROVED_SCENES.filter((scene) => discovered.has(scene)),
    };
  }

  async getReadiness() {
    const [sceneResult, inputResult] = await Promise.all([
      this.transport.call("GetSceneList"), this.transport.call("GetInputList"),
    ]);
    const scenes = new Set((sceneResult.scenes ?? []).map((item: { sceneName: string }) => item.sceneName));
    const inputs = new Set((inputResult.inputs ?? []).map((item: { inputName: string }) => item.inputName));
    const checks: Array<{ id: string; label: string; ready: boolean; reason: string | null }> = APPROVED_SCENES.map((scene) => ({
      id: `scene:${scene}`, label: `Scene: ${scene}`, ready: scenes.has(scene),
      reason: scenes.has(scene) ? null : "Required OBS scene is missing.",
    }));
    for (const source of REQUIRED_SOURCES) {
      if (!inputs.has(source.name)) {
        checks.push({ id: `source:${source.name}`, label: source.label, ready: false, reason: "Required OBS source is missing." });
        continue;
      }
      try {
        if (source.kind === "audio") {
          const result = await this.transport.call("GetInputMute", { inputName: source.name });
          const ready = result.inputMuted === false;
          checks.push({ id: `source:${source.name}`, label: source.label, ready, reason: ready ? null : "OBS microphone source is muted." });
        } else {
          const result = await this.transport.call("GetSourceScreenshot", { sourceName: source.name, imageFormat: "png", imageWidth: 160 });
          const ready = typeof result.imageData === "string" && result.imageData.startsWith("data:image/png");
          checks.push({ id: `source:${source.name}`, label: source.label, ready, reason: ready ? null : "OBS could not produce a preview from this source." });
        }
      } catch {
        checks.push({ id: `source:${source.name}`, label: source.label, ready: false, reason: source.kind === "audio" ? "OBS could not verify the microphone source." : "OBS could not produce a preview from this source." });
      }
    }
    return checks;
  }

  async setProgramScene(scene: string) {
    if (!APPROVED_SCENES.includes(scene as ApprovedScene)) throw new Error(`${scene} is not an approved Like TAC scene.`);
    await this.transport.call("SetCurrentProgramScene", { sceneName: scene });
  }

  async startRecord() {
    const status = await this.transport.call("GetRecordStatus");
    if (status.outputActive) throw new Error("OBS is already recording.");
    await this.transport.call("StartRecord");
  }

  async stopRecord() { await this.transport.call("StopRecord"); }

  subscribe(event: string, listener: (...args: any[]) => void) {
    this.transport.on(event, listener);
    return () => this.transport.off(event, listener);
  }

  async getSourcePreview(sourceName: string) {
    return this.transport.call("GetSourceScreenshot", { sourceName, imageFormat: "png", imageWidth: 640 });
  }

  async updateAssetPath(sourceName: string, localFile: string) {
    await this.transport.call("SetInputSettings", { inputName: sourceName, inputSettings: { local_file: localFile }, overlay: true });
  }
}

export function createOBSClient() {
  return new OBSClient(new OBSWebSocket() as unknown as RawTransport);
}
