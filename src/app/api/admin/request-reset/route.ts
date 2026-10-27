import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { adminProfiles, passwordResetChallenges, users } from "@/db/identity/schema";
import { hashPassword } from "@/features/auth/password-hash";
import { generateSuggestedPassword } from "@/features/auth/password-policy";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";
import { createOpaqueToken, hashOpaqueToken } from "@/features/auth/session";
import { sendEmail } from "@/features/email/send-email";
import { passwordResetInstructions } from "@/features/email/templates/subscriber-recovery";

export async function POST(request: Request) {
  const form = await request.formData(); const identifier = String(form.get("identifier") ?? "").trim().toLowerCase(); const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "admin-password-reset", keyHash: createRateLimitKey(requestIp(request), identifier), limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ message: "If the administrator account exists, reset instructions have been emailed." });
  const [record] = await db.select({ user: users, securityEmail: adminProfiles.securityEmail }).from(users).leftJoin(adminProfiles, eq(adminProfiles.userId, users.id)).where(and(eq(users.username, identifier), eq(users.role, "admin"), eq(users.status, "active"), isNull(users.deletedAt))).limit(1);
  if (record) { const token = createOpaqueToken(); const suggested = generateSuggestedPassword(); await db.update(passwordResetChallenges).set({ usedAt: new Date() }).where(and(eq(passwordResetChallenges.userId, record.user.id), isNull(passwordResetChallenges.usedAt))); await db.insert(passwordResetChallenges).values({ userId: record.user.id, tokenHash: hashOpaqueToken(token), suggestedPasswordHash: await hashPassword(suggested), expiresAt: new Date(Date.now() + 30 * 60 * 1000) }); const url = new URL(`/admin/reset?token=${encodeURIComponent(token)}`, request.url).toString(); try { await sendEmail({ to: record.securityEmail ?? record.user.email, ...passwordResetInstructions(url, suggested) }); } catch { /* generic response */ } }
  return NextResponse.json({ message: "If the administrator account exists, reset instructions have been emailed." });
}
