import { describe, expect, it } from "vitest";
import { resolveEpisodeAccess } from "./access";

const subscriber = { role: "subscriber" as const, status: "active" as const };

describe("episode access", () => {
  it("keeps Start Here, current, and public episodes free", () => {
    expect(resolveEpisodeAccess({ accessLevel: "subscriber", isStartHere: true, isCurrent: false }, null)).toBe("full");
    expect(resolveEpisodeAccess({ accessLevel: "subscriber", isStartHere: false, isCurrent: true }, null)).toBe("full");
    expect(resolveEpisodeAccess({ accessLevel: "public", isStartHere: false, isCurrent: false }, null)).toBe("full");
  });

  it("offers visitors a teaser and active subscribers the full archive", () => {
    const archived = { accessLevel: "subscriber" as const, isStartHere: false, isCurrent: false };
    expect(resolveEpisodeAccess(archived, null)).toBe("teaser");
    expect(resolveEpisodeAccess(archived, subscriber)).toBe("full");
    expect(resolveEpisodeAccess(archived, { role: "subscriber", status: "cancelled" })).toBe("teaser");
  });
});
