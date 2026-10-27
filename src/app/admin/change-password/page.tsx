import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/password-policy";
import { getSession } from "@/features/auth/session";

export default async function AdminChangePasswordPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/sign-in");
  return <AuthShell eyebrow="Required security step" title="Replace the temporary administrator password" intro="Choose a private password before using the dashboard. After saving, sign in again and verify MFA."><form action="/api/admin/change-password" method="post" className="stackedForm"><label>New password<input name="password" type="password" required autoComplete="new-password" /></label><label>Confirm new password<input name="confirmPassword" type="password" required autoComplete="new-password" /></label><div className="requirements"><ul>{PASSWORD_REQUIREMENTS.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul><p>It cannot match any of the previous five administrator passwords.</p></div><button className="button primary" type="submit">Replace temporary password</button></form></AuthShell>;
}
