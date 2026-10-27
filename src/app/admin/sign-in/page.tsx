import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function AdminSignInPage() {
  return <AuthShell eyebrow="Protected administration" title="Administrator sign in" intro="Administrator access is separate from member sign in and requires email verification."><form action="/api/admin/login" method="post" className="stackedForm"><label>Administrator username<input name="identifier" required autoComplete="username" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" /></label><button className="button primary" type="submit">Continue securely</button></form><Link href="/admin/recover">Forgot the administrator password?</Link></AuthShell>;
}
