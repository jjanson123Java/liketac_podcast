import { AuthShell } from "@/components/auth-shell";

export default function ForgotUsernamePage() {
  return <AuthShell eyebrow="Account help" title="Forgot your username?" intro="Enter your email. If it matches an account, we will send the username there."><form action="/api/auth/forgot-username" method="post" className="stackedForm"><label>Email<input name="email" type="email" required autoComplete="email" /></label><button className="button primary" type="submit">Email my username</button></form></AuthShell>;
}
