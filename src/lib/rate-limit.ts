type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: max - 1 };
  }
  if (cur.count >= max) {
    return { ok: false as const, remaining: 0, retryAt: cur.resetAt };
  }
  cur.count += 1;
  return { ok: true as const, remaining: max - cur.count };
}
