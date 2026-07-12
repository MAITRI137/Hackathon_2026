import { PermissionKey, SessionUser, RoleSlug } from './types';

/**
 * Checks if a user has a specific permission.
 */
export function hasPermission(user: SessionUser | null, permissionKey: PermissionKey): boolean {
  if (!user) return false;
  if (user.status !== 'ACTIVE') return false;

  const [action, subject] = permissionKey.split(':');
  
  return user.permissions.some(
    (p) => p.action === action && p.subject === subject
  );
}

/**
 * Checks if a user has at least one of the specified permissions.
 */
export function hasAnyPermission(user: SessionUser | null, permissionKeys: PermissionKey[]): boolean {
  if (!user) return false;
  if (user.status !== 'ACTIVE') return false;

  return permissionKeys.some((key) => hasPermission(user, key));
}

/**
 * Checks if a user has a specific role.
 */
export function hasRole(user: SessionUser | null, roleSlug: RoleSlug): boolean {
  if (!user) return false;
  if (user.status !== 'ACTIVE') return false;

  return user.roleSlug === roleSlug;
}
