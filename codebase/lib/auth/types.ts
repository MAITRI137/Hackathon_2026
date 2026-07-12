export type RoleSlug = 
  | 'admin'
  | 'fleet_manager'
  | 'dispatcher'
  | 'safety_officer'
  | 'financial_analyst'
  | 'driver';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface Permission {
  action: string;
  subject: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roleSlug: RoleSlug;
  status: UserStatus;
  permissions: Permission[];
}

export type PermissionKey = `${string}:${string}`;

export interface RouteAccessRule {
  path: string;
  permission?: PermissionKey;
}
