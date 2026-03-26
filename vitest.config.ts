import { defineConfig } from 'vitest/config'
import path from 'path'
import * as dotenv from 'dotenv'

// Load .env and .env.local for tests (needed by repository integration tests)
dotenv.config({ path: path.resolve(__dirname, '.env') })
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'src/generated'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock server-only in test environment — it throws by default but is safe to skip in Vitest
      'server-only': path.resolve(__dirname, './src/__mocks__/server-only.ts'),
    },
  },
})
