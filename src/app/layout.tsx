import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { socialLinks } from "@/config/social-links";
import { getSession } from "@/features/auth/session";
import "@/styles/globals.css";
import "@/styles/editorial.css";
export const metadata: Metadata = { title: "Like TAC Podcasts", description: "Serious tech, explained in relaxed and simple language." };
export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) { const session = await getSession(); return <html lang="en" data-theme="light" data-scroll-behavior="smooth"><body><a className="skipLink" href="#content">Skip to content</a><SiteHeader role={session?.role ?? null} /><div id="content">{children}</div><footer><div className="footerBrand"><strong>Like TAC</strong><SocialLinks links={socialLinks} /></div><span>Serious tech. For the rest of us.</span><span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></footer></body></html>; }
