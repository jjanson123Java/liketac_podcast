import { beforeEach, describe, expect, test, vi } from "vitest";

import { POST } from "./route";

const handleUploadMock = vi.fn();
const requireAdminMock = vi.fn();
const claimUploadRoleMock = vi.fn();
const completeClaimedUploadRoleMock = vi.fn();
const episodeExistsMock = vi.fn();
const headMock = vi.fn();
const insertValuesMock = vi.fn();
const onConflictDoNothingMock = vi.fn();

vi.mock("@vercel/blob/client", () => ({ handleUpload: (...args: unknown[]) => handleUploadMock(...args) }));
vi.mock("@vercel/blob", () => ({ head: (...args: unknown[]) => headMock(...args) }));
vi.mock("@/features/admin/authorization", () => ({ requireAdmin: () => requireAdminMock() }));
vi.mock("@/features/media/episode-exists", () => ({ episodeExists: (...args: unknown[]) => episodeExistsMock(...args) }));
vi.mock("@/features/media/upload-handoff", () => ({
  claimUploadRole: (...args: unknown[]) => claimUploadRoleMock(...args),
  completeClaimedUploadRole: (...args: unknown[]) => completeClaimedUploadRoleMock(...args),
}));
vi.mock("@/features/admin/audit", () => ({ recordAudit: vi.fn() }));
vi.mock("@/db/identity/client", () => ({ createIdentityDb: vi.fn(() => ({})) }));
vi.mock("@/db/content/client", () => ({
  createContentDb: vi.fn(() => ({
    insert: vi.fn(() => ({ values: insertValuesMock })),
  })),
}));

type UploadCallbacks = {
  onBeforeGenerateToken(pathname: string, clientPayload: string | null): Promise<unknown>;
  onUploadCompleted(input: { blob: { url: string; pathname: string }; tokenPayload: string | null }): Promise<void>;
};

function request(headers?: HeadersInit) {
  return new Request("https://liketac.live/api/admin/podcasts/upload", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: {} }),
  });
}

function payload(role: string, episodeId = "episode-1") {
  return JSON.stringify({ episodeId, role, originalFilename: `recording.${role === "audio" ? "m4a" : "mp4"}` });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ userId: "admin-1" });
  episodeExistsMock.mockResolvedValue(true);
  claimUploadRoleMock.mockResolvedValue({ id: "handoff-1", episodeId: "episode-1", fullRole: "video", expiresAt: new Date("2026-11-11T12:10:00Z") });
  completeClaimedUploadRoleMock.mockResolvedValue({ id: "handoff-1", fullCompletedAt: new Date() });
  headMock.mockResolvedValue({ contentType: "video/mp4", size: 1_000 });
  onConflictDoNothingMock.mockResolvedValue(undefined);
  insertValuesMock.mockReturnValue({ onConflictDoNothing: onConflictDoNothingMock });
  handleUploadMock.mockResolvedValue({ type: "blob.generate-client-token", clientToken: "token" });
});

describe("private podcast Blob upload", () => {
  test("retains authenticated browser-admin uploads", async () => {
    handleUploadMock.mockImplementation(async (options: UploadCallbacks) => {
      const authorization = await options.onBeforeGenerateToken("episodes/episode-1/video-recording.mp4", payload("video"));
      expect(authorization).toMatchObject({ allowedContentTypes: expect.arrayContaining(["video/mp4"]) });
      return { ok: true };
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(claimUploadRoleMock).not.toHaveBeenCalled();
  });

  test("authorizes one Companion full upload with its handoff secret", async () => {
    requireAdminMock.mockRejectedValue(new Error("ADMIN_AUTHENTICATION_REQUIRED"));
    handleUploadMock.mockImplementation(async (options: UploadCallbacks) => {
      await options.onBeforeGenerateToken("episodes/episode-1/video-recording.mp4", payload("video"));
      return { ok: true };
    });
    const response = await POST(request({ authorization: "Bearer handoff-secret" }));
    expect(response.status).toBe(200);
    expect(claimUploadRoleMock).toHaveBeenCalledWith({ secret: "handoff-secret", episodeId: "episode-1", role: "video" });
  });

  test("rejects Companion upload without a valid handoff", async () => {
    requireAdminMock.mockRejectedValue(new Error("ADMIN_AUTHENTICATION_REQUIRED"));
    claimUploadRoleMock.mockRejectedValue(new Error("UPLOAD_HANDOFF_EXPIRED"));
    handleUploadMock.mockImplementation(async (options: UploadCallbacks) => {
      await options.onBeforeGenerateToken("episodes/episode-1/video-recording.mp4", payload("video"));
    });
    const response = await POST(request({ authorization: "Bearer expired" }));
    expect(response.status).toBe(400);
  });

  test("rejects a mismatched object path before issuing a token", async () => {
    handleUploadMock.mockImplementation(async (options: UploadCallbacks) => {
      await options.onBeforeGenerateToken("episodes/another/video-recording.mp4", payload("video"));
    });
    const response = await POST(request());
    expect(response.status).toBe(400);
  });

  test("validates callback MIME and size before recording and completing a handoff role", async () => {
    requireAdminMock.mockRejectedValue(new Error("ADMIN_AUTHENTICATION_REQUIRED"));
    headMock.mockResolvedValue({ contentType: "application/octet-stream", size: 1_000 });
    handleUploadMock.mockImplementation(async (options: UploadCallbacks) => {
      await options.onUploadCompleted({
        blob: { url: "https://blob.example/video", pathname: "episodes/episode-1/video-recording.mp4" },
        tokenPayload: JSON.stringify({ episodeId: "episode-1", role: "video", originalFilename: "recording.mp4", handoffId: "handoff-1" }),
      });
    });
    const response = await POST(request({ authorization: "Bearer handoff-secret" }));
    expect(response.status).toBe(400);
    expect(insertValuesMock).not.toHaveBeenCalled();
    expect(completeClaimedUploadRoleMock).not.toHaveBeenCalled();
  });

  test("records a completed callback idempotently and marks the claimed role complete", async () => {
    requireAdminMock.mockRejectedValue(new Error("ADMIN_AUTHENTICATION_REQUIRED"));
    handleUploadMock.mockImplementation(async (options: UploadCallbacks) => {
      const callback = {
        blob: { url: "https://blob.example/video", pathname: "episodes/episode-1/video-recording.mp4" },
        tokenPayload: JSON.stringify({ episodeId: "episode-1", role: "video", originalFilename: "recording.mp4", handoffId: "handoff-1" }),
      };
      await options.onUploadCompleted(callback);
      await options.onUploadCompleted(callback);
      return { ok: true };
    });
    const response = await POST(request({ authorization: "Bearer handoff-secret" }));
    expect(response.status).toBe(200);
    expect(insertValuesMock).toHaveBeenCalledTimes(2);
    expect(completeClaimedUploadRoleMock).toHaveBeenCalledTimes(2);
  });
});
