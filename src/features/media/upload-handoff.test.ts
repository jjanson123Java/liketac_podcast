import { describe, expect, test } from "vitest";

import {
  cancelUploadHandoff,
  claimUploadRole,
  completeUploadRole,
  createUploadHandoff,
  hashUploadHandoffSecret,
  type UploadHandoffRecord,
  type UploadHandoffStore,
} from "./upload-handoff";

function memoryStore() {
  const rows = new Map<string, UploadHandoffRecord>();
  const store: UploadHandoffStore = {
    async create(record) { rows.set(record.id, record); },
    async findBySecretHash(secretHash) {
      return [...rows.values()].find((row) => row.secretHash === secretHash) ?? null;
    },
    async findById(id) { return rows.get(id) ?? null; },
    async claim(id, role, now) {
      const row = rows.get(id);
      if (!row || row.cancelledAt || row.expiresAt <= now) return null;
      if (role === "teaser") {
        if (row.teaserClaimedAt || row.teaserCompletedAt) return null;
        row.teaserClaimedAt = now;
      } else {
        if (row.fullClaimedAt || row.fullCompletedAt) return null;
        row.fullRole = role;
        row.fullClaimedAt = now;
      }
      return row;
    },
    async complete(id, role, now) {
      const row = rows.get(id);
      if (!row || row.cancelledAt) return null;
      if (role === "teaser") {
        if (!row.teaserClaimedAt || row.teaserCompletedAt) return null;
        row.teaserCompletedAt = now;
      } else {
        if (row.fullRole !== role || !row.fullClaimedAt || row.fullCompletedAt) return null;
        row.fullCompletedAt = now;
      }
      return row;
    },
    async cancel(id, adminUserId, now) {
      const row = rows.get(id);
      if (!row || row.adminUserId !== adminUserId || row.cancelledAt) return null;
      row.cancelledAt = now;
      return row;
    },
  };
  return { rows, store };
}

describe("Companion upload handoffs", () => {
  test("returns a secret once while persisting only its hash and a ten-minute expiry", async () => {
    const { rows, store } = memoryStore();
    const now = new Date("2026-11-11T12:00:00Z");
    const handoff = await createUploadHandoff({ episodeId: "episode-1", adminUserId: "admin-1" }, { store, now });
    const saved = rows.get(handoff.id)!;

    expect(handoff.secret).toBeTruthy();
    expect(saved).not.toHaveProperty("secret");
    expect(saved.secretHash).toBe(hashUploadHandoffSecret(handoff.secret));
    expect(saved.episodeId).toBe("episode-1");
    expect(saved.adminUserId).toBe("admin-1");
    expect(saved.expiresAt.getTime() - now.getTime()).toBe(10 * 60 * 1000);
  });

  test("binds claims to the secret, episode, and one full plus one teaser role", async () => {
    const { store } = memoryStore();
    const now = new Date("2026-11-11T12:00:00Z");
    const handoff = await createUploadHandoff({ episodeId: "episode-1", adminUserId: "admin-1" }, { store, now });

    await expect(claimUploadRole({ secret: handoff.secret, episodeId: "episode-2", role: "video" }, { store, now })).rejects.toThrow("INVALID_UPLOAD_HANDOFF");
    await expect(claimUploadRole({ secret: "wrong", episodeId: "episode-1", role: "video" }, { store, now })).rejects.toThrow("INVALID_UPLOAD_HANDOFF");
    await expect(claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "teaser" }, { store, now })).rejects.toThrow("UPLOAD_FULL_ROLE_REQUIRED");
    await expect(claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "video" }, { store, now })).resolves.toMatchObject({ fullRole: "video" });
    await expect(claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "audio" }, { store, now })).rejects.toThrow("UPLOAD_ROLE_ALREADY_CLAIMED");
    await expect(claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "teaser" }, { store, now })).resolves.toBeTruthy();
    await expect(claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "teaser" }, { store, now })).rejects.toThrow("UPLOAD_ROLE_ALREADY_CLAIMED");
  });

  test("rejects expired and cancelled handoffs", async () => {
    const { store } = memoryStore();
    const now = new Date("2026-11-11T12:00:00Z");
    const expired = await createUploadHandoff({ episodeId: "episode-1", adminUserId: "admin-1" }, { store, now });
    await expect(claimUploadRole({ secret: expired.secret, episodeId: "episode-1", role: "video" }, { store, now: new Date(now.getTime() + 10 * 60 * 1000) })).rejects.toThrow("UPLOAD_HANDOFF_EXPIRED");

    const cancelled = await createUploadHandoff({ episodeId: "episode-1", adminUserId: "admin-1" }, { store, now });
    await cancelUploadHandoff({ id: cancelled.id, adminUserId: "admin-1" }, { store, now });
    await expect(claimUploadRole({ secret: cancelled.secret, episodeId: "episode-1", role: "video" }, { store, now })).rejects.toThrow("UPLOAD_HANDOFF_CANCELLED");
  });

  test("completes a claimed role once and rejects role mismatch or replay", async () => {
    const { store } = memoryStore();
    const now = new Date("2026-11-11T12:00:00Z");
    const handoff = await createUploadHandoff({ episodeId: "episode-1", adminUserId: "admin-1" }, { store, now });
    await claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "video" }, { store, now });

    await expect(completeUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "audio" }, { store, now })).rejects.toThrow("UPLOAD_ROLE_MISMATCH");
    await expect(completeUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "video" }, { store, now })).resolves.toMatchObject({ fullCompletedAt: now });
    await expect(completeUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "video" }, { store, now })).rejects.toThrow("UPLOAD_ROLE_ALREADY_COMPLETED");
  });

  test("allows only one winner for concurrent duplicate claims", async () => {
    const { store } = memoryStore();
    const now = new Date("2026-11-11T12:00:00Z");
    const handoff = await createUploadHandoff({ episodeId: "episode-1", adminUserId: "admin-1" }, { store, now });
    const results = await Promise.allSettled([
      claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "video" }, { store, now }),
      claimUploadRole({ secret: handoff.secret, episodeId: "episode-1", role: "video" }, { store, now }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });
});
