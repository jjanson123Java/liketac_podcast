import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "@/styles/globals.css";
export const metadata: Metadata = { title: "Like TAC Podcasts", description: "Serious tech, explained in relaxed and simple language." };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="en" data-theme="light" data-scroll-behavior="smooth"><body><a className="skipLink" href="#content">Skip to content</a><SiteHeader /><div id="content">{children}</div><footer><strong>Like TAC</strong><span>Serious tech. For the rest of us.</span><span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></footer></body></html>; }
