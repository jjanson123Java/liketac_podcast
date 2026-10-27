import { and, eq, gt, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { adminProfiles, mfaChallenges, sessions, trustedDevices, users } from "@/db/identity/schema";
import { verifyPassword } from "@/features/auth/password-hash";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";
import { createOpaqueToken, hashOpaqueToken, sessionCookie, SESSION_MAX_AGE_SECONDS } from "@/features/auth/session";
import { createMfaCode, hashMfaCode, MFA_EXPIRY_MS } from "@/features/admin/mfa";
import { hashTrustedDeviceToken, TRUSTED_DEVICE_COOKIE_NAME } from "@/features/admin/trusted-device";
import { sendEmail } from "@/features/email/send-email";
import { adminMfaEmail } from "@/features/email/templates/admin-mfa";
import { recordAudit } from "@/features/admin/audit";

export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "admin-login", keyHash: createRateLimitKey(requestIp(request), identifier), limit: 5, windowMs: 30 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Wait 30 minutes and try again." }, { status: 429 });
  const [record] = await db.select({ user: users, securityEmail: adminProfiles.securityEmail }).from(users).leftJoin(adminProfiles, eq(adminProfiles.userId, users.id)).where(and(or(eq(users.username, identifier), eq(users.email, identifier)), eq(users.role, "admin"), eq(users.status, "active"), isNull(users.deletedAt))).limit(1);
  if (!record || !(await verifyPassword(password, record.user.passwordHash))) return NextResponse.json({ error: "Administrator credentials are incorrect." }, { status: 401 });
  const trustedToken = request.headers.get("cookie")?.match(new RegExp(`${TRUSTED_DEVICE_COOKIE_NAME}=([^;]+)`))?.[1];
  if (trustedToken) {
    const [trusted] = await db.select().from(trustedDevices).where(and(eq(trustedDevices.userId, record.user.id), eq(trustedDevices.tokenHash, hashTrustedDeviceToken(decodeURIComponent(trustedToken))), gt(trustedDevices.expiresAt, new Date()), isNull(trustedDevices.revokedAt))).limit(1);
    if (trusted) {
      const sessionToken = createOpaqueToken();
      await db.insert(sessions).values({ userId: record.user.id, tokenHash: hashOpaqueToken(sessionToken), expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000) });
      await recordAudit(db, { actorUserId: record.user.id, action: "admin.login.trusted_device", ipAddress: requestIp(request) });
      const response = NextResponse.redirect(new URL(record.user.mustChangePassword ? "/admin/change-password" : "/admin", request.url), 303); response.cookies.set(sessionCookie(sessionToken)); return response;
    }
  }
  await db.update(mfaChallenges).set({ invalidatedAt: new Date() }).where(and(eq(mfaChallenges.userId, record.user.id), isNull(mfaChallenges.usedAt), isNull(mfaChallenges.invalidatedAt)));
  const code = createMfaCode();
  const [challenge] = await db.insert(mfaChallenges).values({ userId: record.user.id, codeHash: hashMfaCode(code), expiresAt: new Date(Date.now() + MFA_EXPIRY_MS) }).returning({ id: mfaChallenges.id });
  try { await sendEmail({ to: record.securityEmail ?? record.user.email, ...adminMfaEmail(code) }); } catch { return NextResponse.json({ error: "Administrator verification email is unavailable. Contact the site owner." }, { status: 503 }); }
  await recordAudit(db, { actorUserId: record.user.id, action: "admin.mfa.sent", targetId: challenge.id, ipAddress: requestIp(request) });
  return NextResponse.redirect(new URL(`/admin/verify?challenge=${challenge.id}`, request.url), 303);
}
