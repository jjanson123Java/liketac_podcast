import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { mfaChallenges, users } from "@/db/identity/schema";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";
import { createOpaqueToken, hashOpaqueToken, sessionCookie, SESSION_MAX_AGE_SECONDS } from "@/features/auth/session";
import { isMfaChallengeValid, verifyMfaCode } from "@/features/admin/mfa";
import { createTrustedDeviceToken, hashTrustedDeviceToken, trustedDeviceCookie, TRUSTED_DEVICE_MAX_AGE_SECONDS } from "@/features/admin/trusted-device";
import { recordAudit } from "@/features/admin/audit";
import { claimMfaChallenge } from "@/features/admin/mfa-claim";

export async function POST(request: Request) {
  const form = await request.formData();
  const challengeId = String(form.get("challengeId") ?? "");
  const code = String(form.get("code") ?? "");
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "admin-mfa", keyHash: createRateLimitKey(requestIp(request), challengeId), limit: 8, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Sign in again." }, { status: 429 });
  const [challenge] = await db.select().from(mfaChallenges).innerJoin(users, eq(users.id, mfaChallenges.userId)).where(and(eq(mfaChallenges.id, challengeId), eq(users.role, "admin"), eq(users.status, "active"), gt(mfaChallenges.expiresAt, new Date()), isNull(mfaChallenges.usedAt), isNull(mfaChallenges.invalidatedAt))).limit(1);
  if (!challenge || !isMfaChallengeValid(challenge.mfa_challenges)) return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
  await db.update(mfaChallenges).set({ attemptCount: sql`${mfaChallenges.attemptCount} + 1` }).where(eq(mfaChallenges.id, challengeId));
  if (!/^\d{6}$/.test(code) || !verifyMfaCode(code, challenge.mfa_challenges.codeHash)) return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
  const sessionToken = createOpaqueToken();
  const trustedToken = form.get("trustDevice") === "yes" ? createTrustedDeviceToken() : undefined;
  const claimed = await claimMfaChallenge(db, { challengeId, userId: challenge.users.id, sessionTokenHash: hashOpaqueToken(sessionToken), sessionExpiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000), trustedDeviceTokenHash: trustedToken ? hashTrustedDeviceToken(trustedToken) : undefined, trustedDeviceExpiresAt: trustedToken ? new Date(Date.now() + TRUSTED_DEVICE_MAX_AGE_SECONDS * 1000) : undefined });
  if (!claimed) return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
  const response = NextResponse.redirect(new URL(challenge.users.mustChangePassword ? "/admin/change-password" : "/admin", request.url), 303);
  response.cookies.set(sessionCookie(sessionToken));
  if (trustedToken) response.cookies.set(trustedDeviceCookie(trustedToken));
  await recordAudit(db, { actorUserId: challenge.users.id, action: "admin.mfa.verified", ipAddress: requestIp(request) });
  return response;
}
