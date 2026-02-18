// CORS and CSRF protection utilities.

/** Origins allowed to call the API. Parsed once at startup. */
function parseAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGIN ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  );
}

let _origins: Set<string> | null = null;

function getAllowedOrigins(): Set<string> {
  if (!_origins) _origins = parseAllowedOrigins();
  return _origins;
}

/** Check whether `origin` is permitted by the configured allow-list. */
export function isOriginAllowed(origin: string | null): boolean {
  const allowed = getAllowedOrigins();
  // When no origins are configured, allow same-origin requests only
  // (origin header is absent for same-origin navigational requests).
  if (allowed.size === 0) return origin === null;
  return origin !== null && allowed.has(origin);
}

/** Standard CORS headers for an allowed origin. */
export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();

  // Resolve the value for Access-Control-Allow-Origin.
  let allowOrigin: string;
  if (allowed.size === 0) {
    // No env var set — same-origin only. Return no CORS headers so the
    // browser blocks cross-origin reads. Same-origin requests do not need
    // CORS headers.
    allowOrigin = "";
  } else {
    allowOrigin = origin && allowed.has(origin) ? origin : "";
  }

  if (!allowOrigin) return {};

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * CSRF check: validate that the request's Origin header matches the
 * allow-list, or that it matches the request URL for true same-origin
 * requests. Browsers attach an Origin header to cross-origin requests
 * and typically to same-origin POSTs, so mismatches are a strong CSRF
 * signal.
 *
 * Returns an error Response when the check fails, or null when it passes.
 */
export function checkCsrf(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (isOriginAllowed(origin)) return null;

  // Always allow true same-origin requests, even when ALLOWED_ORIGIN is
  // configured for additional cross-origin callers.
  if (origin) {
    try {
      if (new URL(request.url).origin === origin) return null;
    } catch {
      // Ignore malformed request URL and continue to rejection.
    }
  }

  return new Response(
    JSON.stringify({ error: "Forbidden — origin not allowed" }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Build a preflight (OPTIONS) response with the correct CORS headers.
 */
export function preflightResponse(request: Request): Response {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  // If origin isn't allowed, return 403 with no CORS headers.
  if (Object.keys(headers).length === 0) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, { status: 204, headers });
}

/** Reset cached origins — for test isolation only. */
export function _resetOrigins() {
  _origins = null;
}
