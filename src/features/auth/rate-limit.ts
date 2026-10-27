import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { IdentityDb } from "@/db/identity/client";

export function createRateLimitKey(ipAddress: string, identity = "anonymous") {
  return createHash("sha256").update(`${ipAddress}|${identity.trim().toLowerCase()}`).digest("hex");
}

export function isRateLimited(count: number, limit: number) {
  return count > limit;
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function consumeRateLimit(db: IdentityDb, options: { action: string; keyHash: string; limit: number; windowMs: number }) {
  const cutoff = new Date(Date.now() - options.windowMs);
  const now = new Date();
  const result = await db.execute(sql`
    insert into rate_limit_buckets (key_hash, action, window_started_at, count, updated_at)
    values (${options.keyHash}, ${options.action}, ${now}, 1, ${now})
    on conflict (key_hash, action) do update set
      count = case when rate_limit_buckets.window_started_at <= ${cutoff} then 1 else rate_limit_buckets.count + 1 end,
      window_started_at = case when rate_limit_buckets.window_started_at <= ${cutoff} then ${now} else rate_limit_buckets.window_started_at end,
      updated_at = ${now}
    returning count
  `);
  const count = Number((result.rows[0] as { count: number | string }).count);
  return { allowed: !isRateLimited(count, options.limit), count };
}
