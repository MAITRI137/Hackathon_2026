import { getCurrentSession } from "./session";
import { SessionUser } from "./types";
import { redirect } from "next/navigation";
import { hasPermission } from "./permissions";
import { PermissionKey } from "./types";

/**
 * Gets the current user. Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getCurrentSession();
}

/**
 * Gets the current user. Throws an error or redirects if not authenticated.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Requires a specific permission. Redirects to /access-denied if unauthorized.
 */
export async function requirePermission(
  permissionKey: PermissionKey
): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user, permissionKey)) {
    redirect("/access-denied");
  }
  return user;
}
