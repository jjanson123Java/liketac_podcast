import { createOpaqueToken, hashOpaqueToken } from "@/features/auth/session";

export const TRUSTED_DEVICE_COOKIE_NAME = "like_tac_admin_trusted";
export const TRUSTED_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export { createOpaqueToken as createTrustedDeviceToken, hashOpaqueToken as hashTrustedDeviceToken };
export function trustedDeviceCookie(value: string, secure = process.env.NODE_ENV === "production") { return { name: TRUSTED_DEVICE_COOKIE_NAME, value, httpOnly: true, secure, sameSite: "strict" as const, path: "/", maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS }; }
