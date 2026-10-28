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
    expect(raw.connect).toHaveBeenCalledWith("ws://127.0.0.1:4455", "secret", { rpcVersion: 1 });
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
});
