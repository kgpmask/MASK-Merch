const windows = new Map<string, { count: number; resetAt: number }>();
export function assertRateLimit(key: string, limit = 10, windowMs = 60_000): void {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) { windows.set(key, { count: 1, resetAt: now + windowMs }); return; }
  if (current.count >= limit) throw new Error("RATE_LIMITED");
  current.count += 1;
}
