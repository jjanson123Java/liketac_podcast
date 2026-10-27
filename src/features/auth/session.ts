import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { createIdentityDb } from "@/db/identity/client";
import { sessions, users } from "@/db/identity/schema";

export const SESSION_COOKIE_NAME = "like_tac_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function sessionCookie(value: string, secure = process.env.NODE_ENV === "production") {
  return {
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getSessionFromToken(token?: string) {
  if (!token) return null;
  const db = createIdentityDb();
  const [record] = await db.select({ sessionId: sessions.id, userId: users.id, username: users.username, email: users.email, role: users.role, status: users.status, mustChangePassword: users.mustChangePassword }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(and(eq(sessions.tokenHash, hashOpaqueToken(token)), gt(sessions.expiresAt, new Date()), isNull(sessions.revokedAt), eq(users.status, "active"), isNull(users.deletedAt))).limit(1);
  return record ?? null;
}

export async function getSession() {
  return getSessionFromToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
}

export async function requireSubscriber() {
  const session = await getSession();
  if (!session) throw new Error("AUTHENTICATION_REQUIRED");
  return session;
}
