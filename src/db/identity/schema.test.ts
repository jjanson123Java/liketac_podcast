import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  adminProfiles,
  auditEvents,
  consentEvents,
  mfaChallenges,
  passwordHistory,
  passwordResetChallenges,
  rateLimitBuckets,
  sessions,
  users,
} from "./schema";

describe("identity database schema", () => {
  it("keeps usernames and emails unique", () => {
    const config = getTableConfig(users);
    expect(config.columns.find((column) => column.name === "username")?.isUnique).toBe(true);
    expect(config.columns.find((column) => column.name === "email")?.isUnique).toBe(true);
  });

  it("contains consent, password history, security challenges, sessions, profiles, and audit records", () => {
    expect(getTableConfig(consentEvents).name).toBe("consent_events");
    expect(getTableConfig(passwordHistory).columns.map((column) => column.name)).toContain("position");
    expect(getTableConfig(mfaChallenges).columns.map((column) => column.name)).toContain("expires_at");
    expect(getTableConfig(passwordResetChallenges).columns.map((column) => column.name)).toContain("used_at");
    expect(getTableConfig(sessions).columns.map((column) => column.name)).toContain("revoked_at");
    expect(getTableConfig(adminProfiles).name).toBe("admin_profiles");
    expect(getTableConfig(auditEvents).name).toBe("audit_events");
    expect(getTableConfig(rateLimitBuckets).columns.map((column) => column.name)).toEqual(expect.arrayContaining(["key_hash", "action", "window_started_at", "count"]));
  });
});
