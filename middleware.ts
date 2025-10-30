/**
 * Clerk Authentication Middleware
 *
 * Phase 3.3: Authentication ENFORCED - All routes protected except sign-in/sign-up
 * Users must sign in to access the application
 *
 * Public routes: /sign-in, /sign-up
 * Protected: Everything else (all pages + API routes)
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

/**
 * Matcher configuration for Clerk middleware
 * This ensures Clerk middleware runs on all routes except static files
 */
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
