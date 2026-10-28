import { describe, expect, test, vi } from "vitest";
import { OBSAuthenticationError, OBSClient } from "./obs-client";

function transport(overrides: Record<string, unknown> = {}) {
  return {
    connect: vi.fn(async () => ({ obsWebSocketVersion: "5.6.2" })),
    disconnect: vi.fn(async () => undefined),
    call: vi.fn(async (request: string) => {
      const responses: Record<string, unknown> = {
        GetVersion: { obsVersion: "33.0.0" },
        GetProfileList: { currentProfileName: "LikeTACLive" },
        GetSceneCollectionList: { currentSceneCollectionName: "LikeTACLive Studio" },
        GetSceneList: { currentProgramSceneName: "00 - Standby", scenes: [{ sceneName: "70 - Audio Only" }, { sceneName: "00 - Standby" }, { sceneName: "Unknown" }] },
        GetRecordStatus: { outputActive: false },
        GetStreamStatus: { outputActive: false },
      };
      return responses[request] ?? {};
    }),
    on: vi.fn(),
    off: vi.fn(),
    ...overrides,
  };
}

describe("OBSClient", () => {
  test("connects to loopback and returns the actual Like TAC snapshot", async () => {
    const raw = transport();
    const client = new OBSClient(raw);
    await client.connect({ host: "127.0.0.1", port: 4455, password: "secret" });
    expect(raw.connect).toHaveBeenCalledWith("ws://127.0.0.1:4455", "secret", expect.objectContaining({ rpcVersion: 1, eventSubscriptions: expect.any(Number) }));
    await expect(client.getSnapshot()).resolves.toMatchObject({
      obsVersion: "33.0.0", profile: "LikeTACLive", sceneCollection: "LikeTACLive Studio",
      programScene: "00 - Standby", recording: false, streaming: false,
      availableScenes: ["00 - Standby", "70 - Audio Only"],
    });
  });

  test("distinguishes an OBS authentication rejection", async () => {
    const raw = transport({ connect: vi.fn(async () => { throw Object.assign(new Error("Authentication failed"), { code: 4009 }); }) });
    await expect(new OBSClient(raw).connect({ host: "localhost", port: 4455, password: "wrong" })).rejects.toBeInstanceOf(OBSAuthenticationError);
  });

  test("prevents unapproved scene requests and duplicate recording starts", async () => {
    const raw = transport();
    const client = new OBSClient(raw);
    await expect(client.setProgramScene("Untrusted Scene")).rejects.toThrow("not an approved Like TAC scene");
    raw.call.mockImplementation(async (request: string) => request === "GetRecordStatus" ? { outputActive: true } : {});
    await expect(client.startRecord()).rejects.toThrow("already recording");
  });

  test("reports exact readiness for required Like TAC scenes and sources", async () => {
    const raw = transport();
    raw.call.mockImplementation(async (request: string, data?: Record<string, unknown>) => {
      if (request === "GetSceneList") return { scenes: [{ sceneName: "00 - Standby" }, { sceneName: "10 - Host Only" }] };
      if (request === "GetInputList") return { inputs: [{ inputName: "LCS_MIC_Host_Primary" }, { inputName: "CAM_Host_Primary" }] };
      if (request === "GetSceneItemList") return { sceneItems: data?.sceneName === "10 - Host Only" ? [{ sourceName: "LCS_MIC_Host_Primary", sceneItemEnabled: true }, { sourceName: "CAM_Host_Primary", sceneItemEnabled: true }] : [] };
      if (request === "GetSourceActive") return { videoActive: data?.sourceName === "CAM_Host_Primary", videoShowing: true };
      if (request === "GetInputMute") return { inputMuted: false };
      if (request === "GetSourceScreenshot") return { imageData: "data:image/png;base64,preview" };
      return {};
    });
    raw.on.mockImplementation((event: string, listener: (value: unknown) => void) => {
      if (event === "InputVolumeMeters") queueMicrotask(() => listener({ inputs: [{ inputName: "LCS_MIC_Host_Primary", inputLevelsMul: [[0.2, 0.1, 0.05]] }] }));
    });
    const result = await new OBSClient(raw).getReadiness();
    expect(result).toContainEqual({ id: "scene:50 - Host Presentation", label: "Scene: 50 - Host Presentation", ready: false, reason: "Required OBS scene is missing." });
    expect(result).toContainEqual({ id: "source:CAM_Host_Primary", label: "Host primary camera", ready: true, reason: null });
    expect(result).toContainEqual({ id: "source:DISPLAY_Presentation", label: "Presentation display", ready: false, reason: "Required OBS source is missing." });
  });
});
