import { and, eq, gt, isNull } from "drizzle-orm";
import type { IdentityDb } from "@/db/identity/client";
import { mfaChallenges, sessions, trustedDevices } from "@/db/identity/schema";

export async function claimMfaChallenge(db: IdentityDb, input: {
  challengeId: string;
  userId: string;
  sessionTokenHash: string;
  sessionExpiresAt: Date;
  trustedDeviceTokenHash?: string;
  trustedDeviceExpiresAt?: Date;
}) {
  return db.transaction(async (tx) => {
    const claimed = await tx.update(mfaChallenges).set({ usedAt: new Date() }).where(and(eq(mfaChallenges.id, input.challengeId), isNull(mfaChallenges.usedAt), isNull(mfaChallenges.invalidatedAt), gt(mfaChallenges.expiresAt, new Date()))).returning({ id: mfaChallenges.id });
    if (!claimed.length) return false;
    await tx.insert(sessions).values({ userId: input.userId, tokenHash: input.sessionTokenHash, expiresAt: input.sessionExpiresAt });
    if (input.trustedDeviceTokenHash && input.trustedDeviceExpiresAt) await tx.insert(trustedDevices).values({ userId: input.userId, tokenHash: input.trustedDeviceTokenHash, expiresAt: input.trustedDeviceExpiresAt });
    return true;
  });
}
