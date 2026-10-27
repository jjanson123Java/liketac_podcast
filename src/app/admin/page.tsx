import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/sign-in");
  return <main className="audience"><p className="eyebrow">Protected admin dashboard</p><h1>Manage Like TAC</h1><p>Upload and publish episodes, organize categories, and maintain the administrator profile.</p><div className="cardGrid"><Link className="card" href="/admin/podcasts"><h2>Podcast content</h2><p>Upload, preview, publish, unpublish, or restore episodes.</p></Link><Link className="card" href="/admin/categories"><h2>Categories</h2><p>Create and order subjects. Empty categories display Coming Soon.</p></Link><Link className="card" href="/admin/profile"><h2>Administrator profile</h2><p>Maintain contact details and the MFA security email.</p></Link></div></main>;
}
