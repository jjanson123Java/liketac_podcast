import { beforeEach, describe, expect, test, vi } from "vitest";

const poolConstructor = vi.fn();

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => "http-client"),
  Pool: class TestPool {
    constructor(options: unknown) {
      poolConstructor(options);
    }
  },
}));

vi.mock("drizzle-orm/neon-http", () => ({
  drizzle: vi.fn(() => ({ driver: "http" })),
}));

vi.mock("drizzle-orm/neon-serverless", () => ({
  drizzle: vi.fn(() => ({ driver: "pool", transaction: vi.fn() })),
}));

import { createContentDb } from "./content/client";
import { createIdentityDb } from "./identity/client";

describe("database clients", () => {
  beforeEach(() => poolConstructor.mockClear());

  test.each([
    ["identity", createIdentityDb],
    ["content", createContentDb],
  ])("uses the transaction-capable Neon pool for %s data", (_name, createDb) => {
    const db = createDb("postgresql://example.test/database");

    expect(db).toMatchObject({ driver: "pool", transaction: expect.any(Function) });
    expect(poolConstructor).toHaveBeenCalledWith({ connectionString: "postgresql://example.test/database" });
  });

  test("reuses the identity pool within a warm serverless instance", () => {
    const connectionString = "postgresql://example.test/reused";

    createIdentityDb(connectionString);
    createIdentityDb(connectionString);

    expect(poolConstructor).toHaveBeenCalledTimes(1);
  });
});
