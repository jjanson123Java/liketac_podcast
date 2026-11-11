import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";

import { createContentDb } from "@/db/content/client";
import { companionUploadHandoffs } from "@/db/content/schema";

export const UPLOAD_HANDOFF_LIFETIME_MS = 10 * 60 * 1000;

export type UploadHandoffRole = "video" | "audio" | "teaser";

export type UploadHandoffRecord = {
  id: string;
  episodeId: string;
  adminUserId: string;
  secretHash: string;
  fullRole: "video" | "audio" | null;
  fullAttemptId: string | null;
  fullClaimedAt: Date | null;
  fullCompletedAt: Date | null;
  teaserClaimedAt: Date | null;
  teaserAttemptId: string | null;
  teaserCompletedAt: Date | null;
  expiresAt: Date;
  cancelledAt: Date | null;
  createdAt: Date;
};

export type UploadHandoffStore = {
  create(record: UploadHandoffRecord): Promise<void>;
  findBySecretHash(secretHash: string): Promise<UploadHandoffRecord | null>;
  findById(id: string): Promise<UploadHandoffRecord | null>;
  claim(id: string, role: UploadHandoffRole, attemptId: string, now: Date): Promise<UploadHandoffRecord | null>;
  complete(id: string, role: UploadHandoffRole, now: Date): Promise<UploadHandoffRecord | null>;
  cancel(id: string, adminUserId: string, now: Date): Promise<UploadHandoffRecord | null>;
};

type Dependencies = { store?: UploadHandoffStore; now?: Date };

export function hashUploadHandoffSecret(secret: string) {
  return createHash("sha256").update(secret).digest("base64url");
}

function newSecret() {
  return randomBytes(32).toString("base64url");
}

function asRecord(row: typeof companionUploadHandoffs.$inferSelect): UploadHandoffRecord {
  if (row.fullRole !== null && row.fullRole !== "video" && row.fullRole !== "audio") {
    throw new Error("INVALID_UPLOAD_HANDOFF");
  }
  return { ...row, fullRole: row.fullRole };
}

export const contentUploadHandoffStore: UploadHandoffStore = {
  async create(record) {
    await createContentDb().insert(companionUploadHandoffs).values(record);
  },
  async findBySecretHash(secretHash) {
    const [row] = await createContentDb().select().from(companionUploadHandoffs).where(eq(companionUploadHandoffs.secretHash, secretHash)).limit(1);
    return row ? asRecord(row) : null;
  },
  async findById(id) {
    const [row] = await createContentDb().select().from(companionUploadHandoffs).where(eq(companionUploadHandoffs.id, id)).limit(1);
    return row ? asRecord(row) : null;
  },
  async claim(id, role, attemptId, now) {
    const available = and(
      eq(companionUploadHandoffs.id, id),
      gt(companionUploadHandoffs.expiresAt, now),
      isNull(companionUploadHandoffs.cancelledAt),
    );
    const values = role === "teaser"
      ? { teaserClaimedAt: now, teaserAttemptId: attemptId }
      : { fullRole: role, fullClaimedAt: now, fullAttemptId: attemptId };
    const unclaimed = role === "teaser"
      ? and(available, isNull(companionUploadHandoffs.teaserClaimedAt), isNull(companionUploadHandoffs.teaserCompletedAt))
      : and(available, isNull(companionUploadHandoffs.fullRole), isNull(companionUploadHandoffs.fullClaimedAt), isNull(companionUploadHandoffs.fullCompletedAt));
    const [row] = await createContentDb().update(companionUploadHandoffs).set(values).where(unclaimed).returning();
    return row ? asRecord(row) : null;
  },
  async complete(id, role, now) {
    const roleCondition = role === "teaser"
      ? and(isNull(companionUploadHandoffs.teaserCompletedAt), gt(companionUploadHandoffs.teaserClaimedAt, new Date(0)))
      : and(eq(companionUploadHandoffs.fullRole, role), isNull(companionUploadHandoffs.fullCompletedAt), gt(companionUploadHandoffs.fullClaimedAt, new Date(0)));
    const values = role === "teaser" ? { teaserCompletedAt: now } : { fullCompletedAt: now };
    const [row] = await createContentDb().update(companionUploadHandoffs).set(values).where(and(eq(companionUploadHandoffs.id, id), isNull(companionUploadHandoffs.cancelledAt), roleCondition)).returning();
    return row ? asRecord(row) : null;
  },
  async cancel(id, adminUserId, now) {
    const [row] = await createContentDb().update(companionUploadHandoffs).set({ cancelledAt: now }).where(and(eq(companionUploadHandoffs.id, id), eq(companionUploadHandoffs.adminUserId, adminUserId), isNull(companionUploadHandoffs.cancelledAt))).returning();
    return row ? asRecord(row) : null;
  },
};

function deps({ store = contentUploadHandoffStore, now = new Date() }: Dependencies) {
  return { store, now };
}

export async function createUploadHandoff(
  input: { episodeId: string; adminUserId: string },
  dependencies: Dependencies = {},
) {
  const { store, now } = deps(dependencies);
  const secret = newSecret();
  const record: UploadHandoffRecord = {
    id: randomUUID(),
    episodeId: input.episodeId,
    adminUserId: input.adminUserId,
    secretHash: hashUploadHandoffSecret(secret),
    fullRole: null,
    fullAttemptId: null,
    fullClaimedAt: null,
    fullCompletedAt: null,
    teaserClaimedAt: null,
    teaserAttemptId: null,
    teaserCompletedAt: null,
    expiresAt: new Date(now.getTime() + UPLOAD_HANDOFF_LIFETIME_MS),
    cancelledAt: null,
    createdAt: now,
  };
  await store.create(record);
  return { id: record.id, secret, episodeId: record.episodeId, expiresAt: record.expiresAt };
}

async function findBoundHandoff(
  input: { secret: string; episodeId: string },
  dependencies: Dependencies,
) {
  const { store, now } = deps(dependencies);
  const record = await store.findBySecretHash(hashUploadHandoffSecret(input.secret));
  if (!record || record.episodeId !== input.episodeId) throw new Error("INVALID_UPLOAD_HANDOFF");
  if (record.cancelledAt) throw new Error("UPLOAD_HANDOFF_CANCELLED");
  if (record.expiresAt <= now) throw new Error("UPLOAD_HANDOFF_EXPIRED");
  return { record, store, now };
}

export async function claimUploadRole(
  input: { secret: string; episodeId: string; role: UploadHandoffRole; attemptId: string },
  dependencies: Dependencies = {},
) {
  const { record, store, now } = await findBoundHandoff(input, dependencies);
  if (input.role === "teaser" && !record.fullRole) throw new Error("UPLOAD_FULL_ROLE_REQUIRED");
  if (input.role === "teaser" ? record.teaserCompletedAt : record.fullCompletedAt) throw new Error("UPLOAD_ROLE_ALREADY_COMPLETED");
  const claimedAt = input.role === "teaser" ? record.teaserClaimedAt : record.fullClaimedAt;
  const claimedAttemptId = input.role === "teaser" ? record.teaserAttemptId : record.fullAttemptId;
  if (claimedAt && claimedAttemptId === input.attemptId) {
    if (input.role !== "teaser" && record.fullRole !== input.role) throw new Error("UPLOAD_ROLE_MISMATCH");
    return record;
  }
  if (claimedAt) throw new Error("UPLOAD_ROLE_ALREADY_CLAIMED");
  const claimed = await store.claim(record.id, input.role, input.attemptId, now);
  if (!claimed) throw new Error("UPLOAD_ROLE_ALREADY_CLAIMED");
  return claimed;
}

export async function completeClaimedUploadRole(
  input: { id: string; episodeId: string; role: UploadHandoffRole },
  dependencies: Dependencies = {},
) {
  const { store, now } = deps(dependencies);
  const record = await store.findById(input.id);
  if (!record || record.episodeId !== input.episodeId || record.cancelledAt) throw new Error("INVALID_UPLOAD_HANDOFF");
  if (input.role !== "teaser" && record.fullRole !== input.role) throw new Error("UPLOAD_ROLE_MISMATCH");
  const completedAt = input.role === "teaser" ? record.teaserCompletedAt : record.fullCompletedAt;
  if (completedAt) return record;
  const claimedAt = input.role === "teaser" ? record.teaserClaimedAt : record.fullClaimedAt;
  if (!claimedAt) throw new Error("UPLOAD_ROLE_NOT_CLAIMED");
  const completed = await store.complete(record.id, input.role, now);
  if (!completed) throw new Error("UPLOAD_ROLE_ALREADY_COMPLETED");
  return completed;
}

export async function completeUploadRole(
  input: { secret: string; episodeId: string; role: UploadHandoffRole },
  dependencies: Dependencies = {},
) {
  const { record, store, now } = await findBoundHandoff(input, dependencies);
  if (input.role !== "teaser" && record.fullRole && record.fullRole !== input.role) throw new Error("UPLOAD_ROLE_MISMATCH");
  const completedAt = input.role === "teaser" ? record.teaserCompletedAt : record.fullCompletedAt;
  const claimedAt = input.role === "teaser" ? record.teaserClaimedAt : record.fullClaimedAt;
  if (completedAt) throw new Error("UPLOAD_ROLE_ALREADY_COMPLETED");
  if (!claimedAt) throw new Error("UPLOAD_ROLE_NOT_CLAIMED");
  const completed = await store.complete(record.id, input.role, now);
  if (!completed) throw new Error("UPLOAD_ROLE_ALREADY_COMPLETED");
  return completed;
}

export async function cancelUploadHandoff(
  input: { id: string; adminUserId: string },
  dependencies: Dependencies = {},
) {
  const { store, now } = deps(dependencies);
  const cancelled = await store.cancel(input.id, input.adminUserId, now);
  if (!cancelled) throw new Error("INVALID_UPLOAD_HANDOFF");
  return cancelled;
}

export async function getUploadHandoffStatus(
  input: { id: string; adminUserId: string },
  dependencies: Dependencies = {},
) {
  const { store } = deps(dependencies);
  const record = await store.findById(input.id);
  if (!record || record.adminUserId !== input.adminUserId) throw new Error("INVALID_UPLOAD_HANDOFF");
  return {
    id: record.id,
    episodeId: record.episodeId,
    fullRole: record.fullRole,
    fullComplete: Boolean(record.fullCompletedAt),
    teaserComplete: Boolean(record.teaserCompletedAt),
    expiresAt: record.expiresAt,
    cancelled: Boolean(record.cancelledAt),
  };
}
