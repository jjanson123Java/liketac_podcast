import { AuthShell } from "@/components/auth-shell";
import { PasswordField } from "@/components/password-field";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/password-policy";

export default async function AdminResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthShell eyebrow="Administrator recovery" title="Choose a new administrator password" intro="Use the suggested password from the security email or enter and confirm your own."><form action="/api/admin/reset-password" method="post" className="stackedForm"><input type="hidden" name="token" value={token ?? ""} /><PasswordField label="New password" name="password" required autoComplete="new-password" /><PasswordField label="Confirm new password" name="confirmPassword" required autoComplete="new-password" /><div className="requirements"><ul>{PASSWORD_REQUIREMENTS.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul><p>It cannot match any of the previous five administrator passwords.</p></div><button className="button primary" type="submit">Reset administrator password</button></form></AuthShell>;
}
