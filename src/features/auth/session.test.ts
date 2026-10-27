import { describe, expect, it } from "vitest";

import { createOpaqueToken, hashOpaqueToken, sessionCookie } from "./session";

describe("subscriber sessions", () => {
  it("creates an opaque token and stores only its hash", () => {
    const token = createOpaqueToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashOpaqueToken(token)).not.toBe(token);
  });

  it("uses a secure HTTP-only same-site cookie", () => {
    expect(sessionCookie("token", true)).toMatchObject({
      name: "like_tac_session",
      value: "token",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  });
});
