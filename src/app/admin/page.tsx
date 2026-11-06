import { AdminShell } from "@/components/admin-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/sign-in");
  if (session.mustChangePassword) redirect("/admin/change-password");
  return <AdminShell current="/admin"><main className="audience"><p className="eyebrow">Protected admin dashboard</p><h1>Manage Like TAC</h1><p>Upload and publish episodes, organize categories, and maintain the administrator profile.</p><div className="cardGrid dashboardCards"><Link className="card" href="/admin/recording"><span className="workspaceIndex" aria-hidden="true">01 / STUDIO ↗</span><h2>Recording Studio</h2><p>Launch Like TAC Companion, verify OBS readiness, and control the local recording session.</p></Link><Link className="card" href="/admin/podcasts"><span className="workspaceIndex" aria-hidden="true">02 / EPISODES ↗</span><h2>Podcast content</h2><p>Upload, preview, publish, unpublish, or restore episodes.</p></Link><Link className="card" href="/admin/categories"><span className="workspaceIndex" aria-hidden="true">03 / SUBJECTS ↗</span><h2>Categories</h2><p>Create and order subjects. Empty categories display Coming Soon.</p></Link><Link className="card" href="/admin/profile"><span className="workspaceIndex" aria-hidden="true">04 / ACCOUNT ↗</span><h2>Administrator profile</h2><p>Maintain contact details and the MFA security email.</p></Link></div></main></AdminShell>;
}
