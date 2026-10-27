import { describe, expect, test, vi } from "vitest";
import type { IdentityDb } from "@/db/identity/client";
import { claimMfaChallenge } from "./mfa-claim";

function fakeDb(claimed: boolean) {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values }));
  const returning = vi.fn().mockResolvedValue(claimed ? [{ id: "challenge" }] : []);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const transaction = vi.fn(async (callback: (tx: unknown) => unknown) => callback({ update, insert }));
  return { db: { transaction } as unknown as IdentityDb, insert, transaction };
}

const input = {
  challengeId: "00000000-0000-0000-0000-000000000001",
  userId: "00000000-0000-0000-0000-000000000002",
  sessionTokenHash: "session-hash",
  sessionExpiresAt: new Date("2030-01-01T00:00:00Z"),
};

describe("claimMfaChallenge", () => {
  test("does not create a session when another request already claimed the code", async () => {
    const { db, insert, transaction } = fakeDb(false);

    await expect(claimMfaChallenge(db, input)).resolves.toBe(false);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalled();
  });

  test("claims the code and creates session and trusted device in one transaction", async () => {
    const { db, insert } = fakeDb(true);

    await expect(claimMfaChallenge(db, { ...input, trustedDeviceTokenHash: "trusted-hash", trustedDeviceExpiresAt: new Date("2030-01-30T00:00:00Z") })).resolves.toBe(true);
    expect(insert).toHaveBeenCalledTimes(2);
  });
});
