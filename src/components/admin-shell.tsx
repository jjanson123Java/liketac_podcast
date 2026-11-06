import Link from "next/link";
import type { ReactNode } from "react";

const destinations = [
  { href: "/admin", label: "Overview", mark: "01" },
  { href: "/admin/recording", label: "Studio", mark: "02" },
  { href: "/admin/podcasts", label: "Episodes", mark: "03" },
  { href: "/admin/categories", label: "Subjects", mark: "04" },
  { href: "/admin/profile", label: "Profile", mark: "05" },
] as const;

export function AdminShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="adminWorkspace">
      <aside className="adminSidebar">
        <Link href="/admin" className="studioBrand" aria-label="Like TAC administration home">
          <span>LIKE TAC<span className="brandSlash">/</span></span>
          <small>THE CONTROL ROOM</small>
        </Link>
        <p className="sidebarLabel">Your workspace</p>
        <nav aria-label="Administrator workspace" className="adminNav">
          {destinations.map(({ href, label, mark }) => (
            <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>
              <span aria-hidden="true">{mark}</span>{label}<span aria-hidden="true" className="navArrow">↗</span>
            </Link>
          ))}
        </nav>
        <div className="sidebarFooter">
          <p>Serious tech.<br /><strong>For the rest of us.</strong></p>
          <Link href="/shows">View public shows <span aria-hidden="true">↗</span></Link>
          <Link href="/help">Help &amp; guidance <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
      <div className="adminContent">
        <div className="workspaceBar"><span>LIKE TAC <span aria-hidden="true">/</span> ADMINISTRATION</span><Link href="/">Visit website <span aria-hidden="true">↗</span></Link></div>
        {children}
      </div>
    </div>
  );
}
