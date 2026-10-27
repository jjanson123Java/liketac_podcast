import type { IdentityDb } from "@/db/identity/client";
import { auditEvents } from "@/db/identity/schema";

export async function recordAudit(db: IdentityDb, event: { actorUserId?: string; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown>; ipAddress?: string }) {
  await db.insert(auditEvents).values({ actorUserId: event.actorUserId, action: event.action, targetType: event.targetType, targetId: event.targetId, metadata: event.metadata ?? {}, ipAddress: event.ipAddress });
}
