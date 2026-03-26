import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { AppError } from '@/lib/errors'

function createRatelimit(prefix: string, requests: number, window: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
    prefix: `notely:${prefix}`,
  })
}

// 30 write operations per user per 60 seconds
export const writeRatelimit = createRatelimit('write', 30, '60 s')

/**
 * Checks rate limit for the given identifier.
 * No-ops when Upstash is not configured (local dev, test).
 * Throws AppError('RATE_LIMITED', 429) when limit exceeded.
 */
export async function checkRateLimit(identifier: string): Promise<void> {
  if (!writeRatelimit) return
  const { success } = await writeRatelimit.limit(identifier)
  if (!success) {
    throw new AppError(
      'Too many requests. Please wait a moment and try again.',
      'RATE_LIMITED',
      429,
    )
  }
}
