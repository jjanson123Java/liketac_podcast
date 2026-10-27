import { beforeEach, describe, expect, test, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ getSession }));

import { requireAdmin } from "./authorization";

describe("requireAdmin", () => {
  beforeEach(() => getSession.mockReset());

  test("blocks an administrator until the temporary password is replaced", async () => {
    getSession.mockResolvedValue({ role: "admin", mustChangePassword: true });

    await expect(requireAdmin()).rejects.toThrow("ADMIN_PASSWORD_CHANGE_REQUIRED");
  });

  test("allows an administrator with a permanent password", async () => {
    const session = { role: "admin", mustChangePassword: false };
    getSession.mockResolvedValue(session);

    await expect(requireAdmin()).resolves.toBe(session);
  });
});
