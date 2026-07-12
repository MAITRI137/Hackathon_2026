import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasRole,
} from "@/lib/auth/permissions";
import { SessionUser } from "@/lib/auth/types";

describe("Permissions", () => {
  const mockUser: SessionUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    roleSlug: "dispatcher",
    status: "ACTIVE",
    permissions: [
      { action: "read", subject: "dashboard" },
      { action: "manage", subject: "trips" },
    ],
  };

  it("should return true if user has specific permission", () => {
    expect(hasPermission(mockUser, "read:dashboard")).toBe(true);
    expect(hasPermission(mockUser, "manage:trips")).toBe(true);
  });

  it("should return false if user doesn't have permission", () => {
    expect(hasPermission(mockUser, "manage:dashboard")).toBe(false);
  });

  it("should return false if user is disabled", () => {
    const disabledUser = { ...mockUser, status: "DISABLED" as const };
    expect(hasPermission(disabledUser, "read:dashboard")).toBe(false);
  });

  it("should return true if user has any of the requested permissions", () => {
    expect(
      hasAnyPermission(mockUser, ["manage:dashboard", "manage:trips"])
    ).toBe(true);
  });

  it("should return true if user has the requested role", () => {
    expect(hasRole(mockUser, "dispatcher")).toBe(true);
  });

  it("should return false if user does not have the requested role", () => {
    expect(hasRole(mockUser, "admin")).toBe(false);
  });
});
