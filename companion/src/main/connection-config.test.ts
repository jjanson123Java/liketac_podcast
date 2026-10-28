import { describe, expect, test } from "vitest";
import { validateConnectionConfig } from "./connection-config";

describe("validateConnectionConfig", () => {
  test.each([
    ["127.0.0.1", 4455],
    ["localhost", 1],
    ["localhost", 65535],
  ])("accepts authenticated loopback OBS at %s:%s", (host, port) => {
    expect(validateConnectionConfig({ host, port, password: "not-logged-secret" })).toEqual({
      ok: true,
      value: { host, port, password: "not-logged-secret" },
    });
  });

  test.each(["192.168.1.10", "0.0.0.0", "::1", "obs.example.com", ""])(
    "rejects non-approved OBS host %j",
    (host) => {
      expect(validateConnectionConfig({ host, port: 4455, password: "secret" })).toEqual({
        ok: false,
        error: "OBS must use this computer only (127.0.0.1 or localhost).",
      });
    },
  );

  test.each([0, 65536, -1, 44.55, Number.NaN])("rejects invalid port %s", (port) => {
    expect(validateConnectionConfig({ host: "127.0.0.1", port, password: "secret" })).toEqual({
      ok: false,
      error: "OBS port must be a whole number from 1 through 65535.",
    });
  });

  test.each(["", "   ", null, undefined])("requires an OBS authentication password", (password) => {
    expect(validateConnectionConfig({ host: "127.0.0.1", port: 4455, password })).toEqual({
      ok: false,
      error: "Enter the OBS WebSocket password.",
    });
  });
});
