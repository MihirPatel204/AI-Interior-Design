import type { Request, Response, NextFunction } from "express";

/**
 * Minimal token-bucket rate limiter keyed by deviceId (header) or IP.
 * Prevents a rogue client from burning through Gemini quota.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  capacity: number;
  refillPerMinute: number;
  keyPrefix: string;
}

export function rateLimit(opts: RateLimitOptions) {
  const refillPerMs = opts.refillPerMinute / 60_000;

  return (req: Request, res: Response, next: NextFunction) => {
    const deviceId =
      (req.header("x-device-id") ??
        req.ip ??
        req.socket.remoteAddress ??
        "unknown") as string;
    const key = `${opts.keyPrefix}:${deviceId}`;

    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: opts.capacity, updatedAt: now };
      buckets.set(key, bucket);
    }

    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(
      opts.capacity,
      bucket.tokens + elapsed * refillPerMs,
    );
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      const retryAfterSec = Math.ceil((1 - bucket.tokens) / refillPerMs / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: "rate_limited",
        message: `Too many requests. Try again in ${retryAfterSec}s.`,
        retryAfterSec,
      });
      return;
    }

    bucket.tokens -= 1;
    next();
  };
}
