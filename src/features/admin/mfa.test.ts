import { describe, expect, it } from "vitest";
import { createMfaCode, hashMfaCode, isMfaChallengeValid } from "./mfa";

describe("administrator MFA", () => {
  it("creates a six-digit code and stores only a hash", () => {
    const code = createMfaCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(hashMfaCode(code)).not.toContain(code);
  });

  it("enforces expiry, one-time use, invalidation, and attempt limits", () => {
    const future = new Date(Date.now() + 60_000);
    expect(isMfaChallengeValid({ expiresAt: future, usedAt: null, invalidatedAt: null, attemptCount: 4 })).toBe(true);
    expect(isMfaChallengeValid({ expiresAt: new Date(0), usedAt: null, invalidatedAt: null, attemptCount: 0 })).toBe(false);
    expect(isMfaChallengeValid({ expiresAt: future, usedAt: new Date(), invalidatedAt: null, attemptCount: 0 })).toBe(false);
    expect(isMfaChallengeValid({ expiresAt: future, usedAt: null, invalidatedAt: new Date(), attemptCount: 0 })).toBe(false);
    expect(isMfaChallengeValid({ expiresAt: future, usedAt: null, invalidatedAt: null, attemptCount: 5 })).toBe(false);
  });
});
