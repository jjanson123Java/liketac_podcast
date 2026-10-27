import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { passwordHistory, sessions, trustedDevices, users } from "@/db/identity/schema";
import { requireAdmin } from "@/features/admin/authorization";
import { recordAudit } from "@/features/admin/audit";
import { hashPassword, isRecentlyUsedPassword } from "@/features/auth/password-hash";
import { validatePassword } from "@/features/auth/password-policy";
import { requestIp } from "@/features/auth/rate-limit";
import { sessionCookie } from "@/features/auth/session";

export async function POST(request: Request) {
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Administrator authentication required." }, { status: 401 }); }
  const form = await request.formData(); const password = String(form.get("password") ?? "");
  if (password !== form.get("confirmPassword") || validatePassword(password).length) return NextResponse.json({ error: "The passwords must match and meet every requirement." }, { status: 400 });
  const db = createIdentityDb(); const history = await db.select({ passwordHash: passwordHistory.passwordHash }).from(passwordHistory).where(eq(passwordHistory.userId, admin.userId)).orderBy(asc(passwordHistory.position)).limit(5);
  if (await isRecentlyUsedPassword(password, history.map((item) => item.passwordHash))) return NextResponse.json({ error: "That administrator password was used recently." }, { status: 409 });
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => { await tx.delete(passwordHistory).where(eq(passwordHistory.userId, admin.userId)); await tx.insert(passwordHistory).values([{ userId: admin.userId, passwordHash, position: 1 }, ...history.slice(0, 4).map((item, index) => ({ userId: admin.userId, passwordHash: item.passwordHash, position: index + 2 }))]); await tx.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, admin.userId)); await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, admin.userId)); await tx.update(trustedDevices).set({ revokedAt: new Date() }).where(eq(trustedDevices.userId, admin.userId)); });
  await recordAudit(db, { actorUserId: admin.userId, action: "admin.password.bootstrap_replaced", ipAddress: requestIp(request) });
  const response = NextResponse.redirect(new URL("/admin/sign-in", request.url), 303); response.cookies.set({ ...sessionCookie(""), maxAge: 0 }); return response;
}
