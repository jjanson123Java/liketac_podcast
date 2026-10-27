import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createIdentityDb } from "@/db/identity/client";
import { adminProfiles, users } from "@/db/identity/schema";
import { requireAdmin } from "@/features/admin/authorization";
import { recordAudit } from "@/features/admin/audit";
import { requestIp } from "@/features/auth/rate-limit";

export async function POST(request: Request) {
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Administrator authentication required." }, { status: 401 }); }
  const form = await request.formData();
  const securityEmail = String(form.get("securityEmail") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(securityEmail)) return NextResponse.json({ error: "Enter a valid security email." }, { status: 400 });
  const value = (name: string) => String(form.get(name) ?? "").trim() || null;
  const db = createIdentityDb();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ firstName: value("firstName") ?? "", lastName: value("lastName") ?? "", pronouns: value("pronouns"), updatedAt: new Date() }).where(eq(users.id, admin.userId));
    await tx.insert(adminProfiles).values({ userId: admin.userId, securityEmail, addressLine1: value("addressLine1"), addressLine2: value("addressLine2"), city: value("city"), region: value("region"), postalCode: value("postalCode"), phone: value("phone") }).onConflictDoUpdate({ target: adminProfiles.userId, set: { securityEmail, addressLine1: value("addressLine1"), addressLine2: value("addressLine2"), city: value("city"), region: value("region"), postalCode: value("postalCode"), phone: value("phone"), updatedAt: new Date() } });
  });
  await recordAudit(db, { actorUserId: admin.userId, action: "admin.profile.updated", targetType: "admin_profile", targetId: admin.userId, ipAddress: requestIp(request) });
  return NextResponse.redirect(new URL("/admin/profile", request.url), 303);
}
