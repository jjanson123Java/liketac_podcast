import { APPROVED_SCENES, type ApprovedScene, type OBSConnectionConfig } from "../shared/contracts";
import OBSWebSocket, { EventSubscription } from "obs-websocket-js";

type RawTransport = {
  connect(url: string, password: string, options: { rpcVersion: number; eventSubscriptions: number }): Promise<unknown>;
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
  { name: "CAM_DeskPro_Presentation", label: "DeskPro presentation camera", kind: "video" },
  { name: "DISPLAY_Presentation", label: "Presentation display", kind: "video", allowConfiguredWhenInactive: true },
] as const;

export class OBSAuthenticationError extends Error {}

export class OBSClient {
  constructor(private readonly transport: RawTransport) {}

  async connect(config: OBSConnectionConfig) {
    try {
      await this.transport.connect(`ws://${config.host}:${config.port}`, config.password, {
        rpcVersion: 1,
        eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters,
      });
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
    const sourceScenes = new Map<string, string[]>();
    await Promise.all(APPROVED_SCENES.filter((scene) => scenes.has(scene)).map(async (scene) => {
      const result = await this.transport.call("GetSceneItemList", { sceneName: scene });
      for (const item of result.sceneItems ?? []) {
        if (item.sceneItemEnabled === false) continue;
        const memberships = sourceScenes.get(item.sourceName) ?? [];
        memberships.push(scene);
        sourceScenes.set(item.sourceName, memberships);
      }
    }));
    const checks: Array<{ id: string; label: string; ready: boolean; reason: string | null }> = APPROVED_SCENES.map((scene) => ({
      id: `scene:${scene}`, label: `Scene: ${scene}`, ready: scenes.has(scene),
      reason: scenes.has(scene) ? null : "Required OBS scene is missing.",
    }));
    for (const source of REQUIRED_SOURCES) {
      if (!inputs.has(source.name)) {
        checks.push({ id: `source:${source.name}`, label: source.label, ready: false, reason: "Required OBS source is missing." });
        continue;
      }
      if (!(sourceScenes.get(source.name)?.length)) {
        checks.push({ id: `source:${source.name}`, label: source.label, ready: false, reason: "OBS source is not enabled in an approved Like TAC scene." });
        continue;
      }
      try {
        if (source.kind === "audio") {
          const result = await this.transport.call("GetInputMute", { inputName: source.name });
          const levelReady = result.inputMuted === false && await this.proveAudioLevel(source.name);
          checks.push({ id: `source:${source.name}`, label: source.label, ready: levelReady, reason: result.inputMuted ? "OBS microphone source is muted." : levelReady ? null : "No live microphone level was detected. Speak into the microphone and run readiness checks again." });
        } else {
          const result = await this.transport.call("GetSourceScreenshot", { sourceName: source.name, imageFormat: "png", imageWidth: 160 });
          const currentScene = sceneResult.currentProgramSceneName as string | undefined;
          const active = !currentScene || !(sourceScenes.get(source.name) ?? []).includes(currentScene)
            ? true
            : Boolean((await this.transport.call("GetSourceActive", { sourceName: source.name })).videoActive);
          let ready = active && typeof result.imageData === "string" && result.imageData.startsWith("data:image/png");
          const owningScene = sourceScenes.get(source.name)?.[0];
          if (!ready && "allowConfiguredWhenInactive" in source && source.allowConfiguredWhenInactive === true
            && owningScene && owningScene !== currentScene) {
            const scenePreview = await this.transport.call("GetSourceScreenshot", { sourceName: owningScene, imageFormat: "png", imageWidth: 160 });
            ready = typeof scenePreview.imageData === "string" && scenePreview.imageData.startsWith("data:image/png");
          }
          checks.push({ id: `source:${source.name}`, label: source.label, ready, reason: ready ? null : "OBS could not produce a preview from this source." });
        }
      } catch {
        const currentScene = sceneResult.currentProgramSceneName as string | undefined;
        const owningScene = sourceScenes.get(source.name)?.[0];
        let sceneReady = false;
        if (source.kind === "video" && "allowConfiguredWhenInactive" in source && source.allowConfiguredWhenInactive === true
          && owningScene && owningScene !== currentScene) {
          try {
            const scenePreview = await this.transport.call("GetSourceScreenshot", { sourceName: owningScene, imageFormat: "png", imageWidth: 160 });
            sceneReady = typeof scenePreview.imageData === "string" && scenePreview.imageData.startsWith("data:image/png");
          } catch { sceneReady = false; }
        }
        checks.push({ id: `source:${source.name}`, label: source.label, ready: sceneReady, reason: sceneReady ? null : source.kind === "audio" ? "OBS could not verify the microphone source." : "OBS could not produce a preview from this source." });
      }
    }
    return checks;
  }

  private proveAudioLevel(inputName: string, timeoutMs = 1500) {
    return new Promise<boolean>((resolve) => {
      let finished = false;
      const finish = (result: boolean) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        this.transport.off("InputVolumeMeters", listener);
        resolve(result);
      };
      const listener = (event: { inputs?: Array<{ inputName?: string; inputLevelsMul?: number[][] }> }) => {
        const input = event.inputs?.find((item) => item.inputName === inputName);
        const peak = input?.inputLevelsMul?.flat().reduce((maximum, value) => Math.max(maximum, value), 0) ?? 0;
        if (peak > 0.001) finish(true);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      this.transport.on("InputVolumeMeters", listener);
    });
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
