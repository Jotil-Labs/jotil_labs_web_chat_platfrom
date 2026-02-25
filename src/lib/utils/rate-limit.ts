interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const visitorLimits = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS = 20;
const CLEANUP_INTERVAL = 5 * 60_000; // 5 minutes

let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of visitorLimits) {
    if (entry.resetAt <= now) {
      visitorLimits.delete(key);
    }
  }
}

export function checkVisitorRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  cleanup();

  const now = Date.now();
  const entry = visitorLimits.get(ip);

  if (!entry || entry.resetAt <= now) {
    visitorLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export function checkClientMonthlyLimit(
  messagesUsed: number,
  messageLimit: number
): boolean {
  return messagesUsed < messageLimit;
}
