import { getSession } from "@/features/auth/session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("ADMIN_AUTHENTICATION_REQUIRED");
  return session;
}
