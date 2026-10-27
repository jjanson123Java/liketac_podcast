import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { mfaChallenges, passwordHistory, passwordResetChallenges, sessions, trustedDevices, users } from "@/db/identity/schema";
import { hashPassword, isRecentlyUsedPassword } from "@/features/auth/password-hash";
import { validatePassword } from "@/features/auth/password-policy";
import { hashOpaqueToken } from "@/features/auth/session";

export async function POST(request: Request) {
  const form = await request.formData(); const token = String(form.get("token") ?? ""); const password = String(form.get("password") ?? "");
  if (password !== form.get("confirmPassword") || validatePassword(password).length) return NextResponse.json({ error: "The passwords must match and meet every requirement." }, { status: 400 });
  const db = createIdentityDb();
  const [record] = await db.select({ challenge: passwordResetChallenges, user: users }).from(passwordResetChallenges).innerJoin(users, eq(users.id, passwordResetChallenges.userId)).where(and(eq(passwordResetChallenges.tokenHash, hashOpaqueToken(token)), eq(users.role, "admin"), eq(users.status, "active"), isNull(passwordResetChallenges.usedAt), gt(passwordResetChallenges.expiresAt, new Date()))).limit(1);
  if (!record) return NextResponse.json({ error: "This administrator reset link is invalid or expired." }, { status: 400 });
  const history = await db.select({ passwordHash: passwordHistory.passwordHash }).from(passwordHistory).where(eq(passwordHistory.userId, record.user.id)).orderBy(asc(passwordHistory.position)).limit(5);
  if (await isRecentlyUsedPassword(password, history.map((item) => item.passwordHash))) return NextResponse.json({ error: "That administrator password was used recently." }, { status: 409 });
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => { await tx.delete(passwordHistory).where(eq(passwordHistory.userId, record.user.id)); await tx.insert(passwordHistory).values([{ userId: record.user.id, passwordHash, position: 1 }, ...history.slice(0, 4).map((item, index) => ({ userId: record.user.id, passwordHash: item.passwordHash, position: index + 2 }))]); await tx.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, record.user.id)); await tx.update(passwordResetChallenges).set({ usedAt: new Date() }).where(eq(passwordResetChallenges.id, record.challenge.id)); await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, record.user.id)); await tx.update(trustedDevices).set({ revokedAt: new Date() }).where(eq(trustedDevices.userId, record.user.id)); await tx.update(mfaChallenges).set({ invalidatedAt: new Date() }).where(eq(mfaChallenges.userId, record.user.id)); });
  return NextResponse.redirect(new URL("/admin/sign-in", request.url), 303);
}
