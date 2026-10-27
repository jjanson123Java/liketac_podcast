import { and, eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { passwordResetChallenges, users } from "@/db/identity/schema";
import { hashPassword } from "@/features/auth/password-hash";
import { generateSuggestedPassword } from "@/features/auth/password-policy";
import { createOpaqueToken, hashOpaqueToken } from "@/features/auth/session";
import { sendEmail } from "@/features/email/send-email";
import { passwordResetInstructions } from "@/features/email/templates/subscriber-recovery";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "").trim().toLowerCase();
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "request-password-reset", keyHash: createRateLimitKey(requestIp(request), identifier), limit: 5, windowMs: 30 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ message: "If the account exists, reset instructions have been emailed." });
  const [user] = await db.select().from(users).where(and(or(eq(users.email, identifier), eq(users.username, identifier)), eq(users.status, "active"), isNull(users.deletedAt))).limit(1);
  if (user) {
    const token = createOpaqueToken();
    const suggestedPassword = generateSuggestedPassword();
    await db.update(passwordResetChallenges).set({ usedAt: new Date() }).where(and(eq(passwordResetChallenges.userId, user.id), isNull(passwordResetChallenges.usedAt)));
    await db.insert(passwordResetChallenges).values({ userId: user.id, tokenHash: hashOpaqueToken(token), suggestedPasswordHash: await hashPassword(suggestedPassword), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
    const resetUrl = new URL(`/account/reset?token=${encodeURIComponent(token)}`, request.url).toString();
    try { await sendEmail({ to: user.email, ...passwordResetInstructions(resetUrl, suggestedPassword) }); } catch { /* Generic response prevents enumeration. */ }
  }
  return NextResponse.json({ message: "If the account exists, reset instructions have been emailed." });
}
