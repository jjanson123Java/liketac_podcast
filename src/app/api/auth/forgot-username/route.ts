import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { users } from "@/db/identity/schema";
import { sendEmail } from "@/features/email/send-email";
import { usernameReminder } from "@/features/email/templates/subscriber-recovery";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "forgot-username", keyHash: createRateLimitKey(requestIp(request), email), limit: 5, windowMs: 30 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ message: "If the email matches an active account, the username has been sent." });
  const [user] = await db.select({ username: users.username, email: users.email }).from(users).where(and(eq(users.email, email), eq(users.status, "active"), isNull(users.deletedAt))).limit(1);
  if (user) { try { await sendEmail({ to: user.email, ...usernameReminder(user.username) }); } catch { /* Keep account existence private. */ } }
  return NextResponse.json({ message: "If the email matches an active account, the username has been sent." });
}
