import { describe, expect, it } from "vitest";
import { createRateLimitKey, isRateLimited } from "./rate-limit";

describe("authentication rate limits", () => {
  it("hashes identifiers before storage", () => {
    const key = createRateLimitKey("203.0.113.10", "member@example.com");
    expect(key).not.toContain("203.0.113.10");
    expect(key).not.toContain("member@example.com");
    expect(key).toHaveLength(64);
  });

  it("blocks only when the configured attempt limit is exceeded inside the window", () => {
    expect(isRateLimited(5, 5)).toBe(false);
    expect(isRateLimited(6, 5)).toBe(true);
  });
});
