import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server'

/**
 * Clerk middleware for Silicon Crane.
 *
 * Public routes:
 *   - / and other prerendered marketing pages
 *   - /sign-in (Clerk SignIn component)
 *   - /e/[slug] event/payment pages (still public, prerendered)
 *
 * Gated routes:
 *   - /app/* — validation tooling preview for allowlisted testers
 *
 * Restricted Mode + Allowlist is configured in the Clerk dashboard. Non-
 * allowlisted emails are blocked at sign-in. Magic link is the primary
 * sign-in method.
 */
const isProtectedRoute = createRouteMatcher(['/app(.*)'])

export const onRequest = clerkMiddleware((auth, context) => {
  if (isProtectedRoute(context.request)) {
    const { userId, redirectToSignIn } = auth()
    if (!userId) {
      return redirectToSignIn()
    }
  }
})
