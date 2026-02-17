// In-memory sliding window rate limiter.
// For multi-instance production, upgrade to Redis/Upstash.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_STORE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

interface BucketEntry {
  timestamps: number[];
}

const store = new Map<string, BucketEntry>();

let lastCleanup = Date.now();

/** Remove entries with no timestamps in the current window. */
function pruneStaleEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && store.size < MAX_STORE_SIZE) {
    return;
  }
  lastCleanup = now;
  const cutoff = now - WINDOW_MS;
  for (const [ip, entry] of store) {
    if (entry.timestamps.every((t) => t <= cutoff)) {
      store.delete(ip);
    }
  }
}

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  pruneStaleEntries(now);

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Lazy cleanup: remove expired timestamps for this IP
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = oldest + WINDOW_MS - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: MAX_REQUESTS - entry.timestamps.length };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/** Reset the store — for test isolation only. */
export function _resetStore() {
  store.clear();
}
