import { test, expect } from '@playwright/test'

// Test: unauthenticated redirect — no storageState
test('unauthenticated user is redirected to login', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()

  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

  await context.close()
})

test('root redirects unauthenticated user to login', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()

  await page.goto('/')
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

  await context.close()
})

test('root redirects authenticated user to workspace', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })
})

test('authenticated user lands in workspace via dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Pages', { exact: true })).toBeVisible({ timeout: 10000 })
})

test('user can sign in with valid credentials', async ({ browser }) => {
  // Use a fresh context (no storageState) to test sign-in flow
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()

  await page.goto('/login')
  await page.getByLabel('Email').fill('e2e-test@notely.app')
  await page.getByLabel('Password').fill('TestPassword123!')
  await page.getByRole('button', { name: /sign in/i }).click()

  // Should redirect to workspace (URL matches /[org-slug])
  await expect(page).toHaveURL(/\/[^/]+$/, { timeout: 10000 })

  await context.close()
})
