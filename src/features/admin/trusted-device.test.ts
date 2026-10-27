import { describe, expect, it } from "vitest";
import { trustedDeviceCookie, TRUSTED_DEVICE_MAX_AGE_SECONDS } from "./trusted-device";

describe("administrator trusted device", () => {
  it("is protected and limited to 30 days", () => {
    expect(TRUSTED_DEVICE_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 30);
    expect(trustedDeviceCookie("token", true)).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS });
  });
});
