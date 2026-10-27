import { getSession } from "@/features/auth/session";

export async function requireAdmin(options: { allowPasswordChange?: boolean } = {}) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("ADMIN_AUTHENTICATION_REQUIRED");
  if (session.mustChangePassword && !options.allowPasswordChange) throw new Error("ADMIN_PASSWORD_CHANGE_REQUIRED");
  return session;
}
