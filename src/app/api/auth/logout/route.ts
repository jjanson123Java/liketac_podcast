import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { sessions } from "@/db/identity/schema";
import { hashOpaqueToken, SESSION_COOKIE_NAME, sessionCookie } from "@/features/auth/session";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))?.[1];
  if (token) await createIdentityDb().update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashOpaqueToken(decodeURIComponent(token))));
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set({ ...sessionCookie(""), maxAge: 0 });
  return response;
}
