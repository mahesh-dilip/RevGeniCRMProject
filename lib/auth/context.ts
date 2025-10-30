/**
 * Authentication Context Helper
 *
 * Provides authenticated user context including:
 * - User ID and Clerk ID
 * - Tenant ID (for multi-tenancy)
 * - User role (for RBAC)
 * - User profile info
 *
 * Auto-creates User and Tenant records on first sign-in
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

export interface AuthContext {
  userId: string;
  clerkId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Get the current authenticated user's context
 * Creates User and Tenant on first sign-in
 *
 * @throws Error if user is not authenticated
 * @returns AuthContext with user and tenant information
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error('Unauthorized: No authenticated user');
  }

  // Look up user in our database
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { tenant: true },
  });

  // Auto-create user and tenant on first sign-in
  if (!user) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error('Unauthorized: Could not fetch user from Clerk');
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error('User email not found');
    }

    const firstName = clerkUser.firstName || null;
    const lastName = clerkUser.lastName || null;

    // Extract domain from email for tenant naming
    const emailDomain = email.split('@')[1];
    const tenantName = emailDomain || 'Personal Workspace';

    // Check if tenant exists for this domain (for team workspaces)
    let tenant = await prisma.tenant.findFirst({
      where: { domain: emailDomain },
    });

    // Create new tenant if doesn't exist
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          domain: emailDomain,
        },
      });
    }

    // Create user and link to tenant
    // First user in a tenant becomes OWNER, others become USER
    const existingUsers = await prisma.user.count({
      where: { tenantId: tenant.id },
    });

    const role = existingUsers === 0 ? 'OWNER' : 'USER';

    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        role,
        tenantId: tenant.id,
      },
      include: { tenant: true },
    });
  }

  return {
    userId: user.id,
    clerkId: user.clerkId,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Check if user has required role
 *
 * @param userRole - Current user's role
 * @param requiredRole - Minimum required role
 * @returns true if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    READONLY: 0,
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
    OWNER: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Throw error if user doesn't have required role
 *
 * @param userRole - Current user's role
 * @param requiredRole - Minimum required role
 * @throws Error if user doesn't have required role
 */
export function requireRole(userRole: UserRole, requiredRole: UserRole): void {
  if (!hasRole(userRole, requiredRole)) {
    throw new Error(
      `Forbidden: This operation requires ${requiredRole} role or higher`
    );
  }
}
