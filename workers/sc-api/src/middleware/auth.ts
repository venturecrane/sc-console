import { Context, Next } from 'hono';

// Public routes that don't require authentication (Section 4.2)
const PUBLIC_ROUTES = [
  { method: 'POST', path: '/leads' },
  { method: 'POST', path: '/events' },
  { method: 'POST', path: '/contact' }, // Public contact form
  { method: 'GET', pathPattern: /^\/experiments\/by-slug\/[^/]+$/ },
  { method: 'POST', path: '/payments/webhook' }, // Uses Stripe signature
  { method: 'GET', path: '/health' },
  { method: 'OPTIONS', path: '*' }, // CORS preflight
];

/**
 * Check if a route is public (doesn't require X-SC-Key authentication)
 */
function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.method !== method) {
      return false;
    }

    // Check if path matches
    if ('path' in route) {
      return route.path === path || route.path === '*';
    }

    // Check if pathPattern matches
    if ('pathPattern' in route) {
      return route.pathPattern.test(path);
    }

    return false;
  });
}

/**
 * Authentication middleware - validates X-SC-Key header for internal endpoints
 * Per Section 4.2: Public endpoints (leads, events, experiments/by-slug) don't require auth
 */
export async function authMiddleware(c: Context, next: Next) {
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;

  // Skip authentication for public routes
  if (isPublicRoute(method, path)) {
    return next();
  }

  // Check for X-SC-Key header
  const apiKey = c.req.header('X-SC-Key');
  const expectedKey = c.env.SC_API_KEY;

  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authentication key',
          details: { required_header: 'X-SC-Key' },
          request_id: c.get('requestId'),
        },
      },
      401
    );
  }

  if (apiKey !== expectedKey) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication key',
          request_id: c.get('requestId'),
        },
      },
      401
    );
  }

  // Authentication successful, proceed
  return next();
}
