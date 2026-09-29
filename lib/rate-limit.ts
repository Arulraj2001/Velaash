import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

/**
 * COD Rate Limiting Configuration
 * Default thresholds: Max 3 COD orders per phone number per 24 hours,
 * max 5 COD orders per IP address per 24 hours.
 */
export const MAX_COD_ORDERS_PER_PHONE_24H = 3;
export const MAX_COD_ORDERS_PER_IP_24H = 5;
const WINDOW_SECONDS_24H = 24 * 60 * 60; // 86,400 seconds

// In-memory fallback for environments without live Upstash credentials or offline testing
interface RateLimitRecord {
  count: number;
  expiresAt: number;
}
const IN_MEMORY_RATE_LIMIT_STORE = new Map<string, RateLimitRecord>();

let upstashRedisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (upstashRedisClient) return upstashRedisClient;

  const url = env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && url.startsWith("http")) {
    try {
      upstashRedisClient = new Redis({ url, token });
      return upstashRedisClient;
    } catch (err) {
      console.warn("[RateLimit] Failed to initialize Upstash Redis, using memory store:", err);
    }
  }

  return null;
}

/**
 * Clean phone number to canonical format (e.g. 10 digits)
 */
export function sanitizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Increment and check rate limit for a specific key
 */
async function incrementAndCheckLimit(
  key: string,
  limit: number,
  ttlSeconds: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const redis = getRedisClient();

  if (redis) {
    try {
      // Upstash Redis atomic increment & expire
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return {
        allowed: current <= limit,
        current,
        limit,
      };
    } catch (err) {
      console.warn("[RateLimit] Upstash Redis call failed, falling back to memory store:", err);
    }
  }

  // In-memory fallback
  const now = Date.now();
  const existing = IN_MEMORY_RATE_LIMIT_STORE.get(key);

  if (!existing || existing.expiresAt <= now) {
    IN_MEMORY_RATE_LIMIT_STORE.set(key, {
      count: 1,
      expiresAt: now + ttlSeconds * 1000,
    });
    return { allowed: true, current: 1, limit };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    current: existing.count,
    limit,
  };
}

export interface CodRateLimitCheckResult {
  allowed: boolean;
  reason?: "PHONE_LIMIT_EXCEEDED" | "IP_LIMIT_EXCEEDED";
  errorMessage?: string;
  phoneCount?: number;
  ipCount?: number;
}

/**
 * Enforce Cash on Delivery (COD) abuse protection:
 * Blocks automated bots and fraudulent repeated COD orders by phone & IP.
 */
export async function checkCodRateLimit(params: {
  phone: string;
  ip: string;
}): Promise<CodRateLimitCheckResult> {
  const cleanPhone = sanitizePhoneNumber(params.phone);
  const cleanIp = params.ip.trim() || "unknown-ip";

  const phoneKey = `ratelimit:cod:phone:${cleanPhone}`;
  const ipKey = `ratelimit:cod:ip:${cleanIp}`;

  // 1. Check Phone Limit (Max 3 / 24h)
  const phoneCheck = await incrementAndCheckLimit(
    phoneKey,
    MAX_COD_ORDERS_PER_PHONE_24H,
    WINDOW_SECONDS_24H
  );

  if (!phoneCheck.allowed) {
    return {
      allowed: false,
      reason: "PHONE_LIMIT_EXCEEDED",
      errorMessage:
        "Too many Cash on Delivery orders from this number recently — please try online payment or contact us on WhatsApp",
      phoneCount: phoneCheck.current,
    };
  }

  // 2. Check IP Limit (Max 5 / 24h)
  const ipCheck = await incrementAndCheckLimit(
    ipKey,
    MAX_COD_ORDERS_PER_IP_24H,
    WINDOW_SECONDS_24H
  );

  if (!ipCheck.allowed) {
    return {
      allowed: false,
      reason: "IP_LIMIT_EXCEEDED",
      errorMessage:
        "Too many Cash on Delivery orders from this network recently — please try online payment or contact us on WhatsApp",
      ipCount: ipCheck.current,
    };
  }

  return {
    allowed: true,
    phoneCount: phoneCheck.current,
    ipCount: ipCheck.current,
  };
}

/**
 * Test helper to reset in-memory rate limits
 */
export function resetCodRateLimitsForTest() {
  IN_MEMORY_RATE_LIMIT_STORE.clear();
}
