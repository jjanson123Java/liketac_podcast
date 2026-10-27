import { eq } from "drizzle-orm";
import { createIdentityDb } from "../src/db/identity/client";
import { adminProfiles, passwordHistory, users } from "../src/db/identity/schema";
import { hashPassword } from "../src/features/auth/password-hash";

const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
const securityEmail = process.env.ADMIN_SECURITY_EMAIL?.trim().toLowerCase();
const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!securityEmail || !bootstrapPassword) throw new Error("ADMIN_SECURITY_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required");

const db = createIdentityDb();
const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
if (!existing) {
  const passwordHash = await hashPassword(bootstrapPassword);
  const [admin] = await db.insert(users).values({ username, email: securityEmail, passwordHash, firstName: "Like TAC", lastName: "Administrator", role: "admin", status: "active", mustChangePassword: true }).returning({ id: users.id });
  await db.insert(passwordHistory).values({ userId: admin.id, passwordHash, position: 1 });
  await db.insert(adminProfiles).values({ userId: admin.id, securityEmail });
  console.log("Administrator account created with forced password replacement enabled.");
} else {
  if (existing.role !== "admin") throw new Error("The configured administrator username belongs to a non-admin account");
  await db.insert(adminProfiles).values({ userId: existing.id, securityEmail }).onConflictDoUpdate({ target: adminProfiles.userId, set: { securityEmail, updatedAt: new Date() } });
  console.log("Administrator account already exists; security profile verified without changing its password.");
}
