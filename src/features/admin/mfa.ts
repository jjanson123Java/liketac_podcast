import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const MFA_EXPIRY_MS = 10 * 60 * 1000;
export const MFA_MAX_ATTEMPTS = 5;

export function createMfaCode() { return randomInt(0, 1_000_000).toString().padStart(6, "0"); }
export function hashMfaCode(code: string) { return createHash("sha256").update(code).digest("hex"); }
export function verifyMfaCode(code: string, hash: string) {
  const actual = Buffer.from(hashMfaCode(code));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function isMfaChallengeValid(challenge: { expiresAt: Date; usedAt: Date | null; invalidatedAt: Date | null; attemptCount: number }) {
  return !challenge.usedAt && !challenge.invalidatedAt && challenge.expiresAt > new Date() && challenge.attemptCount < MFA_MAX_ATTEMPTS;
}
