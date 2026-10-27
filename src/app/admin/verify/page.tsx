import { AuthShell } from "@/components/auth-shell";

export default async function AdminVerifyPage({ searchParams }: { searchParams: Promise<{ challenge?: string }> }) {
  const { challenge } = await searchParams;
  return <AuthShell eyebrow="Administrator MFA" title="Enter your six-digit code" intro="We emailed the code to the security email in the administrator profile. It expires in ten minutes."><form action="/api/admin/verify-mfa" method="post" className="stackedForm"><input type="hidden" name="challengeId" value={challenge ?? ""} /><label>Verification code<input name="code" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" /></label><label className="checkField"><input type="checkbox" name="trustDevice" value="yes" /> Trust this device for 30 days</label><button className="button primary" type="submit">Verify and continue</button></form></AuthShell>;
}
