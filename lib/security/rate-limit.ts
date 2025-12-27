import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting utilities using Upstash Redis.
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// Create Redis client from environment variables
const redis = Redis.fromEnv();

/**
 * General API rate limiter
 * 10 requests per 10 seconds
 * Use for general API endpoints
 */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/api",
});

/**
 * Message sending rate limiter
 * 5 messages per minute
 * Prevents message spam
 */
export const messageLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/message",
});

/**
 * Authentication attempt rate limiter
 * 5 attempts per 15 minutes
 * Prevents brute force and spam
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

/**
 * Profile action rate limiter
 * 10 actions per minute
 * Use for profile updates, repo imports, etc.
 */
export const profileActionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/profile",
});
