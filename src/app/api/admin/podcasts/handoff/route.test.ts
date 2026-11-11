import { beforeEach, describe, expect, test, vi } from "vitest";

import { DELETE, GET, POST } from "./route";

const requireAdminMock = vi.fn();
const createUploadHandoffMock = vi.fn();
const getUploadHandoffStatusMock = vi.fn();
const cancelUploadHandoffMock = vi.fn();
const episodeExistsMock = vi.fn();

vi.mock("@/features/admin/authorization", () => ({ requireAdmin: () => requireAdminMock() }));
vi.mock("@/features/media/upload-handoff", () => ({
  createUploadHandoff: (...args: unknown[]) => createUploadHandoffMock(...args),
  getUploadHandoffStatus: (...args: unknown[]) => getUploadHandoffStatusMock(...args),
  cancelUploadHandoff: (...args: unknown[]) => cancelUploadHandoffMock(...args),
}));
vi.mock("@/features/media/episode-exists", () => ({ episodeExists: (...args: unknown[]) => episodeExistsMock(...args) }));

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  episodeExistsMock.mockResolvedValue(true);
  createUploadHandoffMock.mockResolvedValue({ id: "handoff-1", secret: "one-time-secret", episodeId: "episode-1", expiresAt: new Date("2026-11-11T12:10:00Z") });
  getUploadHandoffStatusMock.mockResolvedValue({ id: "handoff-1", fullComplete: false, teaserComplete: false, cancelled: false });
  cancelUploadHandoffMock.mockResolvedValue({ id: "handoff-1", cancelledAt: new Date() });
});

describe("Companion upload handoff API", () => {
  test("requires an authenticated administrator", async () => {
    requireAdminMock.mockRejectedValue(new Error("ADMIN_AUTHENTICATION_REQUIRED"));
    const response = await POST(new Request("https://liketac.live/api/admin/podcasts/handoff", { method: "POST", body: JSON.stringify({ episodeId: "episode-1" }) }));
    expect(response.status).toBe(401);
    expect(createUploadHandoffMock).not.toHaveBeenCalled();
  });

  test("creates an episode-bound handoff and returns its secret only on creation", async () => {
    const response = await POST(new Request("https://liketac.live/api/admin/podcasts/handoff", { method: "POST", body: JSON.stringify({ episodeId: "episode-1" }) }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ id: "handoff-1", secret: "one-time-secret", episodeId: "episode-1" });
    expect(createUploadHandoffMock).toHaveBeenCalledWith({ episodeId: "episode-1", adminUserId: "admin-1" });
  });

  test("does not reveal whether an invalid episode belongs to another request", async () => {
    episodeExistsMock.mockResolvedValue(false);
    const response = await POST(new Request("https://liketac.live/api/admin/podcasts/handoff", { method: "POST", body: JSON.stringify({ episodeId: "missing" }) }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unable to prepare that upload." });
  });

  test("returns status without returning the one-time secret", async () => {
    const response = await GET(new Request("https://liketac.live/api/admin/podcasts/handoff?id=handoff-1"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: "handoff-1", fullComplete: false, teaserComplete: false });
    expect(body).not.toHaveProperty("secret");
  });

  test("allows only the creating administrator to revoke a handoff", async () => {
    const response = await DELETE(new Request("https://liketac.live/api/admin/podcasts/handoff?id=handoff-1", { method: "DELETE" }));
    expect(response.status).toBe(204);
    expect(cancelUploadHandoffMock).toHaveBeenCalledWith({ id: "handoff-1", adminUserId: "admin-1" });
  });
});
