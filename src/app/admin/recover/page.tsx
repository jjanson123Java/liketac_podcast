import { AuthShell } from "@/components/auth-shell";

export default function AdminRecoverPage() {
  return <AuthShell eyebrow="Administrator recovery" title="Reset administrator access" intro="This protected recovery path is separate from member recovery. Instructions go only to the administrator security email."><form action="/api/admin/request-reset" method="post" className="stackedForm"><label>Administrator username<input name="identifier" required autoComplete="username" /></label><button className="button primary" type="submit">Send administrator reset instructions</button></form></AuthShell>;
}
