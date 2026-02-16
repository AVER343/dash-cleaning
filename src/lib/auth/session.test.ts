import { beforeEach, describe, expect, it } from "vitest";
import { signAdminSession, verifyAdminSession } from "@/lib/auth/session";

describe("session", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-signing";
  });

  it("signs and verifies admin token", async () => {
    const token = await signAdminSession();
    await expect(verifyAdminSession(token)).resolves.toBe(true);
  });

  it("rejects invalid token", async () => {
    await expect(verifyAdminSession("bad-token")).resolves.toBe(false);
  });

  it("returns false when token is missing", async () => {
    await expect(verifyAdminSession(undefined)).resolves.toBe(false);
  });
});
