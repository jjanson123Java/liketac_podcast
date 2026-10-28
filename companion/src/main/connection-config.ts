import type { OBSConnectionConfig } from "../shared/contracts";

export type ConnectionConfigValidation = { ok: true; value: OBSConnectionConfig } | { ok: false; error: string };

export function validateConnectionConfig(input: unknown): ConnectionConfigValidation {
  const candidate = input as Partial<Record<keyof OBSConnectionConfig, unknown>> | null;
  const host = candidate?.host;
  const port = candidate?.port;
  const password = candidate?.password;
  if (host !== "127.0.0.1" && host !== "localhost") {
    return { ok: false, error: "OBS must use this computer only (127.0.0.1 or localhost)." };
  }
  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: "OBS port must be a whole number from 1 through 65535." };
  }
  if (typeof password !== "string" || password.trim().length === 0) {
    return { ok: false, error: "Enter the OBS WebSocket password." };
  }
  return { ok: true, value: { host, port, password } };
}
