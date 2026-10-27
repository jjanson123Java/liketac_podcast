import { AdminHelp } from "@/components/help/admin-help";
import { SubscriberHelp } from "@/components/help/subscriber-help";
import { getSession } from "@/features/auth/session";

export const dynamic = "force-dynamic";
export default async function HelpPage() { const session = await getSession(); const admin = session?.role === "admin"; return <main className="audience"><p className="eyebrow">{admin ? "Protected admin help" : "Like TAC help"}</p><h1>{admin ? "Manage Like TAC with confidence." : "Listen, learn, and find your way around."}</h1>{admin ? <AdminHelp /> : <SubscriberHelp />}</main>; }
