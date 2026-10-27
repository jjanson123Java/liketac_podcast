import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { passwordHistory, passwordResetChallenges, sessions, users } from "@/db/identity/schema";
import { hashPassword, isRecentlyUsedPassword } from "@/features/auth/password-hash";
import { validatePassword } from "@/features/auth/password-policy";
import { hashOpaqueToken } from "@/features/auth/session";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password !== form.get("confirmPassword") || validatePassword(password).length) return NextResponse.json({ error: "The passwords must match and meet every requirement." }, { status: 400 });
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "complete-password-reset", keyHash: createRateLimitKey(requestIp(request), hashOpaqueToken(token)), limit: 10, windowMs: 30 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Request a new reset link." }, { status: 429 });
  const [challenge] = await db.select().from(passwordResetChallenges).where(and(eq(passwordResetChallenges.tokenHash, hashOpaqueToken(token)), isNull(passwordResetChallenges.usedAt), gt(passwordResetChallenges.expiresAt, new Date()))).limit(1);
  if (!challenge) return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
  const history = await db.select({ passwordHash: passwordHistory.passwordHash }).from(passwordHistory).where(eq(passwordHistory.userId, challenge.userId)).orderBy(asc(passwordHistory.position)).limit(5);
  if (await isRecentlyUsedPassword(password, history.map((item) => item.passwordHash))) return NextResponse.json({ error: "That password was used recently. Try another or use the suggested password from your email." }, { status: 409 });
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.delete(passwordHistory).where(eq(passwordHistory.userId, challenge.userId));
    await tx.insert(passwordHistory).values([{ userId: challenge.userId, passwordHash, position: 1 }, ...history.slice(0, 4).map((item, index) => ({ userId: challenge.userId, passwordHash: item.passwordHash, position: index + 2 }))]);
    await tx.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, challenge.userId));
    await tx.update(passwordResetChallenges).set({ usedAt: new Date() }).where(eq(passwordResetChallenges.id, challenge.id));
    await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, challenge.userId));
  });
  return NextResponse.redirect(new URL("/sign-in", request.url), 303);
}
