import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/features/auth/session";
import { createIdentityDb } from "@/db/identity/client";
import { adminProfiles, users } from "@/db/identity/schema";
import { AuthShell } from "@/components/auth-shell";

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/sign-in");
  const [profile] = await createIdentityDb().select().from(users).leftJoin(adminProfiles, eq(adminProfiles.userId, users.id)).where(eq(users.id, session.userId)).limit(1);
  if (!profile) redirect("/admin/sign-in");
  const admin = profile.admin_profiles;
  return <AuthShell eyebrow="Protected admin profile" title="Administrator contact details" intro="Only an authenticated administrator can edit these fields. Changes are recorded in the security audit trail."><form action="/api/admin/profile" method="post" className="stackedForm"><div className="fieldRow"><label>First name<input name="firstName" defaultValue={profile.users.firstName} required /></label><label>Last name<input name="lastName" defaultValue={profile.users.lastName} required /></label></div><label>Pronouns<input name="pronouns" defaultValue={profile.users.pronouns ?? ""} /></label><label>Address<input name="addressLine1" defaultValue={admin?.addressLine1 ?? ""} /></label><label>Address line 2<input name="addressLine2" defaultValue={admin?.addressLine2 ?? ""} /></label><div className="fieldRow"><label>City<input name="city" defaultValue={admin?.city ?? ""} /></label><label>State or region<input name="region" defaultValue={admin?.region ?? ""} /></label></div><label>Postal code<input name="postalCode" defaultValue={admin?.postalCode ?? ""} /></label><label>Phone<input name="phone" type="tel" defaultValue={admin?.phone ?? ""} /></label><label>MFA security email<input name="securityEmail" type="email" defaultValue={admin?.securityEmail ?? profile.users.email} required /></label><button className="button primary" type="submit">Save administrator profile</button></form></AuthShell>;
}
