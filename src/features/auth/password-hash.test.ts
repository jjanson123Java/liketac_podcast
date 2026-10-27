import { describe, expect, it } from "vitest";

import { hashPassword, isRecentlyUsedPassword, verifyPassword } from "./password-hash";

describe("password hashing and history", () => {
  it("hashes with a random salt and verifies without storing plaintext", async () => {
    const first = await hashPassword("ValidT@st9");
    const second = await hashPassword("ValidT@st9");
    expect(first).not.toBe(second);
    expect(first).not.toContain("ValidT@st9");
    expect(await verifyPassword("ValidT@st9", first)).toBe(true);
    expect(await verifyPassword("WrongT@st1", first)).toBe(false);
  });

  it("detects a password among the five most recent hashes", async () => {
    const hashes = await Promise.all(["FirstT@st1", "SecondT@st2", "ThirdT@st3"].map(hashPassword));
    expect(await isRecentlyUsedPassword("SecondT@st2", hashes)).toBe(true);
    expect(await isRecentlyUsedPassword("FreshT@st4", hashes)).toBe(false);
  });
});
