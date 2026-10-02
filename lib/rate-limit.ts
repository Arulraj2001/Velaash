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

  const hasPlaceholderCredentials =
    /placeholder|your[-_ ]|example/i.test(url || "") ||
    /placeholder|your[-_ ]/i.test(token || "");

  if (url && token && url.startsWith("http") && !hasPlaceholderCredentials) {
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

/**
 * Track Order Lookup Rate Limiting
 * Threshold: Max 5 failed lookups per IP per 15 minutes.
 */
export const MAX_FAILED_TRACK_LOOKUPS_PER_IP = 5;
export const TRACK_RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 900 seconds (15 min)

export async function checkTrackOrderRateLimit(ip: string): Promise<{
  allowed: boolean;
  errorMessage?: string;
  attempts?: number;
}> {
  const cleanIp = ip.trim() || "unknown-ip";
  const key = `ratelimit:track:ip:${cleanIp}`;

  const redis = getRedisClient();
  if (redis) {
    try {
      const val = await redis.get<number>(key);
      const current = val ? Number(val) : 0;
      if (current >= MAX_FAILED_TRACK_LOOKUPS_PER_IP) {
        return {
          allowed: false,
          errorMessage:
            "Too many failed tracking attempts. Please wait a few minutes before trying again or sign in to your account.",
          attempts: current,
        };
      }
      return { allowed: true, attempts: current };
    } catch (err) {
      console.warn("[RateLimit] Upstash Redis get failed for track order, falling back to memory:", err);
    }
  }

  // In-memory check
  const now = Date.now();
  const existing = IN_MEMORY_RATE_LIMIT_STORE.get(key);
  if (existing && existing.expiresAt > now) {
    if (existing.count >= MAX_FAILED_TRACK_LOOKUPS_PER_IP) {
      return {
        allowed: false,
        errorMessage:
          "Too many failed tracking attempts. Please wait a few minutes before trying again or sign in to your account.",
        attempts: existing.count,
      };
    }
    return { allowed: true, attempts: existing.count };
  }

  return { allowed: true, attempts: 0 };
}

export async function recordFailedTrackOrderAttempt(ip: string): Promise<void> {
  const cleanIp = ip.trim() || "unknown-ip";
  const key = `ratelimit:track:ip:${cleanIp}`;
  await incrementAndCheckLimit(key, MAX_FAILED_TRACK_LOOKUPS_PER_IP, TRACK_RATE_LIMIT_WINDOW_SECONDS);
}

export function resetTrackOrderRateLimitsForTest() {
  IN_MEMORY_RATE_LIMIT_STORE.clear();
}

