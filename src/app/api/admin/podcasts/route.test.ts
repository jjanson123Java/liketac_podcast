import { beforeEach, describe, expect, test, vi } from "vitest";

const { db, requireAdminMock, recordAuditMock } = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
  requireAdminMock: vi.fn(),
  recordAuditMock: vi.fn(),
}));

vi.mock("@/db/content/client", () => ({ createContentDb: () => db }));
vi.mock("@/db/identity/client", () => ({ createIdentityDb: () => ({}) }));
vi.mock("@/features/admin/authorization", () => ({ requireAdmin: () => requireAdminMock() }));
vi.mock("@/features/admin/audit", () => ({ recordAudit: (...args: unknown[]) => recordAuditMock(...args) }));
vi.mock("@/features/auth/rate-limit", () => ({ requestIp: () => "127.0.0.1" }));

import { POST } from "./route";

function moveRequest(categoryId = "22222222-2222-4222-8222-222222222222") {
  const form = new FormData();
  form.set("action", "move");
  form.set("id", "11111111-1111-4111-8111-111111111111");
  form.set("categoryId", categoryId);
  return new Request("https://liketac.live/api/admin/podcasts", { method: "POST", body: form });
}

describe("moving an existing podcast episode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ userId: "admin-1" });
  });

  test("moves the episode to an active category without changing its media or publication state", async () => {
    db.select.mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [{ id: "22222222-2222-4222-8222-222222222222" }] }) }),
    });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    db.update.mockReturnValue({ set });

    const response = await POST(moveRequest());

    expect(response.status).toBe(303);
    expect(set).toHaveBeenCalledWith({
      categoryId: "22222222-2222-4222-8222-222222222222",
      updatedAt: expect.any(Date),
    });
    expect(recordAuditMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "admin.episode.move",
      targetId: "11111111-1111-4111-8111-111111111111",
    }));
  });

  test("rejects a move to a missing or deleted category", async () => {
    db.select.mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [] }) }),
    });

    const response = await POST(moveRequest("33333333-3333-4333-8333-333333333333"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Choose an active category." });
    expect(db.update).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });
});
