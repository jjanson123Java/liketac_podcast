import { describe, expect, it } from "vitest";

import { generateSuggestedPassword, validatePassword } from "./password-policy";

describe("subscriber password policy", () => {
  it("requires length, upper, lower, number, and one allowed special character", () => {
    expect(validatePassword("ValidT@st9")).toEqual([]);
    expect(validatePassword("short1!")).toContain("Use at least 8 characters.");
    expect(validatePassword("alllower1!")).toContain("Add an uppercase letter.");
    expect(validatePassword("ALLUPPER1!")).toContain("Add a lowercase letter.");
    expect(validatePassword("NoNumber!")).toContain("Add a number.");
    expect(validatePassword("NoSpecial1")).toContain("Add one of these special characters: ! @ * #.");
  });

  it("rejects characters outside letters, numbers, and ! @ * #", () => {
    expect(validatePassword("GoodTest1$")).toContain("Only letters, numbers, and ! @ * # are allowed.");
  });

  it("generates a password that satisfies the same policy", () => {
    expect(validatePassword(generateSuggestedPassword())).toEqual([]);
  });
});
