import { createIdentityDb } from "@/db/identity/client";
import { consentEvents, passwordHistory, sessions, users } from "@/db/identity/schema";
import { hashPassword } from "@/features/auth/password-hash";
import { validatePassword } from "@/features/auth/password-policy";
import { createOpaqueToken, hashOpaqueToken, sessionCookie, SESSION_MAX_AGE_SECONDS } from "@/features/auth/session";
import { NextResponse } from "next/server";
import { consumeRateLimit, createRateLimitKey, requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const data = Object.fromEntries(form.entries());
  const password = String(data.password ?? "");
  const username = String(data.username ?? "").trim().toLowerCase();
  if (!data.firstName || !data.lastName || !data.email || !/^[a-z0-9_.-]{3,32}$/.test(username) || data.confirmPassword !== password || data.communicationApproved !== "yes" || validatePassword(password).length) return NextResponse.json({ error: "Please correct the signup form and try again." }, { status: 400 });
  const db = createIdentityDb();
  const rate = await consumeRateLimit(db, { action: "subscriber-signup", keyHash: createRateLimitKey(requestIp(request), String(data.email ?? "")), limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many signup attempts. Wait and try again." }, { status: 429 });
  const passwordHash = await hashPassword(password);
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({ firstName: String(data.firstName).trim(), lastName: String(data.lastName).trim(), pronouns: data.pronouns ? String(data.pronouns).trim() : null, email: String(data.email).trim().toLowerCase(), username, passwordHash }).returning({ id: users.id });
      await tx.insert(consentEvents).values({ userId: user.id, communicationApproved: true, policyVersion: "2026-10-27", userAgent: request.headers.get("user-agent") });
      await tx.insert(passwordHistory).values({ userId: user.id, passwordHash, position: 1 });
      await tx.insert(sessions).values({ userId: user.id, tokenHash: hashOpaqueToken(token), expiresAt });
    });
  } catch { return NextResponse.json({ error: "That username or email cannot be used. Try another or sign in." }, { status: 409 }); }
  const response = NextResponse.redirect(new URL("/shows", request.url), 303);
  response.cookies.set(sessionCookie(token));
  return response;
}
