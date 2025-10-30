import { UserRole } from '@prisma/client';
import { AuthContext } from './context';

/**
 * Permission levels for different operations
 */
export const Permissions = {
  // Create operations
  CREATE_COMPANY: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  CREATE_DEAL: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  CREATE_PERSON: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  CREATE_EVENT: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  CREATE_SEQUENCE: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

  // Update operations
  UPDATE_COMPANY: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  UPDATE_DEAL: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  UPDATE_PERSON: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  UPDATE_EVENT: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  UPDATE_SEQUENCE: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

  // Delete operations (more restricted)
  DELETE_COMPANY: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  DELETE_DEAL: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  DELETE_PERSON: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  DELETE_EVENT: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  DELETE_SEQUENCE: [UserRole.OWNER, UserRole.ADMIN],

  // Expensive operations
  USE_AI_LEAD_FINDER: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  BULK_CREATE: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
  ENROLL_SEQUENCE: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],

  // Admin operations
  MANAGE_USERS: [UserRole.OWNER, UserRole.ADMIN],
  VIEW_ALL_DATA: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.READONLY],
} as const;

export type Permission = keyof typeof Permissions;

/**
 * Check if a user has a specific permission
 */
export function hasPermission(authContext: AuthContext, permission: Permission): boolean {
  const allowedRoles = Permissions[permission];
  return (allowedRoles as readonly UserRole[]).includes(authContext.role);
}

/**
 * Require a specific permission or throw an error
 */
export function requirePermission(authContext: AuthContext, permission: Permission): void {
  if (!hasPermission(authContext, permission)) {
    throw new Error(`Forbidden: You don't have permission to ${permission.toLowerCase().replace(/_/g, ' ')}`);
  }
}

/**
 * Check if a user can perform write operations
 */
export function canWrite(authContext: AuthContext): boolean {
  return authContext.role !== UserRole.READONLY;
}

/**
 * Check if a user is an admin or owner
 */
export function isAdmin(authContext: AuthContext): boolean {
  return authContext.role === UserRole.OWNER || authContext.role === UserRole.ADMIN;
}

/**
 * Check if a user is the tenant owner
 */
export function isOwner(authContext: AuthContext): boolean {
  return authContext.role === UserRole.OWNER;
}

/**
 * Require write permission or throw an error
 */
export function requireWrite(authContext: AuthContext): void {
  if (!canWrite(authContext)) {
    throw new Error('Forbidden: Read-only users cannot modify data');
  }
}

/**
 * Require admin permission or throw an error
 */
export function requireAdmin(authContext: AuthContext): void {
  if (!isAdmin(authContext)) {
    throw new Error('Forbidden: This action requires admin privileges');
  }
}
