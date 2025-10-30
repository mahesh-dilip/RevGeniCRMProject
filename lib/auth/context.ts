import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export type AuthContext = {
  userId: string;
  clerkId: string;
  tenantId: string;
  role: UserRole;
  email: string;
};

/**
 * Get the authenticated user's context with tenant and role information.
 * Throws an error if the user is not authenticated or not found in database.
 *
 * This should be called at the start of every authenticated API route.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error('Unauthorized: No user session');
  }

  // Get or create user in database
  const user = await getOrCreateUser(clerkId);

  return {
    userId: user.id,
    clerkId: user.clerkId,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  };
}

/**
 * Get or create a user in the database from their Clerk ID.
 * This is called automatically when a user signs in.
 */
async function getOrCreateUser(clerkId: string) {
  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { tenant: true },
  });

  if (user) {
    return user;
  }

  // User doesn't exist, create them
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('Unable to fetch user from Clerk');
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error('User has no email address');
  }

  // Check if this is the first user (should be tenant owner)
  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  // Get or create demo tenant
  let tenant = await prisma.tenant.findUnique({
    where: { id: 'demo-tenant' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: 'demo-tenant',
        name: 'Demo Organization',
        slug: 'demo-org',
      },
    });
  }

  // Create user with appropriate role
  user = await prisma.user.create({
    data: {
      clerkId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      role: isFirstUser ? UserRole.OWNER : UserRole.USER,
      tenantId: tenant.id,
    },
    include: { tenant: true },
  });

  return user;
}

/**
 * Check if the current user exists and return their data.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    return await getAuthContext();
  } catch {
    return null;
  }
}
