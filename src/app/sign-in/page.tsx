import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { PasswordField } from "@/components/password-field";

export default function SignInPage() {
  return <AuthShell eyebrow="Welcome back" title="Member sign in" intro="Sign in to play or download previous Like TAC episodes."><form action="/api/auth/login" method="post" className="stackedForm"><label>Username or email<input name="identifier" required autoComplete="username" /></label><PasswordField label="Password" name="password" required autoComplete="current-password" /><button className="button primary" type="submit">Sign in</button></form><div className="supportLinks"><Link href="/account/forgot-username">Forgot my username</Link><Link href="/account/reset">Forgot my password</Link><Link href="/signup">Create a free account</Link></div></AuthShell>;
}
