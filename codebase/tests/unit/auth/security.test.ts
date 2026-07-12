import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashSessionToken } from "@/lib/auth/session";

describe("authentication security", () => {
  it("hashes and verifies passwords without retaining the plaintext", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toContain("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("stores only a deterministic SHA-256 digest of session tokens", () => {
    const token = "demo-session-token";
    const hash = hashSessionToken(token);

    expect(hash).toBe(
      "af51df92a4233cfa6a5866ca289201b515a0277c14e2aa25d0c703c7b52223d2"
    );
    expect(hash).not.toBe(token);
  });
});
