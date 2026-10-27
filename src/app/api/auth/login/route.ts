import { and, eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { sessions, users } from "@/db/identity/schema";
import { verifyPassword } from "@/features/auth/password-hash";
import { createOpaqueToken, hashOpaqueToken, sessionCookie, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/features/auth/session";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "subscriber-login", keyHash: createRateLimitKey(requestIp(request), identifier), limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  const [user] = await db.select().from(users).where(and(or(eq(users.username, identifier), eq(users.email, identifier)), eq(users.role, "subscriber"), eq(users.status, "active"), isNull(users.deletedAt))).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ error: "Username/email or password is incorrect." }, { status: 401 });
  const existingToken = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))?.[1];
  if (existingToken) await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashOpaqueToken(decodeURIComponent(existingToken))));
  const token = createOpaqueToken();
  await db.insert(sessions).values({ userId: user.id, tokenHash: hashOpaqueToken(token), expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000) });
  const response = NextResponse.redirect(new URL("/shows", request.url), 303);
  response.cookies.set(sessionCookie(token));
  return response;
}
