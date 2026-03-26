import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @upstash/ratelimit and @upstash/redis before any imports
const mockLimit = vi.fn()

vi.mock('@upstash/ratelimit', () => {
  function MockRatelimit() {
    return { limit: mockLimit }
  }
  MockRatelimit.slidingWindow = vi.fn().mockReturnValue({ algorithm: 'sliding-window' })
  return { Ratelimit: MockRatelimit }
})

vi.mock('@upstash/redis', () => {
  function MockRedis() {}
  MockRedis.fromEnv = vi.fn().mockReturnValue({})
  return { Redis: MockRedis }
})

describe('ratelimit module', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    mockLimit.mockReset()
  })

  it('Test 1: writeRatelimit is null when UPSTASH_REDIS_REST_URL is undefined', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { writeRatelimit } = await import('./ratelimit')
    expect(writeRatelimit).toBeNull()
  })

  it('Test 2: writeRatelimit is a Ratelimit instance when env vars are set', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fake-upstash-url.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fake-token')
    const { writeRatelimit } = await import('./ratelimit')
    expect(writeRatelimit).not.toBeNull()
    expect(writeRatelimit).toHaveProperty('limit')
  })

  it('Test 3: checkRateLimit is a no-op when writeRatelimit is null (env guard)', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { checkRateLimit } = await import('./ratelimit')
    // Should not throw and mockLimit should not be called
    await expect(checkRateLimit('user-123')).resolves.toBeUndefined()
    expect(mockLimit).not.toHaveBeenCalled()
  })

  it('Test 4: checkRateLimit throws AppError with code RATE_LIMITED when limit.success is false', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fake-upstash-url.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fake-token')
    mockLimit.mockResolvedValue({ success: false })

    const { checkRateLimit } = await import('./ratelimit')
    const { AppError } = await import('./errors')

    await expect(checkRateLimit('user-123')).rejects.toThrow(AppError)
    await expect(checkRateLimit('user-123')).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })
})
